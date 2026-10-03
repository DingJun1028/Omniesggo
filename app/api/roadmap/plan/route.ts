import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export interface AbatementMeasure {
  id: string;
  name: string;
  category: 'Energy' | 'Efficiency' | 'Mobility' | 'ValueChain' | 'Offsets';
  reductionPotential: number; // tCO2e/year
  costPerTon: number; // TWD / tCO2e (Negative means net financial savings!)
  capex: number; // Total Initial Investment in TWD
  status: 'Planned' | 'In_Progress' | 'Completed';
}

export const DEFAULT_MEASURES: AbatementMeasure[] = [
  { id: 'm1', name: '全廠 LED 與高效率 IE4 馬達替換', category: 'Efficiency', reductionPotential: 3200, costPerTon: -1500, capex: 4800000, status: 'Completed' },
  { id: 'm2', name: '屋頂型太陽能光電案場 (1.2MW)', category: 'Energy', reductionPotential: 6500, costPerTon: -800, capex: 36000000, status: 'In_Progress' },
  { id: 'm3', name: '廠區堆高機與公務車全電動化', category: 'Mobility', reductionPotential: 2100, costPerTon: 250, capex: 7500000, status: 'Planned' },
  { id: 'm4', name: '綠電 CPPA 企業購電協議 (RE100)', category: 'Energy', reductionPotential: 12000, costPerTon: 600, capex: 0, status: 'Planned' },
  { id: 'm5', name: '供應鏈低碳循環材料替代專案', category: 'ValueChain', reductionPotential: 5400, costPerTon: 1200, capex: 12000000, status: 'Planned' },
  { id: 'm6', name: '高品質碳抵換與森林碳匯專案', category: 'Offsets', reductionPotential: 3000, costPerTon: 2500, capex: 7500000, status: 'Planned' },
];

export async function GET() {
  try {
    const latest = await prisma.netZeroRoadmap.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    if (!latest) {
      return NextResponse.json({
        success: true,
        data: {
          id: 'draft',
          title: '企業淨零碳中和減碳路徑規劃 2050',
          baseYear: 2024,
          baseEmissions: 50000,
          target2030Percent: 42.0,
          measures: DEFAULT_MEASURES,
          hashLock: null,
          createdAt: new Date().toISOString(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...latest,
        measures: JSON.parse(latest.measuresJson),
      },
    });
  } catch (error: any) {
    console.error('Failed to fetch Net-Zero roadmap:', error);
    return NextResponse.json(
      { success: false, error: error.message || '查詢淨零減碳路徑失敗' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      title = '企業淨零碳中和減碳路徑規劃 2050', 
      baseYear = 2024, 
      baseEmissions = 50000, 
      target2030Percent = 42.0, 
      measures 
    } = body;

    if (!measures || !Array.isArray(measures)) {
      return NextResponse.json(
        { success: false, error: '請提供有效的減碳措施列表' },
        { status: 400 }
      );
    }

    const measuresJson = JSON.stringify(measures);
    const timestamp = Date.now();
    const rawDataToHash = `5T:ROADMAP:${title}:${baseYear}:${baseEmissions}:${target2030Percent}:${measuresJson}:${timestamp}`;
    const hashLock = crypto.createHash('sha256').update(rawDataToHash).digest('hex');

    const created = await prisma.netZeroRoadmap.create({
      data: {
        title,
        baseYear: Number(baseYear),
        baseEmissions: Number(baseEmissions),
        target2030Percent: Number(target2030Percent),
        measuresJson,
        hashLock,
        sourceOrigin: 'omni-roadmap',
        createdBy: 'omni-core-user',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: created.id,
        title: created.title,
        baseYear: created.baseYear,
        baseEmissions: created.baseEmissions,
        target2030Percent: created.target2030Percent,
        measures,
        hashLock: created.hashLock,
        createdAt: created.createdAt,
        message: '5T 淨零減碳路徑規劃已成功密碼學刻印並落地！',
      },
    });
  } catch (error: any) {
    console.error('Failed to save Net-Zero roadmap:', error);
    return NextResponse.json(
      { success: false, error: error.message || '儲存淨零減碳路徑失敗' },
      { status: 500 }
    );
  }
}
