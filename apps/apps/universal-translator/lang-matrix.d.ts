// 繁中英碼終始矩陣 — 型別契約 (單一真源之型別面)
// 與 shared/lang-matrix.mjs 雙向同步: 改 canonical 後重跑 sync 腳本 → 本檔與 runtime 一致
export declare const CANONICAL_LANGS: string[];
export declare const LANG_DISPLAY: Record<string, string>;
export declare const LANG_ALIAS: Record<string, string>;
export declare const ENGINE_LANG_MAP: {
  'google-gtx': Record<string, string>;
  'libretranslate': Record<string, string>;
  'mymemory': Record<string, string>;
  'ollama': Record<string, string>;
};
/** 輸入任意碼 → 規範碼 (容錯別名) */
export declare function toCanonical(raw: string | null | undefined): string;
/** 規範碼 → 指定引擎接受的實際碼 */
export declare function toEngineLang(engine: string, canonical: string): string;
