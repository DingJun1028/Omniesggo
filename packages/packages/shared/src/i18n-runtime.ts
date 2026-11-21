// @esggo/shared/i18n-runtime.ts
// Runtime 常數: LOCALES + DICT + VERSION
// 由 packages/i18n/scripts/gen.ts 自動生成 (實際資料來自 en.json / zh-TW.json)
// @version 1.0.0 (2026-09-21)
// @author OA-Team (質控蜂)
// @license AGPL-3.0

import { LOCALES as _LOCALES, KEYS as _KEYS } from './types/i18n';
import type { Locale, DictKey } from './types/i18n';

export { LOCALES, KEYS, type Locale, type DictKey } from './types/i18n';

/**
 * i18n-runtime 字典: 雙語字串表
 * 真實內容由 packages/i18n/scripts/gen.ts 寫入, 此 template 為 SSOT 佔位。
 * 終始矩陣 invariant: 修改 DICT 必須同步 en.json / zh-TW.json + 跑 i18n:check
 */
export const DICT: Record<Locale, Record<DictKey, string>> = {
  en: {
    'app.title': 'PLACEHOLDER',
    'app.subtitle': 'PLACEHOLDER',
    'app.welcome': 'PLACEHOLDER',
    'nav.home': 'PLACEHOLDER',
    'nav.about': 'PLACEHOLDER',
    'nav.contact': 'PLACEHOLDER',
    'btn.submit': 'PLACEHOLDER',
    'btn.cancel': 'PLACEHOLDER',
  },
  'zh-TW': {
    'app.title': 'PLACEHOLDER',
    'app.subtitle': 'PLACEHOLDER',
    'app.welcome': 'PLACEHOLDER',
    'nav.home': 'PLACEHOLDER',
    'nav.about': 'PLACEHOLDER',
    'nav.contact': 'PLACEHOLDER',
    'btn.submit': 'PLACEHOLDER',
    'btn.cancel': 'PLACEHOLDER',
  },
};

export const VERSION = '1.0.0';
