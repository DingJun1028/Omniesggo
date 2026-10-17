import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DEFAULT_TOPICS } from '@/lib/materiality-topics';
import crypto from 'crypto';

export async function GET() {
  try {
    const latest = await prisma.materialityAssessment.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    if (!latest) {
      return NextResponse.json({
        success: true,
        data: {
          id: 'draft',
          title: '雙重重大性評估矩陣 2026',
          year: 2026,
          framework: 'GRI_CSRD',
          threshold: 3.5,
          topics: DEFAULT_TOPICS,
          hashLock: null,
          createdAt: new Date().toISOString(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...latest,
        topics: JSON.parse(latest.topicsJson),
      },
    });
  } catch (error: any) {
    console.error('Failed to fetch materiality assessment:', error);
    return NextResponse.json(
      { success: false, error: error.message || '查詢雙重重大性矩陣失敗' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title = '雙重重大性評估矩陣 2026', year = 2026, framework = 'GRI_CSRD', threshold = 3.5, topics } = body;

    if (!topics || !Array.isArray(topics)) {
      return NextResponse.json(
        { success: false, error: '請提供有效的重大性議題列表' },
        { status: 400 }
      );
    }

    const topicsJson = JSON.stringify(topics);
    const timestamp = Date.now();
    const rawDataToHash = `5T:MATERIALITY:${title}:${year}:${framework}:${threshold}:${topicsJson}:${timestamp}`;
    const hashLock = crypto.createHash('sha256').update(rawDataToHash).digest('hex');

    const created = await prisma.materialityAssessment.create({
      data: {
        title,
        year: Number(year),
        framework,
        threshold: Number(threshold),
        topicsJson,
        hashLock,
        sourceOrigin: 'omni-materiality',
        createdBy: 'omni-core-user',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: created.id,
        title: created.title,
        year: created.year,
        framework: created.framework,
        threshold: created.threshold,
        topics,
        hashLock: created.hashLock,
        createdAt: created.createdAt,
        message: '5T 雙重重大性評估矩陣已成功密碼學刻印並落地！',
      },
    });
  } catch (error: any) {
    console.error('Failed to save materiality assessment:', error);
    return NextResponse.json(
      { success: false, error: error.message || '儲存雙重重大性矩陣失敗' },
      { status: 500 }
    );
  }
}
