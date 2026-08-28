/**
 * POST /api/zkp — ZKP 零知識證明 API
 */

import { NextRequest } from 'next/server';
import { jsonResponse, jsonError, jsonErrorInternal } from '@lib/api-utils';
import { ZKPService } from '@/lib/zkp-service';

export const dynamic = 'force-dynamic';

// ── Types ─────────────────────────────────────────────────────

interface SealBody {
  action: 'seal';
  documentId: string;
  secret?: string;
}

interface VerifyBody {
  action: 'verify';
  documentId: string;
  hashLock: string;
}

interface ProofsBody {
  action: 'proofs';
  documentId: string;
}

interface StatsBody {
  action: 'stats';
}

type ZKPBody = SealBody | VerifyBody | ProofsBody | StatsBody;

// ── POST Handler ──────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ZKPBody;

    if (!body?.action) {
      return jsonError('INVALID_PARAMS', 'Missing required param: action', 400);
    }

    switch (body.action) {
      case 'seal': {
        const { documentId, secret } = body;
        if (!documentId) {
          return jsonError('INVALID_PARAMS', 'Missing required param: documentId', 400);
        }

        const result = ZKPService.seal(documentId, secret);
        return jsonResponse(result);
      }

      case 'verify': {
        const { documentId, hashLock } = body;
        if (!documentId || !hashLock) {
          return jsonError('INVALID_PARAMS', 'Missing required params: documentId, hashLock', 400);
        }

        const result = ZKPService.verify(documentId, hashLock);
        return jsonResponse(result);
      }

      case 'proofs': {
        const { documentId } = body;
        if (!documentId) {
          return jsonError('INVALID_PARAMS', 'Missing required param: documentId', 400);
        }

        const proofs = ZKPService.getProofs(documentId);
        return jsonResponse({ proofs, count: proofs.length });
      }

      case 'stats': {
        const stats = ZKPService.getStats();
        return jsonResponse(stats);
      }

      default:
        return jsonError('INVALID_PARAMS', `Unknown action: ${(body as { action: string }).action}`, 400);
    }
  } catch (error) {
    return jsonErrorInternal(error);
  }
}

// ── GET Handler ───────────────────────────────────────────────

export async function GET() {
  const stats = ZKPService.getStats();
  return jsonResponse({
    service: 'ZKP Service',
    version: '1.0.0',
    stats,
  });
}
