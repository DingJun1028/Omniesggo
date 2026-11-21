// canon.d.ts -- i18n SSOT 型別表
// v0.3.1 -- 鎖定為 zh-TW + en 雙語
// 終始矩陣: 本檔只 re-export @esggo/shared SSOT, 不再獨立定義, 杜絕 drift。
// 修改時改 @esggo/shared/src/types/i18n.ts (單一真相源), 這裡只路由。

export type { Locale, DictKey, Dictionary, I18nBundle } from '@esggo/shared/types';
export { KEYS as I18N_KEYS, EXPECTED_KEY_COUNT as I18N_KEY_COUNT } from '@esggo/shared/types';
