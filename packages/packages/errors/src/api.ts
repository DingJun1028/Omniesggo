// ═══════════════════════════════════════════════════════════════
// @esggo/errors/api — Unified API Route Error Handling
// Consistent error/success responses for all Next.js API routes
// ═══════════════════════════════════════════════════════════════

import { NextResponse, NextRequest } from 'next/server';
import {
  ERROR_CODES,
  HTTP_STATUS,
  createErrorBody,
  createSuccessBody,
} from './index';
import type { ErrorCodeKey, ErrorCodeDef } from './index';

// ── Re-exports for convenience ─────────────────────────────────

export { createErrorBody, createSuccessBody } from './index';
export type { ErrorCodeKey, ErrorCodeDef } from './index';

// ── Standard API Response Helpers ──────────────────────────────

/**
 * Return a success JSON response.
 *
 * @example
 *   return apiSuccess({ users: [...] });
 *   return apiSuccess(data, HTTP_STATUS.CREATED);
 */
export function apiSuccess<T>(
  data: T,
  status: number = HTTP_STATUS.OK,
  message?: string
): NextResponse {
  return NextResponse.json(createSuccessBody(data, message), { status });
}

/**
 * Return an error JSON response using a known error code key.
 *
 * @example
 *   return apiError('NOT_FOUND', 'User not found');
 *   return apiError('INVALID_PARAMS');
 */
export function apiError(
  errorKey: ErrorCodeKey,
  customMessage?: string,
  status?: number
): NextResponse {
  const def = ERROR_CODES[errorKey];
  return NextResponse.json(
    createErrorBody(errorKey, customMessage),
    { status: status || def.httpStatus }
  );
}

/**
 * Return a raw error response (for unexpected errors).
 */
export function apiInternalError(
  message?: string,
  details?: Record<string, unknown>
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message || ERROR_CODES.INTERNAL_ERROR.message,
      code: ERROR_CODES.INTERNAL_ERROR.code,
      details,
    },
    { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
  );
}

// ── Parameter Validation ───────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  error?: NextResponse;
}

/**
 * Validate required parameters. Returns error response if invalid.
 *
 * @example
 *   const validation = validateRequired(params, ['name', 'email']);
 *   if (!validation.valid) return validation.error!;
 */
export function validateRequired(
  params: Record<string, unknown>,
  required: string[]
): ValidationResult {
  const missing = required.filter(
    key => params[key] === undefined || params[key] === null || params[key] === ''
  );

  if (missing.length > 0) {
    return {
      valid: false,
      error: apiError(
        'INVALID_PARAMS',
        `Missing required parameters: ${missing.join(', ')}`,
        HTTP_STATUS.BAD_REQUEST
      ),
    };
  }

  return { valid: true };
}

/**
 * Validate a string parameter.
 */
export function validateString(
  value: unknown,
  name: string,
  options?: { minLength?: number; maxLength?: number; pattern?: RegExp }
): ValidationResult {
  if (typeof value !== 'string') {
    return {
      valid: false,
      error: apiError('INVALID_PARAMS', `${name} must be a string`),
    };
  }

  if (options?.minLength && value.length < options.minLength) {
    return {
      valid: false,
      error: apiError('INVALID_PARAMS', `${name} must be at least ${options.minLength} characters`),
    };
  }

  if (options?.maxLength && value.length > options.maxLength) {
    return {
      valid: false,
      error: apiError('INVALID_PARAMS', `${name} must be at most ${options.maxLength} characters`),
    };
  }

  if (options?.pattern && !options.pattern.test(value)) {
    return {
      valid: false,
      error: apiError('INVALID_PARAMS', `${name} format is invalid`),
    };
  }

  return { valid: true };
}

/**
 * Validate a numeric parameter.
 */
export function validateNumber(
  value: unknown,
  name: string,
  options?: { min?: number; max?: number; integer?: boolean }
): ValidationResult {
  const num = Number(value);
  if (isNaN(num)) {
    return {
      valid: false,
      error: apiError('INVALID_PARAMS', `${name} must be a number`),
    };
  }

  if (options?.integer && !Number.isInteger(num)) {
    return {
      valid: false,
      error: apiError('INVALID_PARAMS', `${name} must be an integer`),
    };
  }

  if (options?.min !== undefined && num < options.min) {
    return {
      valid: false,
      error: apiError('INVALID_PARAMS', `${name} must be at least ${options.min}`),
    };
  }

  if (options?.max !== undefined && num > options.max) {
    return {
      valid: false,
      error: apiError('INVALID_PARAMS', `${name} must be at most ${options.max}`),
    };
  }

  return { valid: true };
}

// ── Route Handler Wrapper ──────────────────────────────────────

export type RouteHandler = (
  request: NextRequest,
  context?: { params?: Record<string, string> }
) => Promise<NextResponse>;

/**
 * Wrap a route handler with consistent error handling.
 *
 * @example
 *   export const GET = withErrorHandling(async (req) => {
 *     const data = await fetchData();
 *     return apiSuccess(data);
 *   });
 */
export function withErrorHandling(handler: RouteHandler): RouteHandler {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (err) {
      console.error('[API Error]', err);

      // Known error types
      if (err instanceof Error) {
        if (err.name === 'AbortError' || err.message.includes('timeout')) {
          return apiError('EXTERNAL_SERVICE_ERROR', 'Request timed out');
        }
        if (err.message.includes('not found')) {
          return apiError('NOT_FOUND', err.message);
        }
      }

      return apiInternalError(
        process.env.NODE_ENV === 'production'
          ? 'Internal server error'
          : err instanceof Error ? err.message : 'Unknown error'
      );
    }
  };
}

// ── Middleware Auth Helpers ─────────────────────────────────────

/**
 * Extract user info from request headers (set by middleware).
 */
export function getUserFromHeaders(
  request: NextRequest
): { userId?: string; userEmail?: string } {
  return {
    userId: request.headers.get('x-user-id') || undefined,
    userEmail: request.headers.get('x-user-email') || undefined,
  };
}

/**
 * Check if the request has valid authentication.
 */
export function isAuthenticated(request: NextRequest): boolean {
  return !!request.headers.get('x-user-id');
}

/**
 * Require authentication. Returns error response if not authenticated.
 */
export function requireAuth(request: NextRequest): ValidationResult {
  if (!isAuthenticated(request)) {
    return {
      valid: false,
      error: apiError('UNAUTHORIZED', 'Authentication required'),
    };
  }
  return { valid: true };
}
