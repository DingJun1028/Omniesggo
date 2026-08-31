// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
/* eslint-disable @typescript-eslint/no-require-imports */
// ═══════════════════════════════════════════════════════════════
// src/lib/api-utils.ts — Next.js API Route 通用工具函式
// 單一事實來源使用 @esggo/errors 錯誤代碼
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import { ERROR_CODES, HTTP_STATUS } from '@esggo/errors';
import type { ErrorCodeKey } from '@esggo/errors';

/**
 * Return a standard success JSON response.
 */
export function jsonResponse<T>(data: T, status: number = HTTP_STATUS.OK): NextResponse {
  return NextResponse.json({ success: true, data }, { status });
}

/**
 * Return a standard error JSON response using a known error code key.
 */
export function jsonError(
  errorKey: ErrorCodeKey,
  customMessage?: string,
  status?: number
): NextResponse {
  const error = ERROR_CODES[errorKey];
  return NextResponse.json(
    {
      success: false,
      error: customMessage || error.message,
      code: error.code,
    },
    { status: status || error.httpStatus }
  );
}

/**
 * 5T Transparent — 內部錯誤統一截斷。
 * 不在回應中洩漏原始 error.message（避免資訊洩漏），僅於伺服器端 console.error 留存供排查。
 * catch 區應改用此函式取代 jsonError('INTERNAL_ERROR', error.message)。
 */
export function jsonErrorInternal(
  error: unknown,
  errorKey: ErrorCodeKey = 'INTERNAL_ERROR',
  status?: number
): NextResponse {
  console.error(`[api] ${errorKey}:`, error);
  return jsonError(errorKey, undefined, status);
}

/**
 * Validate that all required params are present (not null/undefined/empty).
 */
export function validateParams(
  params: Record<string, unknown>
): { valid: boolean; missing?: string } {
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === '') {
      return { valid: false, missing: key };
    }
  }
  return { valid: true };
}

/**
 * Validate that a value is a positive number.
 */
export function validatePositiveNumber(
  value: unknown,
  fieldName: string
): { valid: boolean; error?: string } {
  if (typeof value !== 'number' || value <= 0) {
    return { valid: false, error: `${fieldName} 必須為正數` };
  }
  return { valid: true };
}

/**
 * Trim string and optionally enforce max length.
 */
export function sanitizeString(input: string, maxLength?: number): string {
  let result = input.trim();
  if (maxLength && result.length > maxLength) {
    result = result.slice(0, maxLength);
  }
  return result;
}

/**
 * Generate a unique ID with a prefix.
 */
export function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Compute SHA-256 hash of data.
 */
export function computeHash(data: unknown): string {
  // Use Web Crypto API when available (Edge/Server), fallback to Node crypto
  const json = JSON.stringify(data);
  // Use createHash from crypto via dynamic import pattern
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(json).digest('hex');
}