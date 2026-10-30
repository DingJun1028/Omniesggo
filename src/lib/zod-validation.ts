// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * TypeBox-based API request validation utilities.
 * (檔名保留 zod-validation.ts 以維持匯入路徑相容；內部已由 Zod 遷移至 TypeBox)
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

import { Type, type Static, type TSchema } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';
import { NextRequest, NextResponse } from 'next/server';

// ─── Helpers ────────────────────────────────────────────────────────

/** 對缺少之欄位套用 schema 宣告之 default（行為對齊 zod .default()） */
function applyDefaults(schema: TSchema, data: any): any {
  if (schema && (schema as any).default !== undefined) return (schema as any).default;
  if (schema && Array.isArray((schema as any).anyOf)) {
    for (const sub of (schema as any).anyOf) {
      if (sub.default !== undefined) return sub.default;
    }
  }
  return data;
}

function parseWithDefaults(schema: any, raw: any): any {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return raw;
  const out: any = { ...raw };
  const props = schema?.properties ?? {};
  for (const [key, sub] of Object.entries(props) as Array<[string, any]>) {
    if (!(key in out)) {
      const d = applyDefaults(sub, undefined);
      if (d !== undefined) out[key] = d;
    }
  }
  return out;
}

function issuesFrom(schema: TSchema, raw: unknown): Array<{ path: string; message: string }> {
  return [...Value.Errors(schema, raw)].map((e: any) => ({
    path: String(e.path ?? ''),
    message: String(e.message ?? 'Invalid value'),
  }));
}

// ─── Generic Validators ─────────────────────────────────────────────

type validatedRequest = { data: unknown; error: null } | { data: null; error: NextResponse };

/**
 * Parse and validate the JSON body of a NextRequest against a TypeBox schema.
 * Returns typed data on success (with schema defaults applied), or a 400 NextResponse on failure.
 */
export async function validateBody<T extends TSchema>(
  req: NextRequest,
  schema: T
): Promise<{ data: Static<T>; error: null } | { data: null; error: NextResponse }> {
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

  if (!Value.Check(schema, raw)) {
    const issues = issuesFrom(schema, raw);
    return {
      data: null,
      error: NextResponse.json(
        { success: false, error: 'Validation failed', code: 'VALIDATION_ERROR', details: issues },
        { status: 400 }
      ),
    };
  }

  return { data: parseWithDefaults(schema, raw) as Static<T>, error: null };
}

/**
 * Validate query string parameters against a TypeBox schema.
 */
export function validateQuery<T extends TSchema>(
  url: string,
  schema: T
): { data: Static<T>; error: null } | { data: null; error: NextResponse } {
  const { searchParams } = new URL(url);
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  if (!Value.Check(schema, params)) {
    const issues = issuesFrom(schema, params);
    return {
      data: null,
      error: NextResponse.json(
        { success: false, error: 'Invalid query parameters', code: 'INVALID_QUERY', details: issues },
        { status: 400 }
      ),
    };
  }

  return { data: parseWithDefaults(schema, params) as Static<T>, error: null };
}

// ─── Domain Schemas ─────────────────────────────────────────────────

/** ESG Report request validation */
export const ESGReportSchema = Type.Object({
  framework: Type.String({ minLength: 1 }),
  company: Type.String({ minLength: 1 }),
  year: Type.Integer({ minimum: 2000, maximum: 2100 }),
  sections: Type.Optional(Type.Array(Type.String())),
  // TypeBox 之 Value.Check 不套用 default — 對齊 Zod .default() 語義需 Type.Optional:
  // 缺席時 Check 通過, validateBody 之 parseWithDefaults 再補 default。
  language: Type.Optional(
    Type.Union([Type.Literal('en'), Type.Literal('zh-TW'), Type.Literal('zh-CN')], { default: 'zh-TW' })
  ),
});

export type ESGReportInput = Static<typeof ESGReportSchema>;

/** Delegation request validation */
export const DelegationRequestSchema = Type.Object({
  task: Type.String({ minLength: 1, maxLength: 2000 }),
  agentId: Type.Optional(Type.String()),
  priority: Type.Optional(
    Type.Union(
      [Type.Literal('low'), Type.Literal('normal'), Type.Literal('high'), Type.Literal('critical')],
      { default: 'normal' }
    )
  ),
  context: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
});

export type DelegationRequestInput = Static<typeof DelegationRequestSchema>;

/** Universal tag creation validation */
export const UniversalTagSchema = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 100 }),
  pillar: Type.Union([Type.Literal('Environmental'), Type.Literal('Social'), Type.Literal('Governance')]),
  category: Type.String({ minLength: 1, maxLength: 50 }),
  description: Type.Optional(Type.String({ maxLength: 500 })),
  source: Type.Optional(Type.String()),
});

export type UniversalTagInput = Static<typeof UniversalTagSchema>;
