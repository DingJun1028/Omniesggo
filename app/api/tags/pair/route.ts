// ============================================================
// Tag Pair API — 萬能標籤配對（含本地 Gemma 4 autoPair）
// app/api/tags/pair/route.ts
// ============================================================
import { NextRequest } from 'next/server';
import { Type, type Static } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';
import { jsonResponse, jsonError } from '@lib/api-utils';
import { createOmniTagPair, autoPair } from '@/core/tags/universal-tag-service';

const OmniPairSchema = Type.Object({
  mode: Type.Literal('omni'),
  anchorLabel: Type.String({ minLength: 1, maxLength: 200 }),
  evidenceLabel: Type.Optional(Type.String({ minLength: 1, maxLength: 200 })),
  entityType: Type.String({ minLength: 1, maxLength: 50 }),
  entityId: Type.String({ minLength: 1, maxLength: 100 }),
  omniType: Type.Optional(Type.Union([
    Type.Literal('GRI'), Type.Literal('TCFD'), Type.Literal('TNFD'), Type.Literal('SDG'), Type.Literal('custom')
  ])),
});

const AutoPairSchema = Type.Object({
  mode: Type.Literal('auto'),
  entityType: Type.String({ minLength: 1, maxLength: 50 }),
  entityId: Type.String({ minLength: 1, maxLength: 100 }),
  content: Type.String({ minLength: 1, maxLength: 8000 }),
  prompt: Type.Optional(Type.String({ maxLength: 8000 })),
});

// POST /api/tags/pair
//  body: { mode: 'omni', anchorLabel, evidenceLabel?, entityType, entityId, omniType? }
//    或 { mode: 'auto', entityType, entityId, content, prompt? }
export async function POST(request: NextRequest) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return jsonError('INVALID_PARAMS', 'Invalid JSON body', 400);
  }

  if (Value.Check(OmniPairSchema, raw)) {
    const { anchorLabel, evidenceLabel, entityType, entityId, omniType } = raw as Static<typeof OmniPairSchema>;
    const result = await createOmniTagPair({ anchorLabel, evidenceLabel, entityType, entityId, omniType });
    return jsonResponse(result, 201);
  }

  if (Value.Check(AutoPairSchema, raw)) {
    const { entityType, entityId, content, prompt } = raw as Static<typeof AutoPairSchema>;
    const result = await autoPair({ entityType, entityId, content, prompt });
    return jsonResponse(result, 200);
  }

  return jsonError('INVALID_PARAMS', 'mode must be "omni" or "auto" with required fields', 400);
}
