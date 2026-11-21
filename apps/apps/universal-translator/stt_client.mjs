// ============================================================
// 萬能即時翻譯 — STT 客戶端 (語音轉雙語字幕編排)
// 終始矩陣: 契約見 ISpeechToSubtitleRequest / ISpeechToSubtitleResult (shared/types.ts)
// 鎖定繁中↔英文雙向: detected=zh-TW|en, 對向自動互譯
// 5T: engine 標記 ollama:<model> (翻譯) + stt:whisper (辨識)
// @ts-check
/// <reference path="./types/generated/esggo-shared.d.ts" />
// ============================================================

import { translateDetailed, hashOf } from './translate.mjs';

const STT_PORT = Number(process.env.STT_PORT || 8791);
const STT_URL = `http://127.0.0.1:${STT_PORT}/transcribe`;

/**
 * 規範 STT 回傳語為雙向鎖定值 (zh-TW | en), 其他視為 unknown 仍容許但不保證對向
 * @param {string} lang
 * @returns {'zh-TW' | 'en'}
 */
function normDetected(lang) {
  const l = String(lang || '').toLowerCase();
  if (l.startsWith('zh') || l === 'chinese') return 'zh-TW';
  if (l.startsWith('en') || l === 'english') return 'en';
  // 無法判定則默認英文來源 (最常見 studio 場景)
  return 'en';
}

/**
 * 對向語: zh-TW -> en, en -> zh-TW
 * @param {'zh-TW' | 'en'} src
 * @returns {'zh-TW' | 'en'}
 */
function opposite(src) {
  return src === 'zh-TW' ? 'en' : 'zh-TW';
}

/**
 * 語音位元組 -> 即時雙語字幕 (STT + 雙向翻譯)
 * @param {Buffer | Uint8Array} audioBuf
 * @param {string} [langHint]  'zh-TW' | 'en' 鎖定雙向
 * @returns {Promise<import('./types/generated/esggo-shared.d.ts').ISpeechToSubtitleResult>}
 */
export async function speechToSubtitle(audioBuf, langHint) {
  const hint = langHint === 'zh-TW' || langHint === 'en' ? langHint : '';
  const sttRes = await fetch(`${STT_URL}?lang=${encodeURIComponent(hint)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/octet-stream' },
    body: new Uint8Array(audioBuf),
    signal: AbortSignal.timeout(Number(process.env.STT_TIMEOUT_MS || 30000)),
  });
  if (!sttRes.ok) {
    let detail = '';
    try { detail = (await sttRes.json()).error || ''; } catch { /* ignore */ }
    const msg = detail || `STT HTTP ${sttRes.status}`;
    // 區分「服務未啟動」(502/ECONNREFUSED) vs 其他
    if (sttRes.status === 502 || sttRes.status === 503 || /ECONNREFUSED|fetch failed/i.test(msg)) {
      throw new Error('STT_UNAVAILABLE:本地 faster-whisper (8791) 未啟動 — 請部署 apps/stt');
    }
    throw new Error('STT ' + msg);
  }
  const sttJson = await sttRes.json();

  const text = sttJson.text || '';
  const detected = normDetected(sttJson.language || hint || 'en');
  const target = opposite(detected);

  if (!text.trim()) {
    return { text: '', detected, translation: '', target, engine: 'stt:empty', cached: false };
  }

  const rec = await translateDetailed(text, detected, target);
  return {
    text,
    detected,
    translation: rec.text,
    target,
    engine: rec.engine,
    cached: rec.cached,
    trace: hashOf(text).slice(0, 16),
  };
}
