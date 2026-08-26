// ============================================================
// OmniLive Memory Integration — 深貫廣通無礪圓通共享記憶
//
// 整合 TencentDB Agent Memory (TDAI) 到浮動窗矩陣
// 深貫: 每個字幕行 → 共享記憶 (traceable provenance)
// 廣通: 跨房間/跨語言記憶同步
// 無礪: 記憶寫入失敗不影響翻譯流程 (graceful degradation)
// 圓通: 記憶 ↔ 字幕 ↔ 音訊 ↔ RWD 配置 四向同步
// ============================================================

/**
 * 記憶層 API 客戶端
 * TDAI Gateway: http://tdai-memory-gateway:8420
 * 本地開發: http://localhost:8420
 */
const MEMORY_GATEWAY = process.env.MEMORY_CORE_GATEWAY_URL || 'http://localhost:8420';
const MEMORY_TOKEN = process.env.MEMORY_CORE_GATEWAY_API_KEY || 'local';

/**
 * 深貫: 將字幕行存為共享記憶 (Traceable provenance)
 */
export async function storeSubtitleAsMemory(subtitle, roomId, role = 'caster') {
  if (!subtitle || !subtitle.text) return null;

  const memory = {
    // 5T Traceable: source_origin 標記
    source_origin: subtitle.source_origin || 'sse',
    // 5T Trackable: 生命週期時間戳
    created_at: Date.now(),
    // 深貫廣通: 將字幕內容與房間上下文結合
    text: subtitle.text,
    translation: subtitle.translation || '',
    room_id: roomId,
    role: role,
    // 廣通: 跨語言記憶索引
    lang_from: subtitle.lang_from || 'zh-TW',
    lang_to: subtitle.lang_to || 'en',
    // 圓通: 與 RWD 斷點關聯
    rwd_breakpoint: subtitle.rwd_breakpoint || 'desktop',
  };

  // 無礪: 非阻塞記憶寫入, 失敗不影響主流程
  try {
    const res = await fetch(`${MEMORY_GATEWAY}/v1/memory`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MEMORY_TOKEN}`,
      },
      body: JSON.stringify(memory),
      signal: AbortSignal.timeout(3000), // 3 秒超時
    });

    if (!res.ok) {
      // 深貫廣通: 失敗不阻斷主流程, 記錄日誌
      return null;
    }

    const data = await res.json();
    return data.memory_id || data.id || null;
  } catch (err) {
    // 無礪: 記憶寫入失敗不影響翻譯流程
    return null;
  }
}

/**
 * 廣通: 從共享記憶檢索上下文 (供翻譯前文增強)
 */
export async function retrieveMemoryContext(roomId, limit = 5) {
  if (!roomId) return [];

  try {
    const res = await fetch(`${MEMORY_GATEWAY}/v1/memory/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MEMORY_TOKEN}`,
      },
      body: JSON.stringify({
        filter: { room_id: roomId },
        sort: { created_at: -1 },
        limit,
      }),
      signal: AbortSignal.timeout(3000),
    });

    if (!res.ok) return [];

    const data = await res.json();
    return Array.isArray(data.results) ? data.results : [];
  } catch (err) {
    return [];
  }
}

/**
 * 圓通: 同步 5T 驗算結果到共享記憶
 */
export async function storeFiveTResult(hashLock, score, details) {
  try {
    await fetch(`${MEMORY_GATEWAY}/v1/memory`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MEMORY_TOKEN}`,
      },
      body: JSON.stringify({
        source_origin: '5t-verification',
        type: 'five_t_result',
        data: { hashLock, score, details },
        created_at: Date.now(),
      }),
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    // 無礪: 失敗不影響
  }
}
