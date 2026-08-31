// ============================================================
// 萬能即時翻譯引擎 v2 — 可插拔 / 零依賴 / 最佳實踐化
// 引擎優先序: [Ollama+Gemma(選用)] → Google gtx(免費,零key,支援auto/zh-TW) → LibreTranslate(自建) → MyMemory(免費) → 原文兜底
// 強化: 平行翻譯、指數退避重試、逾時、LRU 快取、engine 標記(5T 可溯源)、postProcess 後處理(品質/精準度)
// 雙向 TS 終始矩陣: 繁中英碼規範單一真源於 shared/lang-matrix.mjs
//   經 scripts/sync-lang-matrix.mjs 產生本 consumer 副本 types/generated/lang-matrix.mjs (執行期與型別雙向同步)
//   各引擎不再手刻 normalize —— 改由 toCanonical(輸入容錯) + toEngineLang(碼矩陣查表) 統一
// @ts-check
/// <reference path="./types/generated/esggo-shared.d.ts" />
// ============================================================
import crypto from 'node:crypto';
import { toCanonical, toEngineLang } from './types/generated/lang-matrix.mjs';

const CACHE = new Map();
const CACHE_MAX = Number(process.env.TRANSLATE_CACHE_MAX || 1000);
const TIMEOUT_MS = Number(process.env.TRANSLATE_TIMEOUT_MS || 8000);
const RETRIES = Number(process.env.TRANSLATE_RETRIES || 2);

const cacheKey = (/** @type {string} */ t, /** @type {string} */ from, /** @type {string} */ to) => `${from}|${to}|${t}`;
/**
 * @template V
 * @param {Map<string, V>} cache
 * @param {string} k
 * @returns {V | undefined}
 */
function cacheGet(cache, k) { const v = cache.get(k); if (v !== undefined) { cache.delete(k); cache.set(k, v); } return v; }
/**
 * @template V
 * @param {Map<string, V>} cache
 * @param {string} k
 * @param {V} v
 */
function cacheSet(cache, k, v) { cache.set(k, v); if (cache.size > CACHE_MAX) { const oldest = cache.keys().next().value; if (oldest) cache.delete(oldest); } }

export const stats = { calls: 0, cacheHits: 0, errors: 0, byEngine: /** @type {Record<string, number>} */ (Object.create(null)) };

const sleep = (/** @type {number} */ ms) => new Promise(r => setTimeout(r, ms));

/**
 * @template T
 * @param {() => Promise<T>} fn
 * @param {string} label
 * @returns {Promise<T>}
 */
async function withRetry(fn, label) {
  /** @type {unknown} */
  let lastErr;
  for (let i = 0; i <= RETRIES; i++) {
    try { return await fn(); }
    catch (/** @type {any} */ e) {
      lastErr = e;
      if (i < RETRIES) await sleep(200 * 2 ** i);
    }
  }
  throw new Error(`${label}: ${lastErr instanceof Error ? lastErr.message : String(lastErr)}`);
}

// --- 引擎 0: Ollama + Gemma (本地 LLM, 翻譯更準, 需自行部署 ollama 並 pull 模型) ---
/**
 * @param {string} text
 * @param {string} from
 * @param {string} to
 * @returns {Promise<string>}
 */
async function viaOllama(text, from, to) {
  const base = process.env.OLLAMA_URL || 'http://localhost:11434';
  const model = process.env.OLLAMA_MODEL || 'gemma3';
  const sl = toEngineLang('ollama', toCanonical(from)); // 矩陣查表: zh-TW→zh-TW, auto→auto-detect
  const tl = toEngineLang('ollama', toCanonical(to));
  const sys = 'You are a professional translator. Output ONLY the direct translation, no quotes, no explanations, no extra text.';
  const prompt = `Translate the following text from ${sl} to ${tl}.\nText: ${text}`;
  const r = await fetch(`${base}/api/generate`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt, system: sys, stream: false, options: { temperature: 0.1 } }),
    signal: AbortSignal.timeout(Number(process.env.OLLAMA_TIMEOUT_MS || 30000))
  });
  if (!r.ok) throw new Error('ollama HTTP ' + r.status);
  const d = await r.json();
  let out = (d.response || '').trim();
  if (!out) throw new Error('ollama empty');
  out = out.replace(/^[\"'「『]/, '').replace(/[\"'」』]$/, '');
  out = out.replace(/^(translation|譯文|翻譯)[:：]\s*/i, '');
  return out;
}

// --- 引擎 0.5: Gemini 3.5 Live Translate (可選雲端增強, 需 GEMINI_API_KEY) ---
// 技術來源: Google 2026-06 發布 Gemini 3.5 Live Translate — 即時 speech-to-speech 翻譯, 自動偵測 70+ 語言,
//   連續流式 (非逐句), 保留語調/節奏, 低延遲, 抗噪. 開發者經 Gemini Live API 取用.
// 本引擎取其「最新翻譯品質」做為文字翻譯的最前端增強層; 真正的 S2S 語音同傳為升級路徑 (見 GEMINI_LIVE_3_5_INTEGRATION.md).
// 預設關閉: 未設 GEMINI_API_KEY 時不進入引擎鏈, 維持純免費零 key 運作. 設了 key 但失敗 → 優雅回落免費鏈.
const GEMINI_TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS || 10000);
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash'; // 3.5 Live 正式模型以 GEMINI_MODEL 覆寫
/**
 * @param {string} text
 * @param {string} from
 * @param {string} to
 * @param {string} [ctxHint]
 * @returns {Promise<string>}
 */
async function viaGeminiLive35(text, from, to, ctxHint) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY not configured');
  // 語碼映射沿用 google-gtx 規範 (zh-TW→zh-TW, en→en, auto→auto)
  const sl = toEngineLang('google-gtx', toCanonical(from));
  const tl = toEngineLang('google-gtx', toCanonical(to));
  let sys = `You are Gemini 3.5 Live Translate, a professional real-time speech translation engine. ` +
    `Translate the following ${sl} text into ${tl}. Output ONLY the direct translation: no quotes, no explanations, no extra text. Preserve tone, meaning and natural phrasing.`;
  // 脈絡增強: 注入近期前文, 提升代詞指代/時態連貫 (僅 Gemini 引擎支援; 免費鏈誠實降級)
  if (ctxHint) sys += '\n\n' + ctxHint;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(key)}`;
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: sys }] },
      contents: [{ role: 'user', parts: [{ text }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 2048, candidateCount: 1 },
    }),
    signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
  });
  if (!r.ok) throw new Error('gemini HTTP ' + r.status);
  const d = await r.json();
  const parts = (d?.candidates?.[0]?.content?.parts) || [];
  const out = parts.map((/** @type {{text?:string}} */ p) => p.text || '').join('').trim();
  if (!out) throw new Error('gemini empty');
  return postProcess(out);
}

// --- 引擎 1: Google Translate 非官方 gtx endpoint (免費, 零 key, 支援 auto 偵測) ---
/**
 * @param {string} text
 * @param {string} from
 * @param {string} to
 * @returns {Promise<string>}
 */
async function viaGoogleGtx(text, from, to) {
  const sl = toEngineLang('google-gtx', toCanonical(from));
  const tl = toEngineLang('google-gtx', toCanonical(to));
  const u = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(sl)}&tl=${encodeURIComponent(tl)}&dt=t&q=${encodeURIComponent(text)}`;
  const r = await fetch(u, { signal: AbortSignal.timeout(TIMEOUT_MS), headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!r.ok) throw new Error('gtx HTTP ' + r.status);
  const d = await r.json();
  const segments = d[0] || [];
  const out = segments.map((/** @type {Array<string>} */ x) => x[0]).join('');
  if (!out) throw new Error('gtx empty');
  return out;
}

// --- 引擎 2: LibreTranslate (自建, env LIBRETRANSLATE_URL) ---
/**
 * @param {string} text
 * @param {string} from
 * @param {string} to
 * @returns {Promise<string>}
 */
async function viaLibre(text, from, to) {
  const base = process.env.LIBRETRANSLATE_URL || '';
  const sf = toEngineLang('libretranslate', toCanonical(from)); // 矩陣: auto→en, zh-TW→zh
  const st = toEngineLang('libretranslate', toCanonical(to));
  /** @type {any} */
  const body = { q: text, source: sf, target: st, format: 'text' };
  if (process.env.LIBRETRANSLATE_KEY) body.api_key = process.env.LIBRETRANSLATE_KEY;
  const r = await fetch(base, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!r.ok) throw new Error('libre HTTP ' + r.status);
  const d = await r.json();
  if (!d.translatedText) throw new Error('libre empty');
  return d.translatedText;
}

// --- 引擎 3: MyMemory (免費, 零 key) — 加 email 參數提升配額與品質 ---
/**
 * @param {string} text
 * @param {string} from
 * @param {string} to
 * @returns {Promise<string>}
 */
async function viaMyMemory(text, from, to) {
  const srcN = toEngineLang('mymemory', toCanonical(from)); // 矩陣: auto→en, zh-TW→zh-CN
  const tgtNorm = toEngineLang('mymemory', toCanonical(to));
  const lp = `${srcN}|${tgtNorm}`;
  const email = process.env.MYMEMORY_EMAIL ? `&de=${encodeURIComponent(process.env.MYMEMORY_EMAIL)}` : '';
  const u = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(lp)}${email}`;
  const r = await fetch(u, { signal: AbortSignal.timeout(TIMEOUT_MS), headers: { 'User-Agent': 'OmniBlueprintHub/0.6' } });
  if (!r.ok) throw new Error('mymemory HTTP ' + r.status);
  const d = await r.json();
  if (Number(d.responseStatus) !== 200) throw new Error(d.responseDetails || 'mymemory fail');
  return postProcess(d.responseData.translatedText);
}

// --- 後處理 ---
const GLOSSARY = parseGlossaryEnv();
function parseGlossaryEnv() {
  const raw = process.env.GLOSSARY || '';
  /** @type {Record<string, string>} */
  const map = {};
  for (const line of raw.split('|')) {
    const i = line.indexOf('=');
    if (i > 0) { const k = line.slice(0, i).trim(), v = line.slice(i + 1).trim(); if (k) map[k] = v; }
  }
  return map;
}
function applyGlossary(/** @type {string} */ text) {
  let t = text;
  for (const [/** @type {string} */ k, /** @type {string} */ v] of Object.entries(GLOSSARY)) { if (k) t = t.split(k).join(v); }
  return t;
}
function postProcess(/** @type {string} */ text) {
  if (!text) return text;
  let t = text;
  t = t.replace(/\*/g, '').replace(/\[[^\]]*\]/g, '').trim();
  t = t.replace(/\s{2,}/g, ' ').trim();
  t = t.replace(/([，。！？；、])([a-zA-Z0-9])/g, '$1 $2');
  t = applyGlossary(t);
  return t;
}

// 引擎鏈: 碼規範已由 toEngineLang 處理, 此處只排順序
/**
 * @returns {Array<[string, (text: string, from: string, to: string, ctxHint?: string) => Promise<string>]>}
 */
function engineChain() {
  /** @type {Array<[string, (text: string, from: string, to: string, ctxHint?: string) => Promise<string>]>} */
  const chain = [];
  // 可選雲端增強: 設 GEMINI_API_KEY 才啟用 Gemini 3.5 Live Translate 最前端; 失敗自動回落免費鏈
  if (process.env.GEMINI_API_KEY) chain.push(['gemini-live-3.5', viaGeminiLive35]);
  if (process.env.OLLAMA_MODEL) chain.push(['ollama-' + process.env.OLLAMA_MODEL, viaOllama]);
  chain.push(['google-gtx', viaGoogleGtx]);
  if (process.env.LIBRETRANSLATE_URL) chain.push(['libretranslate', viaLibre]);
  chain.push(['mymemory', viaMyMemory]);
  return chain;
}

// 測試注入點: 允許單元測試以確定性引擎鏈取代外部網路依賴,
// 使 5T 溯源合約在 CI (資料中心 IP 常被外部免費翻譯 API 限流) 穩定可驗證, 不再依賴現網可用性。
// 預設為 null → 走正式 engineChain(); 測試透過 __setTestEngineChain 注入。
/** @type {ReturnType<typeof engineChain> | null} */
let _engineOverride = null;
export function __setTestEngineChain(/** @type {ReturnType<typeof engineChain>} */ list) { _engineOverride = list; }
export function __resetTestEngineChain() { _engineOverride = null; }

// from='auto' 不預判同語 (否則繁中→英文 被誤判 en→en 跳過); 快取鍵用原始 from/to 保留 zh-TW/zh-CN 區別
/**
 * @param {string} text
 * @param {string} from
 * @param {string} to
 * @param {string} [ctxHint]
 * @returns {Promise<import('./types/generated/esggo-shared.d.ts').ITranslateResult>}
 */
export async function translateDetailed(text, from, to, ctxHint) {
  if (!text) return { text, engine: 'passthrough', cached: false };
  const cFrom = toCanonical(from); // 僅用於同語短路判斷
  const cTo = toCanonical(to);
  if (from && String(from).toLowerCase() !== 'auto' && cFrom === cTo) return { text, engine: 'passthrough', cached: false };
  const k = cacheKey(text, from, to); // 用原始語碼, 確保繁中不被快取成簡中
  const hit = cacheGet(CACHE, k);
  if (hit) { stats.cacheHits++; return { ...hit, cached: true }; }
  stats.calls++;
  const chain = _engineOverride || engineChain();
  for (const [name, fn] of chain) {
    try {
      // 脈絡增強僅注入 Gemini 引擎; 免費鏈忽略 ctxHint (誠實降級)
      const out = await withRetry(() => fn(text, from, to, name === 'gemini-live-3.5' ? ctxHint : undefined), name);
      const rec = { text: out, engine: name };
      stats.byEngine[name] = (stats.byEngine[name] || 0) + 1;
      cacheSet(CACHE, k, rec);
      return { ...rec, cached: false };
    } catch { /* 換下一引擎 */ }
  }
  stats.errors++;
  return { text, engine: 'fallback-origin', cached: false };
}

/**
 * @param {string} text
 * @param {string} from
 * @param {string} to
 * @returns {Promise<string>}
 */
export async function translateText(text, from, to) {
  return (await translateDetailed(text, from, to)).text;
}

// 平行翻譯多語: 以原始碼 (zh-TW/zh-CN) 為展示 key, 不預先 normalize (防繁中變簡中)
/**
 * @param {string} text
 * @param {string} from
 * @param {string[]} targets
 * @returns {Promise<{translations: Record<string, string>, engines: Record<string, string>}>}
 */
export async function translateToMany(text, from, targets) {
  const normMap = new Map();
  for (const t of targets) {
    const key = toCanonical(t);
    if (!normMap.has(key)) normMap.set(key, key);
  }
  const results = await Promise.all(
    [...normMap.keys()].map(async (/** @type {string} */ n) => [normMap.get(n), await translateDetailed(text, from, n)])
  );
  /** @type {Record<string, string>} */
  const out = {};
  /** @type {Record<string, string>} */
  const engines = {};
  for (const pair of results) { const t = pair[0]; const r = pair[1]; out[t] = r.text; engines[t] = r.engine; }
  return { translations: out, engines };
}

export function hashOf(/** @type {string} */ s) { return crypto.createHash('sha256').update(s).digest('hex'); }
