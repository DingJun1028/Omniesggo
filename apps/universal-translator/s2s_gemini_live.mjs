// s2s_gemini_live.mjs — 已停用 (De-Google 政策, 2026-10-27)
// ============================================================================
// Gemini/Google 已全面禁用: 本模組原先經 Gemini Live API 提供 speech-to-speech
// 同傳 (需付費 GEMINI_API_KEY)。依「禁用 Google/Gemini/Firebase」政策, 雲端
// S2S 升級路徑永久關閉, 一律回落至免費的 STT → 翻譯 → 字幕 管線。
// 介面保留 (isS2SEnabled / s2sStatus / createS2SSession / gracefulFallback),
// 使 server.mjs 等呼叫端無需改動。
// ============================================================================

export function isS2SEnabled() {
  // Gemini 已禁用 — 永遠回 false
  return false;
}

export function s2sStatus() {
  return {
    enabled: false,
    engine: 'free-stt-translate-subtitle',
    reason: 'gemini-disabled-by-policy',
    note: 'Gemini 雲端 S2S 已依 De-Google 政策永久停用；使用免費 STT → 翻譯 → 字幕 管線。',
  };
}

export async function createS2SSession(_opts = {}) {
  throw new Error('S2S disabled: Gemini 已全面禁用 (De-Google 政策)');
}

export function gracefulFallback() {
  return {
    engine: 'free-stt-translate-subtitle',
    note: 'Gemini S2S 已停用，回落免費管線',
  };
}
