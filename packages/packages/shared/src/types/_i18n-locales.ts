// @esggo/shared/types/_i18n-locales.ts
// 本檔是 _internal_ runtime 陣列, 提供給 types/i18n.ts 衍生型別用。
// 注意: 對外仍由 types/i18n.ts 的 `export type Locale = ...` 為唯一定義點。

/**
 * 可用語系 (runtime array)
 * 鎖定為 ['en', 'zh-TW'] 雙語。
 * 修改此檔需同步:
 *   1. en.json, zh-TW.json
 *   2. 跑 npm run i18n:check (驗證 T1-T8 + 5T)
 *   3. 跑 npx vitest run (驗證 9 case)
 */
export const LOCALES = ['en', 'zh-TW'] as const;
