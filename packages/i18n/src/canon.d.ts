// canon.d.ts -- OmniShare i18n SSOT 型別表
// v0.3.1 -- 鎖定為 zh-TW + en 雙語
// 注意: 本檔僅含型別宣告, 不含 runtime 值。
//       runtime 常數 LOCALES / DICT / VERSION 在 src/types/canon.i18n.ts

export type Locale = 'en' | 'zh-TW';

export interface Dictionary {
  readonly [key: string]: string;
}

export interface I18nBundle {
  readonly locale: Locale;
  readonly version: string;
  readonly dict: Dictionary;
}

export type DictKey =
  | 'app.title'
  | 'app.subtitle'
  | 'app.welcome'
  | 'nav.home'
  | 'nav.about'
  | 'nav.contact'
  | 'btn.submit'
  | 'btn.cancel';

// 本檔不含 `export const LOCALES` -- 嚴格 TS 規範下, .d.ts 不應有 runtime 值
// 取得 runtime 常數請改 import from './types/canon.i18n'
