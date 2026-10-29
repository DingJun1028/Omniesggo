// ESGGO i18n 設定：語言清單、預設語言、localStorage 鍵。
// 純資料，可在 server / client 共用（不引用 window）。

export const LOCALES = ['zh-TW', 'en', 'ja'] as const;
export type AppLocale = (typeof LOCALES)[number];

// [ts-matrix] 對外相容別名：保留原匯出名稱，既有呼叫端不受影響。
export type { AppLocale as Locale };

export const DEFAULT_LOCALE: AppLocale = 'zh-TW';

// 用於 <html lang>、<meta> 與切換器顯示
export const LOCALE_META: Record<AppLocale, { label: string; native: string; htmlLang: string }> = {
  'zh-TW': { label: '繁體中文', native: '繁體中文', htmlLang: 'zh-Hant-TW' },
  en: { label: 'English', native: 'English', htmlLang: 'en' },
  ja: { label: 'Japanese', native: '日本語', htmlLang: 'ja' },
};

export const STORAGE_KEY = 'esggo-locale';

// 字典型別：key → 翻譯字串。集中於 config 以避免 core ↔ dictionaries 循環依賴。
export type AppDictionary = Record<string, string>;

// [ts-matrix] 對外相容別名：保留原匯出名稱，既有呼叫端不受影響。
export type { AppDictionary as Dictionary };

export function isLocale(value: unknown): value is AppLocale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

// 從 Accept-Language 或任意字串推斷最匹配的支援語言（失敗回傳預設）
export function resolveLocale(input: string | null | undefined): AppLocale {
  if (!input) return DEFAULT_LOCALE;
  const lower = input.toLowerCase();
  if (lower.startsWith('ja')) return 'ja';
  if (lower.startsWith('en')) return 'en';
  // zh-TW / zh-Hant / zh 都對應繁中
  if (lower.startsWith('zh')) return 'zh-TW';
  return DEFAULT_LOCALE;
}
