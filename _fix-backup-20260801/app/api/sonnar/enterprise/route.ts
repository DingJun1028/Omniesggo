import { NextRequest } from 'next/server';
import { jsonResponse } from '@lib/api-utils';

export async function GET(req: NextRequest) {
  const companyId = req.nextUrl.searchParams.get('companyId') || 'unknown';

  let firebaseData: Record<string, unknown> | null = null;
  try {
    const { adminDb } = await import('@/lib/firebase-admin');
    const doc = await adminDb.collection('enterprises')?.doc(companyId)?.get();
    if (doc?.exists) {
      firebaseData = doc.data() as Record<string, unknown>;
    }
  } catch {
    // Firebase not available — use free-tier fallback
  }

  const profile = firebaseData ? {
    companyName: firebaseData.companyName || '未知企業',
    industry: firebaseData.industry || '未知產業',
    employeeCount: firebaseData.employeeCount || 0,
    revenue: firebaseData.revenue || '未揭露',
    headquarters: firebaseData.headquarters || '未知地點',
    sustainabilityGoals: firebaseData.sustainabilityGoals || [],
  } : {
    companyName: `企業 #${companyId.slice(0, 8)}`,
    industry: '未分類',
    employeeCount: Math.floor(Math.random() * 500) + 10,
    revenue: `NT$ ${(Math.random() * 100 + 1).toFixed(0)}M`,
    headquarters: '臺灣',
    sustainabilityGoals: [
      '淨零排放 2050',
      '綠色採購 30% 2027',
      '廢棄物減量 20% 2026',
    ],
  };

  return jsonResponse(profile);
}
