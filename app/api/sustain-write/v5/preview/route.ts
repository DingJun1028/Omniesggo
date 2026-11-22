import { NextRequest, NextResponse } from 'next/server';
import { jsonError } from '@lib/api-utils';
import { getTaskReport } from '@lib/redis';
import { fullReportToHtml, type ExtendedV5Report } from '@/core/services/report-generator-v5-full';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get('taskId');
  if (!taskId) return jsonError('INVALID_PARAMS', 'taskId is required', 400);
  const snapshot = await getTaskReport(taskId);
  if (!snapshot) return jsonError('NOT_FOUND', '報告快照不存在或已過期', 404);
  const format = searchParams.get('format') || 'html';
  if (format === 'html') return new NextResponse(fullReportToHtml(snapshot.report as ExtendedV5Report), { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  if (format === 'json') return NextResponse.json(snapshot);
  return jsonError('INVALID_PARAMS', 'format must be html or json', 400);
}
