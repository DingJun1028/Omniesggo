import { NextRequest, NextResponse } from 'next/server';
import { jsonError, jsonResponse } from '@lib/api-utils';
import { getTaskReport } from '@lib/redis';
import { fullReportToHtml, type ExtendedV5Report } from '@/core/services/report-generator-v5-full';

export const dynamic = 'force-dynamic';

function toMarkdown(report: ExtendedV5Report): string {
  const sections = [
    `# ${report.companyName} 永續報告（${report.reportingYear ?? ''}）`,
    '',
    '> 示範題庫資料；非公司實際提交或第三方確信文件。',
    '',
  ];
  for (const chapter of report.chapters ?? []) {
    sections.push(`## ${chapter.title}`, '', String(chapter.content ?? '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim(), '');
  }
  return sections.join('\n');
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  const snapshot = await getTaskReport(taskId);
  if (!snapshot) return jsonError('NOT_FOUND', '報告快照不存在或已過期', 404);

  const format = new URL(req.url).searchParams.get('format') || 'json';
  const report = snapshot.report as ExtendedV5Report;
  if (format === 'html') {
    return new NextResponse(fullReportToHtml(report), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
  if (format === 'md' || format === 'markdown') {
    return new NextResponse(toMarkdown(report), {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="sustainability-report-${encodeURIComponent(taskId)}.md"`,
      },
    });
  }
  if (format !== 'json') return jsonError('INVALID_PARAMS', 'format must be json, html, or markdown', 400);
  return jsonResponse(snapshot);
}
