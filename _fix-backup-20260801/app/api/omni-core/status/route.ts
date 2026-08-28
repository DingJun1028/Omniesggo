// ═══════════════════════════════════════════════════════════════
// /api/omni-core/status — OmniCore Status
// Uses @esggo/errors/api for unified error handling
// ═══════════════════════════════════════════════════════════════

import { getOmniCoreStatus } from '@/lib/omni-core';
import { apiSuccess, apiInternalError } from '@esggo/errors/api';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(): Promise<Response> {
  try {
    const status = await getOmniCoreStatus();
    return apiSuccess(status);
  } catch (error) {
    return apiInternalError(
      'Failed to get OmniCore status'
    );
  }
}
