/**
 * ==========================================
 * ESG GO 平台 - Health Check & Tags API 測試
 * ==========================================
 * 測試:
 *  - GET  /api/healthz
 *  - POST /api/tags/pair (validation edge cases)
 *  - Zod validation helpers
 *  - Logger (pino)
 *  - Middleware export
 *
 * 5T-Trackable: 下列兩處 `await import('../app/api/.../route')` 在 it() 內
 * 動態載入 Next.js route，需 transpile + 初始化 Next runtime。於全量並行
 * 負載下實測需 5-17 秒，遠超 vitest 預設 5s timeout → 各 describe 的第一個
 * it() 隨機失敗（flaky，2026-09-28 實測失敗數在 5 與 1 間跳動，非回歸）。
 * 已由 vitest.config.ts 的全域 testTimeout: 30_000 涵蓋，此處不重複設定。
 */

import { describe, it, expect } from 'vitest';
import type { NextRequest } from 'next/server';

// ==========================================
// Health Check API
// ==========================================

describe('GET /api/healthz', () => {
  it('returns 200 with valid health response structure', async () => {
    const { GET } = await import('../app/api/healthz/route');
    const res = await GET();
    const body = await res.json();

    expect(['ok', 'degraded', 'error']).toContain(body.status);
    expect(body.status === 'error' ? res.status : res.status).not.toBe(undefined);
    if (body.status === 'error') {
      expect(res.status).toBe(503);
    } else {
      expect(res.status).toBe(200);
    }

    expect(body).toHaveProperty('version');
    expect(body).toHaveProperty('timestamp');
    expect(body).toHaveProperty('uptime');
    expect(body).toHaveProperty('environment');
    expect(body).toHaveProperty('checks');
    expect(Array.isArray(body.checks)).toBe(true);

    // 整體狀態應為 ok 或 degraded（CI 環境可能無 DB）
    expect(['ok', 'degraded', 'error']).toContain(body.status);

    // Checks 應包含 database 與 ai_model
    const names = body.checks.map((c: { name: string }) => c.name);
    expect(names).toContain('database');
    expect(names).toContain('ai');
  });

  it('includes security headers', async () => {
    const { GET } = await import('../app/api/healthz/route');
    const res = await GET();

    expect(res.headers.get('Cache-Control')).toContain('no-store');
    expect(res.headers.get('X-Response-Time')).toBeDefined();
  });
});

// ==========================================
// Tags Pair API — validation edge cases
// ==========================================

describe('POST /api/tags/pair', () => {
  function makeReq(body: unknown): NextRequest {
    return {
      json: async () => body,
    } as unknown as NextRequest;
  }

  it('rejects missing mode (400)', async () => {
    const { POST } = await import('../app/api/tags/pair/route');
    const res = await POST(makeReq({ anchorLabel: 'test', entityType: 'company', entityId: '1' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  }, 15000);

  it('rejects invalid mode (400)', async () => {
    const { POST } = await import('../app/api/tags/pair/route');
    const res = await POST(makeReq({ mode: 'unknown' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it('rejects omni mode with missing required fields (400)', async () => {
    const { POST } = await import('../app/api/tags/pair/route');
    const res = await POST(makeReq({ mode: 'omni', anchorLabel: 'test' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain('required');
  });

  it('rejects auto mode with missing content (400)', async () => {
    const { POST } = await import('../app/api/tags/pair/route');
    const res = await POST(makeReq({ mode: 'auto', entityType: 'company', entityId: '1' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it('rejects completely empty body (400)', async () => {
    const { POST } = await import('../app/api/tags/pair/route');
    const res = await POST(makeReq({}));
    expect(res.status).toBe(400);
  });

  it('rejects null body (400)', async () => {
    const { POST } = await import('../app/api/tags/pair/route');
    const res = await POST(makeReq(null));
    expect(res.status).toBe(400);
  });
});

// ==========================================
// Zod Validation Helpers
// ==========================================

describe('Zod Validation (zod-validation.ts)', () => {
  it('validateBody is an exported function', async () => {
    const { validateBody } = await import('../src/lib/zod-validation');
    expect(typeof validateBody).toBe('function');
  });

  it('validateQuery is an exported function', async () => {
    const { validateQuery } = await import('../src/lib/zod-validation');
    expect(typeof validateQuery).toBe('function');
  });

  it('ESGReportSchema validates correct data', async () => {
    const { ESGReportSchema } = await import('../src/lib/zod-validation');
    const result = ESGReportSchema.safeParse({
      framework: 'GRI',
      company: 'ESG Corp',
      year: 2024,
    });
    expect(result.success).toBe(true);
  });

  it('ESGReportSchema rejects missing framework', async () => {
    const { ESGReportSchema } = await import('../src/lib/zod-validation');
    const result = ESGReportSchema.safeParse({
      company: 'ESG Corp',
      year: 2024,
    });
    expect(result.success).toBe(false);
  });

  it('ESGReportSchema rejects invalid year', async () => {
    const { ESGReportSchema } = await import('../src/lib/zod-validation');
    const result = ESGReportSchema.safeParse({
      framework: 'GRI',
      company: 'ESG Corp',
      year: 1999,
    });
    expect(result.success).toBe(false);
  });

  it('DelegationRequestSchema validates correct data', async () => {
    const { DelegationRequestSchema } = await import('../src/lib/zod-validation');
    const result = DelegationRequestSchema.safeParse({
      task: 'Analyze Q3 ESG data',
    });
    expect(result.success).toBe(true);
  });

  it('DelegationRequestSchema rejects empty task', async () => {
    const { DelegationRequestSchema } = await import('../src/lib/zod-validation');
    const result = DelegationRequestSchema.safeParse({ task: '' });
    expect(result.success).toBe(false);
  });

  it('UniversalTagSchema validates correct data', async () => {
    const { UniversalTagSchema } = await import('../src/lib/zod-validation');
    const result = UniversalTagSchema.safeParse({
      name: 'Carbon Emissions',
      pillar: 'Environmental',
      category: 'Climate',
    });
    expect(result.success).toBe(true);
  });

  it('UniversalTagSchema rejects invalid pillar', async () => {
    const { UniversalTagSchema } = await import('../src/lib/zod-validation');
    const result = UniversalTagSchema.safeParse({
      name: 'Test',
      pillar: 'InvalidPillar',
      category: 'Test',
    });
    expect(result.success).toBe(false);
  });
});

// ==========================================
// Logger — pino structured logger
// ==========================================

describe('Logger', () => {
  it('exports a logger with standard methods', async () => {
    const { logger } = await import('../src/lib/logger');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.debug).toBe('function');
  });

  it('child logger works', async () => {
    const { logger } = await import('../src/lib/logger');
    const child = logger.child({ module: 'test' });
    expect(typeof child.info).toBe('function');
    // Should not throw
    child.info({ msg: 'test child logger' });
  });
});

// ==========================================
// Middleware — security headers & rate limiting
// ==========================================

describe('Middleware', () => {
  it('exports a middleware function (named export)', async () => {
    const mod = await import('../src/middleware');
    // Next.js middleware uses named export `middleware`
    expect(typeof mod.middleware).toBe('function');
  });
});
