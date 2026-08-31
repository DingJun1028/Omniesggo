// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
// ═══════════════════════════════════════════════════════════════
// src/lib/errors.ts — 向下相容橋接層
// 所有實際定義已遷移至 @esggo/errors （單一事實來源）
// ═══════════════════════════════════════════════════════════════

export type {
  ErrorCodeDef,
  ErrorCodeKey,
  ErrorCodeString,
  ErrorResponse,
  SuccessResponse,
  HttpStatusCode,
} from '@esggo/errors';