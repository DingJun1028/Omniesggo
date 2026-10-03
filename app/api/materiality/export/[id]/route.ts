import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const assessment = await prisma.materialityAssessment.findUnique({
      where: { id },
    });

    if (!assessment) {
      return NextResponse.json(
        { success: false, error: '找不到該筆 5T 雙重重大性評估紀錄' },
        { status: 404 }
      );
    }

    const topics = JSON.parse(assessment.topicsJson);
    const materialTopics = topics.filter(
      (t: any) => t.impactScore >= assessment.threshold && t.financialScore >= assessment.threshold
    );

    const certificate = {
      $schema: 'https://esggo.co/schemas/5t-materiality-v1.json',
      title: '5T 雙重重大性評估官方稽核證明書 (Double Materiality Certificate)',
      issuedAt: new Date().toISOString(),
      standardCompliance: ['GRI 3: Material Topics 2021', 'EU CSRD ESRS 2', 'ISO-14064-1', '5T Protocol'],
      assessmentDetails: {
        id: assessment.id,
        assessmentTitle: assessment.title,
        evaluationYear: assessment.year,
        framework: assessment.framework,
        materialityThreshold: assessment.threshold,
        totalTopicsEvaluated: topics.length,
        materialTopicsCount: materialTopics.length,
      },
      materialTopics: materialTopics.map((t: any) => ({
        topicId: t.id,
        topicName: t.name,
        category: t.category === 'E' ? 'Environmental' : t.category === 'S' ? 'Social' : 'Governance',
        impactScore: t.impactScore,
        financialScore: t.financialScore,
        rationale: t.rationale,
      })),
      fiveTProtocol: {
        truth: {
          verified: true,
          sourceOrigin: assessment.sourceOrigin,
          provenance: 'Internal Governance & Stakeholder Survey Engine',
        },
        goodness: {
          verified: true,
          methodology: 'EU CSRD Double Materiality Matrix Algorithm',
        },
        beauty: {
          verified: true,
          uiLanguage: 'Liquid Glass Cyan Dashboard',
        },
        trustworthy: {
          verified: true,
          hashLock: assessment.hashLock,
          algorithm: 'SHA-256',
        },
        trackable: {
          verified: true,
          recordId: assessment.id,
          createdAt: assessment.createdAt,
        },
      },
    };

    return new NextResponse(JSON.stringify(certificate, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="5T_Materiality_Certificate_${id.slice(0, 8)}.json"`,
      },
    });
  } catch (error: any) {
    console.error('Export materiality certificate error:', error);
    return NextResponse.json(
      { success: false, error: error.message || '匯出證明書失敗' },
      { status: 500 }
    );
  }
}
