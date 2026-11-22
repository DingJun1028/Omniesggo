import { NextRequest, NextResponse } from 'next/server';
import { generateFullV5Report, fullReportToHtml } from '@/core/services/report-generator-v5-full';
import { getV5Companies } from '@/core/services/report-generator-v5';
import { jsonResponse, jsonError } from '@lib/api-utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  return jsonResponse({ version: '5.0', companies: getV5Companies(), totalChapters: 28 });
}

export async function POST(req: NextRequest) {
  const { companyId, format = 'json', brandTone = 'professional', reportingYear } = await req.json();
  if (!companyId) return jsonError('INVALID_PARAMS', 'companyId is required', 400);
  const currentYear = new Date().getFullYear();
  const year = Number.isInteger(reportingYear) && reportingYear >= 2000 && reportingYear <= currentYear ? reportingYear : currentYear - 1;
  const report = await generateFullV5Report(companyId, brandTone, year);
  if (!report) return jsonError('COMPANY_NOT_FOUND', 'No report data available for this company', 404);
  if (format === 'html') return new NextResponse(fullReportToHtml(report), { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  if (format !== 'json') return jsonError('INVALID_PARAMS', 'format must be json or html', 400);
  return jsonResponse(report);
}
