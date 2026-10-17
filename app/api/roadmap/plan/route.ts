import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DEFAULT_MEASURES } from '@/lib/roadmap-measures';
import crypto from 'crypto';

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
