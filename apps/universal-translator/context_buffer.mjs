// context_buffer.mjs — 跨句脈絡記憶 (conversation context awareness)
// ============================================================================
// 解決即時字幕「逐句孤立翻譯、失去代詞指代/時態連貫」的痛點。
//
// 設計原則 (遵循免費算立 + 優雅回落):
//   - 純記憶體 LRU, 零依賴、零 key、零費用。
//   - 預設啟用 (CONTEXT_AWARE !== '0'), 但僅作「脈絡增強」:
//       * Gemini 引擎 (設 key 時): 把近期前文注入 systemInstruction, 提升代詞/時態連貫。
//       * 免費鏈 (google-gtx 等): 前文仍被記錄 (供 UI 顯示「前文」與未來用途),
//         但翻譯輸出維持原樣 — 誠實降級, 不假造脈絡效果。
//   - 以 room (會議房) 為隔離單位, 避免不同會議互相污染。
//   - 提供 /context/status 與 /context/reset 端點供運維與 UI 使用。
// ============================================================================

const ENABLED = process.env.CONTEXT_AWARE !== '0';
const MAX_PER_ROOM = Number(process.env.CONTEXT_MAX || 12);   // 每房保留最近 N 句
const TTL_MS = Number(process.env.CONTEXT_TTL_MS || 10 * 60 * 1000); // 10 分鐘無活動即過期

/** @type {Map<string, Array<{src:string, tgt:string, from?:string, to?:string, ts:number}>>} */
const rooms = new Map();

/**
 * 產生 room 鍵 (空 room 落到 default)
 * @param {string} [room]
 * @returns {string}
 */
function roomKey(room) {
  return room && room.length ? room : '__default__';
}

/** 記錄一句 (來源文字 + 其翻譯), 滾動視窗管理
 * @param {{room?:string, src:string, tgt?:string, from?:string, to?:string}} u */
export function recordUtterance({ room = '', src, tgt, from, to }) {
  if (!ENABLED || !src) return;
  const key = roomKey(room);
  let arr = rooms.get(key);
  if (!arr) { arr = []; rooms.set(key, arr); }
  arr.push({ src, tgt: tgt || '', from, to, ts: Date.now() });
  // 截斷 + 過期清理
  const cutoff = Date.now() - TTL_MS;
  const pruned = arr.filter((u) => u.ts >= cutoff);
  while (pruned.length > MAX_PER_ROOM) pruned.shift();
  rooms.set(key, pruned);
}

/**
 * 取回某房近期前文 (舊→新), 用於注入翻譯提示
 * @param {{room?:string, lastN?:number}} [opt]
 * @returns {Array<{src:string, tgt:string, from?:string, to?:string, ts:number}>}
 */
export function getContext({ room = '', lastN } = {}) {
  if (!ENABLED) return [];
  const arr = rooms.get(roomKey(room)) || [];
  const n = Number(lastN || MAX_PER_ROOM);
  return arr.slice(-n);
}

/**
 * 把前文壓成「可注入提示」的文字 (供 Gemini systemInstruction 使用)
 * @param {{room?:string, lastN?:number}} [opt]
 * @returns {string}
 */
export function buildContextHint({ room = '', lastN } = {}) {
  const ctx = getContext({ room, lastN });
  if (!ctx.length) return '';
  const lines = ctx
    .filter((u) => u.src && u.tgt)
    .map((u, i) => `${i + 1}. (${u.from || '?'}) ${u.src}\n   → (${u.to || '?'}) ${u.tgt}`);
  return lines.length ? '先前對話脈絡 (供連貫參考, 勿重複翻譯):\n' + lines.join('\n') : '';
}

export function resetRoom(room = '') {
  rooms.delete(roomKey(room));
}

export function contextStatus() {
  /** @type {Record<string, number>} */
  const snapshot = {};
  for (const [k, arr] of rooms.entries()) snapshot[k] = arr.length;
  return {
    enabled: ENABLED,
    maxPerRoom: MAX_PER_ROOM,
    ttlMs: TTL_MS,
    rooms: snapshot,
    totalUtterances: [...rooms.values()].reduce((s, a) => s + a.length, 0),
  };
}

export function isContextEnabled() { return ENABLED; }
