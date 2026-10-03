import { NextRequest, NextResponse } from 'next/server';
import { generateV5Report, reportV5ToHtml, reportV5ToMarkdown } from '@/core/services/report-generator-v5';
import { jsonError, jsonErrorInternal } from '@lib/api-utils';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get('companyId');
  const format = searchParams.get('format') || 'html';

  if (!companyId) {
    return jsonError('INVALID_PARAMS', 'companyId is required', 400);
  }

  try {
    const report = generateV5Report(companyId);
    if (!report) {
      return jsonError('NOT_FOUND', 'Report could not be generated', 404);
    }

    if (format === 'md' || format === 'markdown') {
      const mdContent = reportV5ToMarkdown(report);
      return new NextResponse(mdContent, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      });
    }

    // Default to HTML
    const htmlContent = reportV5ToHtml(report);
    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });

  } catch (error: unknown) {
    return jsonErrorInternal(error, 'INTERNAL_ERROR', 500);
  }
}
