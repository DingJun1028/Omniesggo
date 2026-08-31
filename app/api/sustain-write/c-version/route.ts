/**
 * ESGGO C版專業永續報告 — SSE API
 */

import { NextRequest, NextResponse } from 'next/server';
import { assembleCVersionReport, reportToHtml, reportToMarkdown, getAvailableCompanies } from '@lib/sustain-write';
import { jsonResponse, jsonError, jsonErrorInternal } from '@lib/api-utils';

interface CVersionReport {
  companyId: string;
  companyName: string;
  version: string;
  totalWords: number;
  fiveTStatus?: string;
  chapters: Array<{
    id: string;
    title: string;
    fiveTGate: string;
    content: string;
    wordCount: number;
  }>;
  generatedAt: string;
}

export const dynamic = 'force-dynamic';

export async function GET() {
  return jsonResponse({
    success: true,
    companies: getAvailableCompanies(),
    version: 'C版 v3.7',
    protocol: '5T 真善美信通',
    omniTag: 'enabled',
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, format = 'html' } = body;

    if (!companyId) {
      return jsonError('INVALID_PARAMS', '缺少 companyId 參數', 400);
    }

    const report = assembleCVersionReport(companyId) as CVersionReport | null;

    if (!report) {
      return NextResponse.json(
        { success: false, error: '找不到公司或無填答資料', companyId },
        { status: 404 }
      );
    }

    const serializedChapters = report.chapters.map((ch) => ({
      id: ch.id,
      title: ch.title,
      fiveTGate: ch.fiveTGate,
      wordCount: ch.wordCount,
      content: ch.content,
    }));

    if (format === 'markdown') {
      return jsonResponse({
        success: true,
        report: {
          companyId: report.companyId,
          companyName: report.companyName,
          totalWords: report.totalWords,
          fiveTStatus: report.fiveTStatus,
          chapters: serializedChapters,
          generatedAt: report.generatedAt,
        },
        markdown: reportToMarkdown({
          companyName: report.companyName,
          version: (report as { version?: string }).version ?? '1.0.0',
          generatedAt: report.generatedAt ?? new Date().toISOString(),
        }),
      });
    }

    return jsonResponse({
      success: true,
      report: {
        companyId: report.companyId,
        companyName: report.companyName,
        totalWords: report.totalWords,
        fiveTStatus: report.fiveTStatus,
        chapters: serializedChapters,
        generatedAt: report.generatedAt,
      },
      html: reportToHtml({
        companyName: report.companyName,
        version: (report as { version?: string }).version ?? '1.0.0',
      }),
    });
  } catch (error) {
    return jsonErrorInternal(error, 'INTERNAL_ERROR', 500);
  }
}
