// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
/**
 * ESG GO Structured Logger (pino)
 *
 * Usage:
 *   import { logger } from '@lib/logger';
 *   logger.info({ module: 'auth', userId: '123' }, 'Login successful');
 *   logger.error({ module: 'db', err }, 'Query failed');
 *
 * Environment:
 *   - LOG_LEVEL: debug | info | warn | error (default: info in prod, debug in dev)
 *   - LOG_FORMAT: json | pretty (default: json in prod, pretty in dev)
 */

import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production';
const level = process.env.LOG_LEVEL ?? (isDev ? 'debug' : 'info');

export const logger = pino({
  level,
  // Pretty print in development, structured JSON in production
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:HH:MM:ss',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  // Base context for all logs
  base: {
    service: 'esggo',
    version: process.env.npm_package_version ?? '5.1.0',
  },
  // Redact sensitive fields
  redact: {
    paths: [
      'password',
      'token',
      'authorization',
      'cookie',
      'apiKey',
      'api_key',
      'secret',
      'POSTGRES_PASSWORD',
      'GEMINI_API_KEY',
      'OPENROUTER_API_KEY',
    ],
    censor: '[REDACTED]',
  },
  // Timestamp format
  timestamp: pino.stdTimeFunctions.isoTime,
});

/**
 * Create a child logger with module context.
 *
 * @example
 *   const log = createModuleLogger('auth');
 *   log.info({ userId }, 'Login successful');
 */
export function createModuleLogger(module: string) {
  return logger.child({ module });
}

/**
 * Express/Next.js middleware logger.
 * Returns a middleware that logs incoming requests.
 */
export function createRequestLogger() {
  return (
    req: { method: string; url: string; headers?: Record<string, string> },
    _res: unknown,
    next: () => void,
  ) => {
    const start = Date.now();
    const requestId = req.headers?.['x-request-id'] ?? crypto.randomUUID();

    logger.info(
      {
        module: 'http',
        requestId,
        method: req.method,
        url: req.url,
      },
      '→ Request started',
    );

    // Log response on finish
    next();
    const duration = Date.now() - start;
    logger.debug(
      {
        module: 'http',
        requestId,
        duration,
      },
      '← Request completed',
    );
  };
}
