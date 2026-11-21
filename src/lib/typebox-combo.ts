// 智能自動全域全端全量 雙向同步終始矩陣 — TypeBox 組合工具
// 將 Type / Static / Value / TSchema 組合成可跨全端（server/client）使用的共享驗證契約

import { Type, type Static, type TSchema } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';

/**
 * 全域驗證契約：Schema + 型別推導 + runtime 檢查
 * - Schema（Type）是唯一真實來源（前後端共用）
 * - Static 推導雙向 TypeScript 型別
 * - Value.Check 提供 runtime 驗證
 * - TSchema 相容 Runes 與通用 Schema 接口
 */
export function defineSchema<T extends TSchema>(schema: T): {
  schema: T;
  type: Static<T>;
  validate: (data: unknown) => data is Static<T>;
} {
  return {
    schema,
    type: {} as Static<T>,
    validate: (data) => Value.Check(schema, data),
  };
}

export { Type, Static, Value };
export type { TSchema };
