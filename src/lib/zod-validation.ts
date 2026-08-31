// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Zod-based API request validation utilities.
 *
 * Usage:
 *   import { validateBody, ESGReportSchema } from '@lib/zod-validation';
 *
 *   export async function POST(req: NextRequest) {
 *     const body = await validateBody(req, ESGReportSchema);
 *     if (body.error) return body.error;
 *     // body.data is fully typed
 *   }
 */

import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

// ─── Generic Validators ─────────────────────────────────────────────

type validatedRequest = { data: unknown; error: null } | { data: null; error: NextResponse };

/**
 * Parse and validate the JSON body of a NextRequest against a Zod schema.
 * Returns typed data on success, or a 400 NextResponse on failure.
 */
export async function validateBody<T>(
  req: NextRequest,
  schema: z.ZodSchema<T>
): Promise<{ data: T; error: null } | { data: null; error: NextResponse }> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return {
      data: null,
      error: NextResponse.json(
        { success: false, error: 'Invalid JSON body', code: 'INVALID_JSON' },
        { status: 400 }
      ),
    };
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues.map((i) => ({
      path: i.path.join('.'),
      message: i.message,
    }));
    return {
      data: null,
      error: NextResponse.json(
        { success: false, error: 'Validation failed', code: 'VALIDATION_ERROR', details: issues },
        { status: 400 }
      ),
    };
  }

  return { data: result.data, error: null };
}

/**
 * Validate query string parameters against a Zod schema.
 */
export function validateQuery<T>(
  url: string,
  schema: z.ZodSchema<T>
): { data: T; error: null } | { data: null; error: NextResponse } {
  const { searchParams } = new URL(url);
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  const result = schema.safeParse(params);
  if (!result.success) {
    const issues = result.error.issues.map((i) => ({
      path: i.path.join('.'),
      message: i.message,
    }));
    return {
      data: null,
      error: NextResponse.json(
        { success: false, error: 'Invalid query parameters', code: 'INVALID_QUERY', details: issues },
        { status: 400 }
      ),
    };
  }

  return { data: result.data, error: null };
}

// ─── Domain Schemas ─────────────────────────────────────────────────

/** ESG Report request validation */
export const ESGReportSchema = z.object({
  framework: z.string().min(1, 'Framework is required'),
  company: z.string().min(1, 'Company name is required'),
  year: z.number().int().min(2000).max(2100),
  sections: z.array(z.string()).optional(),
  language: z.enum(['en', 'zh-TW', 'zh-CN']).default('zh-TW'),
});

export type ESGReportInput = z.infer<typeof ESGReportSchema>;

/** Delegation request validation */
export const DelegationRequestSchema = z.object({
  task: z.string().min(1, 'Task description is required').max(2000),
  agentId: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high', 'critical']).default('normal'),
  context: z.record(z.unknown()).optional(),
});

export type DelegationRequestInput = z.infer<typeof DelegationRequestSchema>;

/** Universal tag creation validation */
export const UniversalTagSchema = z.object({
  name: z.string().min(1).max(100),
  pillar: z.enum(['Environmental', 'Social', 'Governance']),
  category: z.string().min(1).max(50),
  description: z.string().max(500).optional(),
  source: z.string().optional(),
});

export type UniversalTagInput = z.infer<typeof UniversalTagSchema>;
