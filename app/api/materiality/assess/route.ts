import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export interface MaterialityTopic {
  id: string;
  name: string;
  category: 'E' | 'S' | 'G';
  impactScore: number;
  financialScore: number;
  rationale: string;
}

export const DEFAULT_TOPICS: MaterialityTopic[] = [
  { id: 'e1', name: '氣候變遷與碳排放 (Climate & GHG)', category: 'E', impactScore: 4.8, financialScore: 4.5, rationale: '歐盟 CBAM 與台灣碳費直接影響生產營運成本。' },
  { id: 'e2', name: '能源轉型與再生能源 (Energy Transition)', category: 'E', impactScore: 4.5, financialScore: 4.2, rationale: '綠電採購及 RE100 轉型為國際客戶硬性要求。' },
  { id: 'e3', name: '水資源與廢棄物管理 (Water & Circularity)', category: 'E', impactScore: 3.8, financialScore: 3.6, rationale: '循環經濟與極端氣候防缺水風險。' },
  { id: 's1', name: '職場健康、安全與人權 (OHS & Human Rights)', category: 'S', impactScore: 4.2, financialScore: 3.8, rationale: '勞工權益與零工傷保護為法規核心基準。' },
  { id: 's2', name: '人才吸引、留任與培育 (Talent & Diversity)', category: 'S', impactScore: 4.0, financialScore: 4.1, rationale: '少子化挑戰下關鍵人才永續經營策略。' },
  { id: 's3', name: '供應鏈永續與人權稽核 (Supply Chain ESG)', category: 'S', impactScore: 4.4, financialScore: 4.3, rationale: '供應商 ESG 評鑑與稽核免除斷鏈風險。' },
  { id: 'g1', name: '公司治理與商業道德 (Governance & Ethics)', category: 'G', impactScore: 4.9, financialScore: 4.8, rationale: '誠信經營、反貪腐與誠信交易基礎。' },
  { id: 'g2', name: '資安防護與個人資料保護 (Data Security & Privacy)', category: 'G', impactScore: 4.7, financialScore: 4.6, rationale: '防止勒索軟體與核心資安防護。' },
  { id: 'g3', name: '透明資訊揭露與5T可追溯性 (5T Transparency)', category: 'G', impactScore: 4.6, financialScore: 4.4, rationale: '5T 密碼學刻印確保免受綠洗與稽核處罰。' },
];

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
