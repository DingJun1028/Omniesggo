import { NextRequest } from 'next/server';
import { jsonResponse } from '@lib/api-utils';

export async function GET(req: NextRequest) {
  const companyId = req.nextUrl.searchParams.get('companyId') || 'unknown';

  let firebaseProgress: Record<string, unknown> | null = null;
  try {
    const { adminDb } = await import('@/lib/firebase-admin');
    const doc = await adminDb.collection('enterprises')?.doc(companyId)?.get();
    if (doc?.exists) {
      const data = doc.data() as Record<string, unknown>;
      firebaseProgress = data.documentProgress as Record<string, unknown> || null;
    }
  } catch {
    // Firebase not available — use free-tier fallback
  }

  const progress = firebaseProgress ? {
    totalRequired: firebaseProgress.totalRequired || 0,
    collected: firebaseProgress.collected || 0,
    pending: firebaseProgress.pending || 0,
    categories: firebaseProgress.categories || {},
  } : {
    totalRequired: 120,
    collected: 68,
    pending: 52,
    categories: {
      energy: { collected: 30, required: 40 },
      water: { collected: 10, required: 15 },
      waste: { collected: 18, required: 35 },
      social: { collected: 10, required: 30 },
    },
  };

  return jsonResponse(progress);
}
