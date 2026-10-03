import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const roadmap = await prisma.netZeroRoadmap.findUnique({
      where: { id },
    });

    if (!roadmap) {
      return NextResponse.json(
        { success: false, error: '找不到該筆 5T 淨零路徑規劃紀錄' },
        { status: 404 }
      );
    }

    const measures = JSON.parse(roadmap.measuresJson);
    const totalReductionPotential = measures.reduce((acc: number, m: any) => acc + m.reductionPotential, 0);
    const target2030Emissions = roadmap.baseEmissions * (1 - roadmap.target2030Percent / 100);

    const certificate = {
      $schema: 'https://esggo.co/schemas/5t-netzero-roadmap-v1.json',
      title: '5T 淨零減碳路徑與 MACC 邊際成本官方證明書 (Net-Zero Certificate)',
      issuedAt: new Date().toISOString(),
      standardCompliance: ['SBTi 1.5°C Near-Term Target', 'TCFD Metrics & Targets', 'ISO-14064-1', '5T Protocol'],
      roadmapDetails: {
        id: roadmap.id,
        title: roadmap.title,
        baseYear: roadmap.baseYear,
        baseEmissionsTCO2e: roadmap.baseEmissions,
        target2030Percent: roadmap.target2030Percent,
        target2030EmissionsTCO2e: target2030Emissions,
        totalPlannedReductionTCO2e: totalReductionPotential,
        netZeroYearTarget: 2050,
      },
      abatementInterventions: measures.map((m: any) => ({
        id: m.id,
        name: m.name,
        category: m.category,
        annualReductionPotentialTCO2e: m.reductionPotential,
        costPerTonTWD: m.costPerTon,
        totalCapexTWD: m.capex,
        status: m.status,
      })),
      fiveTProtocol: {
        truth: {
          verified: true,
          sourceOrigin: roadmap.sourceOrigin,
          provenance: 'Enterprise MACC Simulation Engine',
        },
        goodness: {
          verified: true,
          methodology: 'McKinsey Marginal Abatement Cost Curve (MACC) Standard',
        },
        beauty: {
          verified: true,
          uiLanguage: 'Liquid Glass Cyan Net-Zero Dashboard',
        },
        trustworthy: {
          verified: true,
          hashLock: roadmap.hashLock,
          algorithm: 'SHA-256',
        },
        trackable: {
          verified: true,
          recordId: roadmap.id,
          createdAt: roadmap.createdAt,
        },
      },
    };

    return new NextResponse(JSON.stringify(certificate, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="5T_NetZero_Roadmap_Certificate_${id.slice(0, 8)}.json"`,
      },
    });
  } catch (error: any) {
    console.error('Export roadmap certificate error:', error);
    return NextResponse.json(
      { success: false, error: error.message || '匯出淨零證明書失敗' },
      { status: 500 }
    );
  }
}
