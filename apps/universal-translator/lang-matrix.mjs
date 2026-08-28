// 繁中英碼終始矩陣 — 單一真源 (runtime, Single Source of Truth)
// 全域全端全量雙向 TS 架構終始矩陣 — 語言碼規範層
// 終 (canonical): shared/lang-matrix.mjs  →  sync 腳本生成:
//   始 (runtime): apps/universal-translator/types/generated/lang-matrix.mjs
//   始 (types):   shared/lang-matrix.d.ts / types/generated/lang-matrix.d.ts
// 任一引擎要某語碼 → 都從 ENGINE_LANG_MAP 查, 不再各引擎手刻 normalize (消除漂移/bug)

/** 規範語碼 (canonical): 使用者介面與內部快取都用這組, 嚴格區分 zh-TW / zh-CN */
export const CANONICAL_LANGS = ['auto', 'zh-TW', 'zh-CN', 'en', 'ja', 'ko', 'es', 'fr'];

/** 顯示名 (繁中 UI) */
export const LANG_DISPLAY = {
  'auto': '自動偵測',
  'zh-TW': '繁體中文',
  'zh-CN': '簡體中文',
  'en': 'English',
  'ja': '日本語',
  'ko': '한국어',
  'es': 'Español',
  'fr': 'Français',
};

/** 別名 → 規範碼 (輸入容錯: zh-Hant→zh-TW, zh-Hans→zh-CN, 空→auto ...) */
export const LANG_ALIAS = {
  '': 'auto', 'a': 'auto', 'detect': 'auto', 'auto': 'auto',
  'zh': 'zh-CN', 'zh-cn': 'zh-CN', 'zh-hans': 'zh-CN', 'zhs': 'zh-CN', 'zh-hk': 'zh-CN',
  'zh-tw': 'zh-TW', 'zh-hant': 'zh-TW', 'zht': 'zh-TW', 'chinese(traditional)': 'zh-TW',
  'en': 'en', 'en-us': 'en', 'en-gb': 'en', 'english': 'en',
  'ja': 'ja', 'ja-jp': 'ja', 'japanese': 'ja',
  'ko': 'ko', 'ko-kr': 'ko', 'korean': 'ko',
  'es': 'es', 'es-es': 'es', 'spanish': 'es',
  'fr': 'fr', 'fr-fr': 'fr', 'french': 'fr',
};

/** 繁中英碼終始矩陣: canonical → 各引擎實際接受碼 (唯一真源) */
export const ENGINE_LANG_MAP = {
  'google-gtx':     { 'auto': 'auto', 'zh-TW': 'zh-TW', 'zh-CN': 'zh-CN', 'en': 'en', 'ja': 'ja', 'ko': 'ko', 'es': 'es', 'fr': 'fr' },
  'libretranslate': { 'auto': 'en',   'zh-TW': 'zh',   'zh-CN': 'zh',   'en': 'en', 'ja': 'ja', 'ko': 'ko', 'es': 'es', 'fr': 'fr' },
  'mymemory':       { 'auto': 'en',   'zh-TW': 'zh-CN','zh-CN': 'zh-CN','en': 'en', 'ja': 'ja', 'ko': 'ko', 'es': 'es', 'fr': 'fr' },
  'ollama':         { 'auto': 'auto-detect', 'zh-TW': 'zh-TW', 'zh-CN': 'zh-CN', 'en': 'en', 'ja': 'ja', 'ko': 'ko', 'es': 'es', 'fr': 'fr' },
};

/** 輸入任意碼 → 規範碼 (容錯別名) */
/** @param {string|null|undefined} raw @returns {string} */
export function toCanonical(raw) {
  if (!raw) return 'auto';
  const k = String(raw).toLowerCase().trim();
  return LANG_ALIAS[k] || 'en'; // 未知碼降為 en (最穩定假設)
}

/** 規範碼 → 指定引擎接受的實際碼 */
/** @param {string} engine @param {string} canonical @returns {string} */
export function toEngineLang(engine, canonical) {
  const row = ENGINE_LANG_MAP[engine];
  if (!row) return canonical;
  return row[canonical] != null ? row[canonical] : canonical;
}
