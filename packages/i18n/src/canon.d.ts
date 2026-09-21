// canon.d.ts -- OmniShare i18n SSOT 鍵名表
// v0.3.1 -- 鎖定為 zh-TW + en 雙語

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

export const LOCALES: readonly Locale[] = ['en', 'zh-TW'] as const;
