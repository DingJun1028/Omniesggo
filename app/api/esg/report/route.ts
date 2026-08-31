import { NextResponse } from 'next/server';
import { ReportGeneratorServer } from '@lib/services/esg/ReportGeneratorServer';

export async function POST(request: Request) {
  try {
    const { metrics } = await request.json();
    
    if (!metrics || !Array.isArray(metrics)) {
      return NextResponse.json({ error: "Invalid metrics data" }, { status: 400 });
    }

    const report = await ReportGeneratorServer.generateStrategicReport(metrics);
    
    return NextResponse.json(report);
  } catch (error: unknown) {
    console.error("[API Report] Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
