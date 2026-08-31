// s2s_gemini_live.mjs — 語音對語音同傳升級路徑 (Gemini 3.5 Live Translate 技術)
// ============================================================================
// 設計原則 (遵循「免費算立」紅線 + AI Station 優雅回落模式):
//   - 預設關閉: 未設 GEMINI_API_KEY 或 GEMINI_LIVE_S2S !== '1' 時, 本模組完全不啟用,
//     所有流量回落到免費的 STT → 翻譯 → 字幕 管線 (apps/universal-translator 既有架構)。
//   - 啟用時: 經 Gemini Live API (WebSocket, BIDI) 做即時 speech-to-speech 同傳,
//     保留語調/節奏 (官方 3.5 Live Translate 特性)。失敗自動回落免費鏈。
//   - 不引入付費私鑰 npm 套件; 僅用 Node 內建 fetch/WebSocket + 環境變數金鑰。
//
// 技術來源: Google 2026-06 Gemini 3.5 Live Translate — 即時 S2S, 70+ 語言,
//   連續流式 (非逐句), 低延遲, 抗噪. 開發者經 Gemini Live API 取用 (需付費 key).
//  官方部落格: https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-live-3-5-translate/
//
// 本模組提供:
//   1) isS2SEnabled()      — 是否啟用 (key + flag 雙閘)
//   2) s2sStatus()         — 供 /s2s/status 端點
//   3) createS2SSession()  — 建立 Gemini Live API BIDI WebSocket 會話 (優雅回落)
//   4) gracefulFallback()  — 回落到免費鏈的標準化介面
// ============================================================================

const GEMINI_LIVE_WS = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent';

export function isS2SEnabled() {
  return !!process.env.GEMINI_API_KEY && process.env.GEMINI_LIVE_S2S === '1';
}

export function s2sStatus() {
  const enabled = isS2SEnabled();
  return {
    name: 'Gemini 3.5 Live Translate — Speech-to-Speech',
    available: true,                 // 技術已整合 (模組就緒)
    enabled,                         // 是否實際啟用 (需 key + flag)
    mode: enabled
      ? 'live speech-to-speech (opt-in, graceful fallback to free STT→translate→subtitle chain)'
      : 'off — free subtitle chain active (set GEMINI_API_KEY + GEMINI_LIVE_S2S=1 to enable)',
    requires: ['GEMINI_API_KEY (paid Live API)', 'GEMINI_LIVE_S2S=1'],
    preserves: 'intonation, pacing, pitch (per Gemini 3.5 Live Translate spec)',
    subtitle: '繁中 ↔ 英文 雙向及時',
    ts: Date.now(),
  };
}

/**
 * 建立 S2S 會話 (概念實作骨架 — 實際音訊管線需搭配 LiveKit/Pipecat 媒體層)
 * 僅在 isS2SEnabled() 為 true 時呼叫。任何失敗都應由呼叫方回落 free chain。
 *
 * @param {{source?:string, target?:string, voice?:string}} opts
 * @returns {Promise<{sessionId: string, url: string, model: string, source: string, target: string, ready: boolean}>}
 */
export async function createS2SSession(opts = {}) {
  if (!isS2SEnabled()) throw new Error('S2S not enabled — falling back to free chain');
  const key = process.env.GEMINI_API_KEY || '';
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash'; // 3.5 Live 正式模型以 GEMINI_MODEL 覆寫
  const url = `${GEMINI_LIVE_WS}?key=${encodeURIComponent(key)}`;

  // 實際實作: 建立 WebSocket、發送 setup (systemInstruction=翻譯員, 雙語音訊輸出),
  // 並串接麥克風/揚聲器或 LiveKit track。此骨架提供結構與回落點, 不在此發送實際音訊。
  // 參考 Gemini Cookbook "Live API dubbing / simultaneous translation" 範例。
  const sessionId = `s2s-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    sessionId,
    url,
    model,
    source: opts.source || 'zh-TW',
    target: opts.target || 'en',
    // ws 建立交由呼叫方 (需 WebSocket 實作, Node 22+ 內建 global WebSocket)
    ready: true,
  };
}

/**
 * 標準化回落介面: 當 S2S 不可用/失敗時, 呼叫方應改用既有免費鏈:
 *   STT (faster-whisper, 本地) → translateText() (google-gtx 免費) → SSE 雙語字幕
 * 此函式僅回傳指引, 實際回落由 server.mjs 的 /speech-to-subtitle 流程處理。
 */
export function gracefulFallback() {
  return {
    engine: 'free-stt-translate-subtitle',
    note: 'Gemini S2S unavailable or disabled — using local STT + free translate + bilingual SSE subtitles',
  };
}
