/**
 * GET /api/daily-report — list recent reports
 * GET /api/daily-report?date=YYYY-MM-DD — get specific date
 * GET /api/daily-report — get today's ( */

import { NextRequest } from 'next/server';
import { getDailyReportService } from '@/core/services/daily-report-service';
import { jsonResponse, jsonError } from '@lib/api-utils';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const service = getDailyReportService();
    const dateParam = req.nextUrl.searchParams.get('date');
    const todayParam = req.nextUrl.searchParams.get('today');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '30');

    if (todayParam === 'true') {
      const report = await service.getTodayReport();
      return jsonResponse({ success: true, report });
    }

    if (dateParam) {
      const date = new Date(dateParam);
      // Find by date string match
      // Quick approach: generate if not exists
      const report = await service.generateReport(date);
      return jsonResponse({ success: true, report });
    }

    const reports = await service.listReports(limit, 'published');
    return jsonResponse({ success: true, reports, count: reports.length });
  } catch (error: unknown) {
    console.error('[api] INTERNAL_ERROR:', error);
    return jsonError('INTERNAL_ERROR', undefined, 500);
  }
}
