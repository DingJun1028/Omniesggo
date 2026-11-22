import { NextRequest, NextResponse } from 'next/server';
import { jsonError } from '@lib/api-utils';
import { getTaskReport } from '@lib/redis';
import { fullReportToHtml, type ExtendedV5Report } from '@/core/services/report-generator-v5-full';

export const dynamic = 'force-dynamic';

function toMarkdown(report: ExtendedV5Report): string {
  const lines = [`# ${report.companyName} 永續報告（${report.reportingYear ?? ''}）`, '', '> 示範題庫資料；非公司實際提交或第三方確信文件。', ''];
  for (const chapter of report.chapters ?? []) {
    lines.push(`## ${chapter.title}`, '', String(chapter.content ?? '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim(), '');
  }
  return lines.join('\n');
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get('taskId');
  if (!taskId) return jsonError('INVALID_PARAMS', 'taskId is required', 400);
  const snapshot = await getTaskReport(taskId);
  if (!snapshot) return jsonError('NOT_FOUND', '報告快照不存在或已過期', 404);
  const report = snapshot.report as ExtendedV5Report;
  const format = searchParams.get('format') || 'html';
  if (format === 'html') return new NextResponse(fullReportToHtml(report), { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Content-Disposition': `attachment; filename="report-${encodeURIComponent(taskId)}.html"` } });
  if (format === 'md' || format === 'markdown') return new NextResponse(toMarkdown(report), { headers: { 'Content-Type': 'text/markdown; charset=utf-8', 'Content-Disposition': `attachment; filename="report-${encodeURIComponent(taskId)}.md"` } });
  return jsonError('INVALID_PARAMS', 'format must be html or markdown', 400);
}
