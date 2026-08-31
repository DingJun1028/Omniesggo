// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
/**
 * ESGGO Safe Fetch Utilities
 *
 * Centralized error handling, type-safe API calls, and debug logging.
 * All API calls in the app should use these utilities for consistency.
 */
// ─── Types ─────────────────────────────────────────────────────────

export interface ApiResult<T> {
  readonly data: T | null;
  readonly error: string | null;
  readonly status: number | null;
}

export interface ApiClientConfig {
  readonly baseUrl?: string;
  readonly timeout?: number;
  readonly headers?: Record<string, string>;
}

// ─── Safe JSON Fetch ───────────────────────────────────────────────

/**
 * Type-safe fetch with built-in error handling, timeout, and validation.
 * Returns a discriminated ApiResult instead of throwing.
 */
export async function safeFetch<T>(
  url: string,
  options?: RequestInit & { timeout?: number },
): Promise<ApiResult<T>> {
  const controller = new AbortController();
  const timeoutMs = options?.timeout ?? 15000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    if (!res.ok) {
      const errorBody = await res.text().catch(() => 'Unknown error');
      return {
        data: null,
        error: `HTTP ${res.status}: ${res.statusText} — ${errorBody.slice(0, 200)}`,
        status: res.status,
      };
    }

    const json: T = await res.json();
    return { data: json, error: null, status: res.status };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return { data: null, error: `請求逾時 (${timeoutMs}ms)`, status: null };
    }
    const message = err instanceof Error ? err.message : '網路連線失敗';
    return { data: null, error: message, status: null };
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─── POST Helper ───────────────────────────────────────────────────

export async function safePost<T>(
  url: string,
  body: unknown,
  options?: { timeout?: number },
): Promise<ApiResult<T>> {
  return safeFetch<T>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    timeout: options?.timeout,
  });
}

// ─── Validation ────────────────────────────────────────────────────

/**
 * Validate that a response object has the expected shape.
 * Returns the data if valid, or null with an error message.
 */
export function validateResponse<T>(
  result: ApiResult<T>,
  validator: (data: T) => boolean,
  label?: string,
): ApiResult<T> {
  if (result.error) return result;
  if (!result.data) {
    return {
      data: null,
      error: `${label ?? 'API'} 回應為空`,
      status: result.status,
    };
  }
  if (!validator(result.data)) {
    return {
      data: null,
      error: `${label ?? 'API'} 回應格式不正確`,
      status: result.status,
    };
  }
  return result;
}

// ─── HTML Sanitizer ────────────────────────────────────────────────

import DOMPurify from 'isomorphic-dompurify';

/**
 * Basic HTML sanitizer for dangerouslySetInnerHTML.
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html);
}

// ─── Debug Logger ──────────────────────────────────────────────────
// Re-exports structured logger from @lib/logger for backward compatibility.
// Old usage: logger.info('module', 'message', data)
// New usage: logger.info({ module }, 'message') or createModuleLogger('mod')

import { logger as pinoLogger, createModuleLogger } from './logger';

export const logger = {
  info: (module: string, message: string, data?: unknown) => {
    pinoLogger.info({ module, ...(data && typeof data === 'object' ? data : { data }) }, message);
  },
  warn: (module: string, message: string, data?: unknown) => {
    pinoLogger.warn({ module, ...(data && typeof data === 'object' ? data : { data }) }, message);
  },
  error: (module: string, message: string, error?: unknown) => {
    pinoLogger.error({ module, err: error }, message);
  },
};

export { createModuleLogger };
