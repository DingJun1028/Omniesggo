// @esggo/shared/types/i18n.ts
// SSOT — Single Source of Truth for i18n 雙語鎖定 Locale + DictKey 鍵名表
// @version 1.0.0 (2026-09-21)
// @author OA-Team (質控蜂)
// @license AGPL-3.0

import { LOCALES as _LOCALES } from './_i18n-locales';

/**
 * 可用語系 runtime 陣列 (從 _i18n-locales.ts 衍生)
 * 修改 LOCALES 需同時: (1) 更新 en.json / zh-TW.json (2) 跑 npm run i18n:check
 */
export const LOCALES = _LOCALES;

/**
 * 可用語系: 鎖定為 ['en', 'zh-TW'] 雙語
 * LocalizableLocale 是由 _i18n-locales.ts 的 LOCALES 陣列自動衍生。
 * 修改 LOCALES 需同時: (1) 更新 en.json / zh-TW.json (2) 跑 npm run i18n:check
 */
export type Locale = typeof _LOCALES[number];

/**
 * 字典鍵名表 (8 鍵)
 * - app: title / subtitle / welcome
 * - nav: home / about / contact
 * - btn: submit / cancel
 */
export type DictKey =
  | 'app.title'
  | 'app.subtitle'
  | 'app.welcome'
  | 'nav.home'
  | 'nav.about'
  | 'nav.contact'
  | 'btn.submit'
  | 'btn.cancel';

/**
 * 8 鍵的 SSOT 陣列 (供 generate.ts 用, 也是 Dict[] 來源)
 */
export const KEYS: readonly DictKey[] = [
  'app.title',
  'app.subtitle',
  'app.welcome',
  'nav.home',
  'nav.about',
  'nav.contact',
  'btn.submit',
  'btn.cancel',
] as const;

/**
 * Dictionary 型別: 鍵名 → 翻譯字串
 */
export type Dictionary = Record<DictKey, string>;

/**
 * i18n bundle 結構 (en.json / zh-TW.json 的 shape)
 */
export interface I18nBundle {
  locale: Locale;
  version: string;
  dict: Dictionary;
}

/**
 * 驗證: DictKey 個數鎖定為 8 (TDD formula: (2-1)*keys*0.7 = 5.6, 但實際 keys = 8)
 */
export const EXPECTED_KEY_COUNT = 8 as const;
