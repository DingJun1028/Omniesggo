import { NextRequest } from 'next/server';
import { jsonResponse } from '@lib/api-utils';
import { listTaskReports } from '@lib/redis';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get('companyId') || undefined;
  const limit = Number(searchParams.get('limit') || 50);
  const reports = await listTaskReports(companyId, limit);
  return jsonResponse({
    reports,
    retentionSeconds: 7 * 24 * 60 * 60,
    storage: 'redis-or-process-memory',
    durable: false,
  });
}
