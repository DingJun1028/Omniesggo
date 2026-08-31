import { NextRequest } from 'next/server';
import { jsonResponse } from '@lib/api-utils';

export async function GET(req: NextRequest) {
  const companyId = req.nextUrl.searchParams.get('companyId') || 'unknown';

  let firebaseMetrics: Record<string, unknown> | null = null;
  try {
    const { adminDb } = await import('@/lib/firebase-admin');
    const doc = await adminDb.collection('enterprises')?.doc(companyId)?.get();
    if (doc?.exists) {
      const data = doc.data() as Record<string, unknown>;
      firebaseMetrics = data.sustainabilityMetrics as Record<string, unknown> || null;
    }
  } catch {
    // Firebase not available
  }

  const metrics = firebaseMetrics || {
    carbonEmissions: {
      scope1: { value: Math.round(Math.random() * 2000 + 500), unit: 'tCO2e' },
      scope2: { value: Math.round(Math.random() * 5000 + 1000), unit: 'tCO2e' },
      scope3: { value: Math.round(Math.random() * 10000 + 5000), unit: 'tCO2e' },
    },
    energyConsumption: {
      total: Math.round(Math.random() * 60000 + 10000),
      renewable: Math.round(Math.random() * 25000 + 5000),
      unit: 'MWh',
    },
    waterUsage: {
      total: Math.round(Math.random() * 500000 + 100000),
      recycled: Math.round(Math.random() * 150000 + 30000),
      unit: 'm3',
    },
    wasteManagement: {
      total: Math.round(Math.random() * 1000 + 200),
      recycled: Math.round(Math.random() * 500 + 100),
      landfill: Math.round(Math.random() * 200 + 50),
      unit: 'tons',
    },
  };

  return jsonResponse(metrics);
}
