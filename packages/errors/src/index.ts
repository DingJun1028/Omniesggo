import type { ErrorResponse } from '../../../src/types/sustain-write';
// ═══════════════════════════════════════════════════════════════
// @esggo/errors — ESG GO 平臺錯誤代碼統一 Package
// 單一事實來源 (Single Source of Truth) for all error codes
//
// MECE 原則：所有錯誤代碼互斥 (Mutually Exclusive)，
// 且完整覆蓋 (Collectively Exhaustive) 平臺所有錯誤情境。
// ═══════════════════════════════════════════════════════════════

// ── HTTP Status Constants ──────────────────────────────────────

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

export type HttpStatusCode = (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS];

// ── Error Code Definition ──────────────────────────────────────

export interface ErrorCodeDef {
  /** Machine-readable error code, e.g. "ERR_INVALID_PARAMS" */
  code: string;
  /** Human-readable default message (Traditional Chinese) */
  message: string;
  /** Corresponding HTTP status */
  httpStatus: HttpStatusCode;
  /** Optional detailed description */
  description?: string;
}

// ── Domain Categories (MECE) ───────────────────────────────────
//
// 錯誤代碼依功能域分類，確保互斥且完備：
//   GEN — General / Common (全域通用)
//   AUTH — Authentication & Authorization (認證授權)
//   ESG — ESG Core (碳排、法規等)
//   AI — AI / Model (模型路由、技能)
//   VLG — Village / DAO (村莊治理)
//   CRAWL — Crawler / Sonnar (爬蟲、監控)
//   RAG — RAG / Knowledge (知識檢索)
//   GATEWAY — OmniAgent Gateway (VPS 閘道)
//   BRIDGE — Bridge / L-Hub (橋接服務)

export const ERROR_CODES = {
  // ═══════════════════════════════════════════════
  // GEN — General / Common
  // ═══════════════════════════════════════════════
  INVALID_PARAMS: {
    code: 'ERR_INVALID_PARAMS',
    message: '無效的請求參數',
    httpStatus: HTTP_STATUS.BAD_REQUEST,
    description: '請求參數驗證失敗',
  },
  NOT_FOUND: {
    code: 'ERR_NOT_FOUND',
    message: '資源不存在',
    httpStatus: HTTP_STATUS.NOT_FOUND,
    description: '請求的資源或資料不存在',
  },
  INTERNAL_ERROR: {
    code: 'ERR_INTERNAL',
    message: '內部伺服器錯誤',
    httpStatus: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    description: '未預期的伺服器錯誤',
  },
  UNKNOWN_ERROR: {
    code: 'ERR_UNKNOWN',
    message: '未知錯誤',
    httpStatus: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    description: '發生未預期的錯誤',
  },
  RATE_LIMITED: {
    code: 'ERR_RATE_LIMITED',
    message: '請求頻率過高',
    httpStatus: HTTP_STATUS.TOO_MANY_REQUESTS,
    description: '超過速率限制，請稍後再試',
  },
  INVALID_ACTION: {
    code: 'ERR_INVALID_ACTION',
    message: '無效的操作',
    httpStatus: HTTP_STATUS.BAD_REQUEST,
    description: '請求的操作類型無效',
  },
  METHOD_NOT_ALLOWED: {
    code: 'ERR_METHOD_NOT_ALLOWED',
    message: '不允許的 HTTP 方法',
    httpStatus: HTTP_STATUS.METHOD_NOT_ALLOWED,
    description: '該端點不支援此 HTTP 方法',
  },
  API_KEY_MISSING: {
    code: 'ERR_API_KEY_MISSING',
    message: '缺少 API 金鑰',
    httpStatus: HTTP_STATUS.BAD_REQUEST,
    description: '必需的 API 金鑰未設定',
  },

  // ═══════════════════════════════════════════════
  // AUTH — Authentication & Authorization
  // ═══════════════════════════════════════════════
  UNAUTHORIZED: {
    code: 'ERR_UNAUTHORIZED',
    message: '未授權存取',
    httpStatus: HTTP_STATUS.UNAUTHORIZED,
    description: 'API Key 或認證無效',
  },
  FORBIDDEN: {
    code: 'ERR_FORBIDDEN',
    message: '禁止存取',
    httpStatus: HTTP_STATUS.FORBIDDEN,
    description: '無權限執行此操作',
  },
  USER_NOT_FOUND: {
    code: 'ERR_USER_NOT_FOUND',
    message: '用戶不存在',
    httpStatus: HTTP_STATUS.NOT_FOUND,
    description: '請求的用戶 ID 不存在',
  },

  // ═══════════════════════════════════════════════
  // ESG — ESG Core (碳排、報告、合規)
  // ═══════════════════════════════════════════════
  COMPANY_NOT_FOUND: {
    code: 'ERR_COMPANY_NOT_FOUND',
    message: '公司不存在',
    httpStatus: HTTP_STATUS.NOT_FOUND,
    description: '請求的公司 ID 不存在',
  },
  PROJECT_NOT_FOUND: {
    code: 'ERR_PROJECT_NOT_FOUND',
    message: '專案不存在',
    httpStatus: HTTP_STATUS.NOT_FOUND,
    description: 'Village 專案 ID 不存在',
  },
  SOURCE_NOT_FOUND: {
    code: 'ERR_SOURCE_NOT_FOUND',
    message: '來源不存在',
    httpStatus: HTTP_STATUS.NOT_FOUND,
    description: '爬蟲來源 ID 不存在',
  },
  ALERT_NOT_FOUND: {
    code: 'ERR_ALERT_NOT_FOUND',
    message: '警示不存在',
    httpStatus: HTTP_STATUS.NOT_FOUND,
    description: '請求的警示 ID 不存在',
  },

  // ═══════════════════════════════════════════════
  // AI — AI / Model Router / Skills
  // ═══════════════════════════════════════════════
  SKILL_NOT_FOUND: {
    code: 'ERR_SKILL_NOT_FOUND',
    message: '技能不存在',
    httpStatus: HTTP_STATUS.NOT_FOUND,
    description: '請求的技能 ID 不存在',
  },
  AI_RATE_LIMITED: {
    code: 'ERR_AI_RATE_LIMITED',
    message: 'AI 請求頻率過高',
    httpStatus: HTTP_STATUS.TOO_MANY_REQUESTS,
    description: 'AI 服務速率限制',
  },
  EMBEDDING_FAILED: {
    code: 'ERR_EMBEDDING_FAILED',
    message: '向量生成失敗',
    httpStatus: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    description: '無法為查詢生成嵌入向量',
  },
  RAG_QUERY_FAILED: {
    code: 'ERR_RAG_QUERY_FAILED',
    message: '知識檢索失敗',
    httpStatus: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    description: 'RAG 查詢過程中發生錯誤',
  },
  WORKFLOW_FAILED: {
    code: 'ERR_WORKFLOW_FAILED',
    message: '工作流程失敗',
    httpStatus: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    description: '工作流程執行失敗',
  },
  UNKNOWN_TOOL: {
    code: 'ERR_UNKNOWN_TOOL',
    message: '未知的工具呼叫',
    httpStatus: HTTP_STATUS.BAD_REQUEST,
    description: '不支援的工具類型',
  },

  // ═══════════════════════════════════════════════
  // VLG — Village / DAO
  // ═══════════════════════════════════════════════
  MEMBER_NOT_FOUND: {
    code: 'ERR_MEMBER_NOT_FOUND',
    message: '會員不存在',
    httpStatus: HTTP_STATUS.NOT_FOUND,
    description: 'Village 會員 ID 不存在',
  },
  INSUFFICIENT_POINTS: {
    code: 'ERR_INSUFFICIENT_POINTS',
    message: 'PTS 點數不足',
    httpStatus: HTTP_STATUS.BAD_REQUEST,
    description: '投票所需點數不足',
  },
  TASK_NOT_FOUND: {
    code: 'ERR_TASK_NOT_FOUND',
    message: '任務不存在',
    httpStatus: HTTP_STATUS.NOT_FOUND,
    description: '請求的任務 ID 不存在',
  },

  // ═══════════════════════════════════════════════
  // CRAWL — Crawler / Sonnar
  // ═══════════════════════════════════════════════
  CRAWL_ERROR: {
    code: 'ERR_CRAWL_ERROR',
    message: '爬蟲任務失敗',
    httpStatus: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    description: 'ESG 爬蟲過程中發生錯誤',
  },

  // ═══════════════════════════════════════════════
  // GATEWAY — OmniAgent Gateway (VPS)
  // ═══════════════════════════════════════════════
  TASK_REQUIRED: {
    code: 'ERR_TASK_REQUIRED',
    message: 'task.id 和 task.taskType 為必填',
    httpStatus: HTTP_STATUS.BAD_REQUEST,
    description: '執行任務缺少必要參數',
  },
  FAILURE_REASON_REQUIRED: {
    code: 'ERR_FAILURE_REASON_REQUIRED',
    message: 'failureReason 為必填',
    httpStatus: HTTP_STATUS.BAD_REQUEST,
    description: 'OmniJules 缺少故障原因',
  },
  EVENT_REQUIRED: {
    code: 'ERR_EVENT_REQUIRED',
    message: 'event body 為必填',
    httpStatus: HTTP_STATUS.BAD_REQUEST,
    description: 'Swarm 廣播缺少事件資料',
  },

  // ═══════════════════════════════════════════════
  // BRIDGE — Bridge / L-Hub / External
  // ═══════════════════════════════════════════════
  EXTERNAL_SERVICE_ERROR: {
    code: 'ERR_EXTERNAL_SERVICE',
    message: '外部服務錯誤',
    httpStatus: HTTP_STATUS.BAD_GATEWAY,
    description: '調用外部 API 時發生錯誤',
  },
  BRIDGE_UNREACHABLE: {
    code: 'ERR_BRIDGE_UNREACHABLE',
    message: '橋接服務不可達',
    httpStatus: HTTP_STATUS.BAD_GATEWAY,
    description: '無法連接到下一代服務',
  },
  BRIDGE_FAILURE: {
    code: 'ERR_BRIDGE_FAILURE',
    message: '橋接服務失敗',
    httpStatus: HTTP_STATUS.BAD_GATEWAY,
    description: '橋接服務回傳失敗',
  },
} as const;

// ── Type Helpers ───────────────────────────────────────────────

export type ErrorCodeKey = keyof typeof ERROR_CODES;

/** Mapping from ErrorCodeKey to its code string, e.g. "ERR_INVALID_PARAMS" */
export type ErrorCodeString = (typeof ERROR_CODES)[ErrorCodeKey]['code'];

// ── Standard Response Shapes ───────────────────────────────────

// ts-matrix: 收斂至規範型別 (canonical: src/types/sustain-write)
export type { ErrorResponse };

export interface SuccessResponse<T = unknown> {
  success: true;
  message?: string;
  data: T;
}

// ── Helper Functions ───────────────────────────────────────────

/**
 * Get an error code definition by key. Returns INTERNAL_ERROR if key is invalid.
 */
export function getError(key: string): ErrorCodeDef {
  if (key in ERROR_CODES) {
    return (ERROR_CODES as Record<string, ErrorCodeDef>)[key];
  }
  return ERROR_CODES.UNKNOWN_ERROR;
}

/**
 * Create a standard error response JSON body.
 */
export function createErrorBody(key: ErrorCodeKey, customMessage?: string): ErrorResponse {
  const def = ERROR_CODES[key];
  return {
    success: false,
    error: customMessage || def.message,
    code: def.code,
  };
}

/**
 * Create a standard success response JSON body.
 */
export function createSuccessBody<T>(data: T, message?: string): SuccessResponse<T> {
  return { success: true, message, data };
}

/**
 * Get all error codes grouped by domain category.
 */
export function getErrorCodeMap(): Record<string, ErrorCodeDef> {
  return { ...ERROR_CODES };
}