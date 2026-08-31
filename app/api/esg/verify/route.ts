import { NextResponse } from 'next/server';
import { DataOrchestratorServer } from '@lib/services/esg/DataOrchestratorServer';

export async function POST(request: Request) {
  try {
    const { metric } = await request.json();
    const result = await DataOrchestratorServer.verifyMetricSingle(metric);
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("[API/ESG/VERIFY] Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
