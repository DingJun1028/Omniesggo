// ============================================================
// OmniLive — 翻譯層 (雙語)
// 將辨識結果轉為雙語字幕：原文 (source) + 目標語翻譯 (target)。
// 純免費鏈: google-gtx(零key) → mymemory(免費) → 原文兜底 (零付費 key)。
// 可選: GEMINI_API_KEY 啟用最前端增強; 失敗自動回落免費鏈。
// 5T: engine 標記 (可溯源)。對齊 universal-translator 引擎規範。
// @ts-check
// ============================================================

import crypto from 'node:crypto';

/** @type {Map<string, {text:string, engine:string}>} */
const CACHE = new Map();
const CACHE_MAX = 1000;

/**
 * @param {() => Promise<string>} fn
 * @param {string} label
 * @param {number} retries
 * @returns {Promise<string>}
 */
async function withRetry(fn, label, retries) {
  let lastErr;
  for (let i = 0; i <= retries; i++) {
    try { return await fn(); } catch (/** @type {any} */ e) { lastErr = e; if (i < retries) await new Promise(r => setTimeout(r, 200 * 2 ** i)); }
  }
  throw new Error(`${label}: ${lastErr instanceof Error ? lastErr.message : String(lastErr)}`);
}

// --- 引擎: Google gtx (免費, 零 key, 支援 auto) ---
async function viaGoogleGtx(text, from, to) {
  const sl = from === 'zh-TW' ? 'zh-TW' : from === 'en' ? 'en' : (from || 'auto');
  const tl = to === 'zh-TW' ? 'zh-TW' : to === 'en' ? 'en' : (to || 'en');
  const u = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(sl)}&tl=${encodeURIComponent(tl)}&dt=t&q=${encodeURIComponent(text)}`;
  const r = await fetch(u, { signal: AbortSignal.timeout(8000), headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!r.ok) throw new Error('gtx HTTP ' + r.status);
  const d = await r.json();
  const out = (d[0] || []).map((/** @type {Array<string>} */ x) => x[0]).join('');
  if (!out) throw new Error('gtx empty');
  return out;
}

// --- 引擎: MyMemory (免費, 零 key) ---
async function viaMyMemory(text, from, to, email) {
  const srcN = from === 'zh-TW' ? 'zh-CN' : from === 'en' ? 'en' : (from || 'en');
  const tgtN = to === 'zh-TW' ? 'zh-CN' : to === 'en' ? 'en' : (to || 'en');
  const lp = `${srcN}|${tgtN}`;
  const de = email ? `&de=${encodeURIComponent(email)}` : '';
  const u = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(lp)}${de}`;
  const r = await fetch(u, { signal: AbortSignal.timeout(8000), headers: { 'User-Agent': 'OmniLive/1.0' } });
  if (!r.ok) throw new Error('mymemory HTTP ' + r.status);
  const d = await r.json();
  if (Number(d.responseStatus) !== 200) throw new Error(d.responseDetails || 'mymemory fail');
  const out = d.responseData?.translatedText || '';
  if (!out) throw new Error('mymemory empty');
  return /** @type {string} */ (out);
}

// --- 引擎: Gemini (可選雲端增強) ---
/** @param {string} text @param {string} from @param {string} to @param {string} key @param {string} model */
async function viaGemini(text, from, to, key, model) {
  const sl = from === 'zh-TW' ? 'zh-TW' : from === 'en' ? 'en' : (from || 'auto');
  const tl = to === 'zh-TW' ? 'zh-TW' : to === 'en' ? 'en' : (to || 'en');
  const sys = `You are a professional real-time translator. Translate the following ${sl} text into ${tl}. Output ONLY the direct translation: no quotes, no explanations.`;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: sys }] },
      contents: [{ role: 'user', parts: [{ text }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 1024, candidateCount: 1 },
    }),
    signal: AbortSignal.timeout(10000),
  });
  if (!r.ok) throw new Error('gemini HTTP ' + r.status);
  const d = await r.json();
  const out = (d?.candidates?.[0]?.content?.parts || []).map(/** @param {{text?:string}} p */ (p) => p.text || '').join('').trim();
  if (!out) throw new Error('gemini empty');
  return out.replace(/^["'「『]|["'」』]$/g, '').trim();
}

/**
 * @typedef {Object} TranslateResult
 * @property {string} source    原文
 * @property {string} target    翻譯結果
 * @property {string} from      原文語言
 * @property {string} to        目標語言
 * @property {string} engine    實際使用引擎
 * @property {boolean} cached
 */

/** 輕量語言偵測 (零依賴/零 key): 依 CJK 字元比例判斷 繁中/英文 */
// 僅含中日韓統一表意文字 (漢字) 範圍, 不含平假名/片假名, 避免誤判日文
const CJK = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/;
export function detectLang(text) {
  if (!text || !text.trim()) return 'en';
  let cjk = 0, total = 0;
  for (const ch of text) {
    if (/\s/.test(ch)) continue;
    total++;
    if (CJK.test(ch)) cjk++;
  }
  if (total === 0) return 'en';
  // 含 CJK 字元比例 > 15% 視為中文, 否則英文
  return (cjk / total) > 0.15 ? 'zh-TW' : 'en';
}

/**
 * 將單段文字翻譯為雙語結果。
 * from 可為 'auto' → 自動偵測來源語 (繁中/英文) 並翻向 to (to='auto' 時取對向)。
 * @param {string} text
 * @param {string} from  'zh-TW' | 'en' | 'auto'
 * @param {string} to    'zh-TW' | 'en' | 'auto'
 * @param {{translateTimeoutMs?:number, translateRetries?:number, myMemoryEmail?:string, geminiApiKey?:string, geminiModel?:string, mock?:boolean}} [opts]
 * @returns {Promise<TranslateResult>}
 */
export async function translate(text, from, to, opts = {}) {
  if (!text || !text.trim()) return { source: text, target: '', from, to, engine: 'passthrough', cached: false };

  // 自動判斷: from=auto → 偵測來源; to=auto → 取對向
  let f = from, t = to;
  if (f === 'auto' || f === t) {
    const detected = detectLang(text);
    f = detected;
    t = (t && t !== 'auto' && t !== detected) ? t : (detected === 'zh-TW' ? 'en' : 'zh-TW');
  }
  // 寫回 from/to, 後續快取/翻譯皆使用偵測後的語言對
  from = f; to = t;
  if (from === to) return { source: text, target: text, from, to, engine: 'passthrough', cached: false };

  // 離線測試縫 (OMNILIVE_TRANSLATE_MOCK=1 或 opts.mock)：CI / 無網路環境下驗證整條資料流
  if (process.env.OMNILIVE_TRANSLATE_MOCK === '1' || opts.mock) {
    return { source: text, target: `[MOCK:${from}→${to}] ${text}`, from, to, engine: 'mock', cached: false };
  }

  const k = `${from}|${to}|${text}`;
  const hit = CACHE.get(k);
  if (hit) { if (CACHE.size > CACHE_MAX) CACHE.delete(CACHE.keys().next().value); CACHE.set(k, hit); return { source: text, target: hit.text, from, to, engine: hit.engine, cached: true }; }

  const retries = opts.translateRetries ?? 2;
  /** @type {Array<[string, () => Promise<string>]>} */
  const chain = [];
  if (opts.geminiApiKey) chain.push(['gemini', () => viaGemini(text, from, to, opts.geminiApiKey, opts.geminiModel || 'gemini-2.5-flash')]);
  chain.push(['google-gtx', () => viaGoogleGtx(text, from, to)]);
  chain.push(['mymemory', () => viaMyMemory(text, from, to, opts.myMemoryEmail || '')]);

  for (const [name, fn] of chain) {
    try {
      const target = await withRetry(fn, name, retries);
      const rec = { text: target, engine: name };
      CACHE.set(k, rec);
      if (CACHE.size > CACHE_MAX) { const oldest = CACHE.keys().next().value; if (oldest) CACHE.delete(oldest); }
      return { source: text, target, from, to, engine: name, cached: false };
    } catch { /* 換下一引擎 */ }
  }
  // 誠實回落: 所有引擎失敗 → 原文兜底 (不中斷流程)
  return { source: text, target: text, from, to, engine: 'fallback-origin', cached: false };
}

/** 5T: 產生不可篡改 trace (hash of source text) */
export function hashOf(s) { return crypto.createHash('sha256').update(s).digest('hex').slice(0, 16); }
