// ============================================================
// Tag Pair API — 萬能標籤配對（含本地 Gemma 4 autoPair）
// app/api/tags/pair/route.ts
// ============================================================
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { jsonResponse, jsonError } from '@lib/api-utils';
import { createOmniTagPair, autoPair } from '@/core/tags/omni-tag-service';

const OmniPairSchema = z.object({
  mode: z.literal('omni'),
  anchorLabel: z.string().min(1).max(200),
  evidenceLabel: z.string().min(1).max(200).optional(),
  entityType: z.string().min(1).max(50),
  entityId: z.string().min(1).max(100),
  omniType: z.enum(['GRI', 'TCFD', 'TNFD', 'SDG', 'custom']).optional(),
});

const AutoPairSchema = z.object({
  mode: z.literal('auto'),
  entityType: z.string().min(1).max(50),
  entityId: z.string().min(1).max(100),
  content: z.string().min(1).max(8000),
  prompt: z.string().max(8000).optional(),
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

  const omni = OmniPairSchema.safeParse(raw);
  if (omni.success) {
    const { anchorLabel, evidenceLabel, entityType, entityId, omniType } = omni.data;
    const result = await createOmniTagPair({ anchorLabel, evidenceLabel, entityType, entityId, omniType });
    return jsonResponse(result, 201);
  }

  const auto = AutoPairSchema.safeParse(raw);
  if (auto.success) {
    const { entityType, entityId, content, prompt } = auto.data;
    const result = await autoPair({ entityType, entityId, content, prompt });
    return jsonResponse(result, 200);
  }

  return jsonError('INVALID_PARAMS', 'mode must be "omni" or "auto" with required fields', 400);
}
