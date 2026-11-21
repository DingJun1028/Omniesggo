// ============================================================
// 萬能即時翻譯 — 自託管 LLM 翻譯引擎 (Ollama, 零付費 key)
// 最新技術: 以 qwen2.5:3b-instruct 做語境感知翻譯, 連貫性/專業度遠勝碎句式 gtx
// 硬約束: 只接本地/自託管 Ollama (http://localhost:11434), 不觸任何付費 API
// 5T: engine 標記 ollama:<model>, 可溯源
// @ts-check
/// <reference path="./types/generated/esggo-shared.d.ts" />
// ============================================================

const OLLAMA_URL = (process.env.OLLAMA_URL || 'http://localhost:11434').replace(/\/+$/, '');
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:3b-instruct-q4_K_M';

/**
 * 是否啟用自託管引擎 (設 OLLAMA_URL 即啟用; 預設 localhost 即啟用)
 * @returns {boolean}
 */
export function ollamaEnabled() {
  return Boolean(OLLAMA_URL && OLLAMA_MODEL);
}

/**
 * 語系名稱對映 (給 prompt 用的自然語言, 避免譯碼歧義)
 * 終始矩陣收斂: 鎖定繁中↔英文雙向
 * @param {string} l
 * @returns {string}
 */
function langName(l) {
  const s = String(l || '').toLowerCase();
  /** @type {Record<string, string>} */
  const map = {
    'zh': 'Traditional Chinese (繁體中文)', 'zh-tw': 'Traditional Chinese (繁體中文)',
    'zh-hant': 'Traditional Chinese (繁體中文)', 'zh-cn': 'Simplified Chinese (簡體中文)',
    'zh-hans': 'Simplified Chinese (簡體中文)', 'en': 'English',
  };
  return map[s] || s;
}

/**
 * 以 Ollama 本地 LLM 執行語境感知翻譯
 * @param {string} text
 * @param {string} [from]
 * @param {string} [to]
 * @returns {Promise<string>}
 */
export async function viaOllama(text, from, to) {
  const srcName = langName(from || 'auto');
  const tgtName = langName(to || 'en');
  const sys = 'You are a professional real-time interpreter. Translate the user text from ' +
    srcName + ' to ' + tgtName + '. Output ONLY the translated text, no quotes, no explanations, ' +
    'no markdown. Preserve tone, technical terms, and named entities. If already in target language, return as-is.';
  const body = {
    model: OLLAMA_MODEL,
    messages: [{ role: 'system', content: sys }, { role: 'user', content: text }],
    stream: false,
    options: { temperature: 0.1, num_predict: 512, top_p: 0.9 },
  };
  const r = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(Number(process.env.OLLAMA_TIMEOUT_MS || 15000)),
  });
  if (!r.ok) throw new Error('ollama HTTP ' + r.status);
  const d = await r.json();
  const out = (d?.message?.content || '').trim();
  if (!out) throw new Error('ollama empty');
  return out;
}
