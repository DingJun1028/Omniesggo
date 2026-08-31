/**
 * POST /api/daily-report/generate
 * Body: { date?: "YYYY-MM-DD" }
 * Generates/regenerates a daily report
 */

import { NextRequest } from 'next/server';
import { getDailyReportService } from '@/core/services/daily-report-service';
import { jsonResponse, jsonError } from '@lib/api-utils';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { date } = await req.json();
    const service = getDailyReportService();

    const targetDate = date ? new Date(date) : new Date();
    const report = await service.generateReport(targetDate);

    return jsonResponse({ success: true, report });
  } catch (error: unknown) {
    console.error('[api] INTERNAL_ERROR:', error);
    return jsonError('INTERNAL_ERROR');
  }
}
