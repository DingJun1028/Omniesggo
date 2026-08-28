/**
 * GET /api/omni-center/summary
 *
 * 回傳 OmniCenter dashboard 需要的摘要數字。
 * 依現有 Prisma 模型直接估算：caseCount = CompanyReport, griIndicatorCount = ESGTag。
 * 若 DB 查詢失敗，保留安全的 fallback。
 */

import { jsonResponse } from '@lib/api-utils';
import { prisma } from '@lib/storage-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(): Promise<Response> {
  try {
    const [companyReportCount, esgTagCount] = await Promise.all([
      prisma.companyReport.count().catch(() => null),
      prisma.eSGTag.count().catch(() => null),
    ]);

    const caseCount =
      typeof companyReportCount === 'number' && Number.isFinite(companyReportCount)
        ? companyReportCount
        : 47;

    const griIndicatorCount =
      typeof esgTagCount === 'number' && Number.isFinite(esgTagCount)
        ? esgTagCount
        : 142;

    const fallback =
      companyReportCount === null || esgTagCount === null;

    return jsonResponse({
      success: true,
      data: {
        caseCount,
        griIndicatorCount,
        updatedAt: Date.now(),
        fallback,
        kpiCards: [
          { label: 'OmniOne 案件', value: caseCount, theme: 'accentPurple' },
          { label: 'GRI 指標', value: griIndicatorCount, theme: 'accentGold' },
          { label: '法規彙總', value: 36, theme: 'accentTeal' },
          { label: '即時警示', value: 12, theme: 'accentRed' },
        ],
      },
    });
  } catch {
    return jsonResponse({
      success: true,
      data: {
        caseCount: 47,
        griIndicatorCount: 142,
        updatedAt: Date.now(),
        fallback: true,
        kpiCards: [
          { label: 'OmniOne 案件', value: 47, theme: 'accentPurple' },
          { label: 'GRI 指標', value: 142, theme: 'accentGold' },
          { label: '法規彙總', value: 36, theme: 'accentTeal' },
          { label: '即時警示', value: 12, theme: 'accentRed' },
        ],
      },
    });
  }
}
