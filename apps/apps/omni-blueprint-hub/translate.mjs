// ============================================================
// 萬能即時翻譯引擎 v2 — 可插拔 / 零依賴 / 最佳實踐化
// 引擎優先序: LibreTranslate(自建) → MyMemory(免費) → 原文兜底
// 強化: 平行翻譯、指數退避重試、逾時、LRU 快取、engine 標記(5T 可溯源)
// ============================================================
import crypto from 'node:crypto';

const CACHE = new Map();
const CACHE_MAX = Number(process.env.TRANSLATE_CACHE_MAX || 1000);
const TIMEOUT_MS = Number(process.env.TRANSLATE_TIMEOUT_MS || 8000);
const RETRIES = Number(process.env.TRANSLATE_RETRIES || 2);

const cacheKey = (t, from, to) => `${from}|${to}|${t}`;
function cacheGet(k) { const v = CACHE.get(k); if (v !== undefined) { CACHE.delete(k); CACHE.set(k, v); } return v; }
function cacheSet(k, v) { CACHE.set(k, v); if (CACHE.size > CACHE_MAX) CACHE.delete(CACHE.keys().next().value); }

export const stats = { calls: 0, cacheHits: 0, errors: 0, byEngine: Object.create(null) };

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function withRetry(fn, label) {
  let lastErr;
  for (let i = 0; i <= RETRIES; i++) {
    try { return await fn(); }
    catch (e) { lastErr = e; if (i < RETRIES) await sleep(200 * 2 ** i); }
  }
  throw new Error(`${label}: ${lastErr?.message || lastErr}`);
}

// --- 引擎 1: LibreTranslate (自建, env LIBRETRANSLATE_URL) ---
async function viaLibre(text, from, to) {
  const base = process.env.LIBRETRANSLATE_URL;
  const body = { q: text, source: from, target: to, format: 'text' };
  if (process.env.LIBRETRANSLATE_KEY) body.api_key = process.env.LIBRETRANSLATE_KEY;
  const r = await fetch(base, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body), signal: AbortSignal.timeout(TIMEOUT_MS)
  });
  if (!r.ok) throw new Error('libre HTTP ' + r.status);
  const d = await r.json();
  if (!d.translatedText) throw new Error('libre empty');
  return d.translatedText;
}

// --- 引擎 2: MyMemory (免費, 零 key) ---
async function viaMyMemory(text, from, to) {
  const lp = `${from}|${to}`;
  const u = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(lp)}`;
  const r = await fetch(u, { signal: AbortSignal.timeout(TIMEOUT_MS), headers: { 'User-Agent': 'OmniBlueprintHub/0.6' } });
  if (!r.ok) throw new Error('mymemory HTTP ' + r.status);
  const d = await r.json();
  if (Number(d.responseStatus) !== 200) throw new Error(d.responseDetails || 'mymemory fail');
  return d.responseData.translatedText;
}

function engineChain() {
  const chain = [];
  if (process.env.LIBRETRANSLATE_URL) chain.push(['libretranslate', viaLibre]);
  chain.push(['mymemory', viaMyMemory]);
  return chain;
}

/** @returns {Promise<{text:string, engine:string, cached:boolean}>} */
export async function translateDetailed(text, from, to) {
  if (!text || from === to) return { text, engine: 'passthrough', cached: false };
  const k = cacheKey(text, from, to);
  const hit = cacheGet(k);
  if (hit) { stats.cacheHits++; return { ...hit, cached: true }; }

  stats.calls++;
  for (const [name, fn] of engineChain()) {
    try {
      const out = await withRetry(() => fn(text, from, to), name);
      const rec = { text: out, engine: name };
      stats.byEngine[name] = (stats.byEngine[name] || 0) + 1;
      cacheSet(k, rec);
      return { ...rec, cached: false };
    } catch { /* 換下一引擎 */ }
  }
  stats.errors++;
  return { text, engine: 'fallback-origin', cached: false }; // 兜底：回原文，永不中斷轉播
}

export async function translateText(text, from, to) {
  return (await translateDetailed(text, from, to)).text;
}

/** 平行翻譯多語 (原序列 await → Promise.all，延遲從 N×RTT 降為 1×RTT) */
export async function translateToMany(text, from, targets) {
  const results = await Promise.all(
    targets.map(async (t) => [t, await translateDetailed(text, from, t)])
  );
  const out = {};
  const engines = {};
  for (const [t, r] of results) { out[t] = r.text; engines[t] = r.engine; }
  return { translations: out, engines };
}

export function hashOf(s) { return crypto.createHash('sha256').update(s).digest('hex'); }
