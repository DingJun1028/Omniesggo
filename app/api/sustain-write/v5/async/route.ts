/**
 * POST /api/sustain-write/v5/async
 * 啟動非同步報告生成任務
 */
import { NextRequest } from 'next/server';
import { createTask, startAsyncTask, getAllTasks, getCompanyList } from '../../../../../src/core/services/async-task-manager';
import { CelestialController } from '../../../../../src/lib/celestial/implementation';
import { jsonResponse, jsonError } from '@lib/api-utils';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { companyId, templateId, noteIds, customCompany, renderOptions } = await req.json();

  if (!companyId) {
    return jsonError('INVALID_PARAMS', 'companyId is required', 400);
  }

  const celestial = new CelestialController();
  await celestial.executeCelestialFlow({
    payload: { companyId, templateId, noteIds, customCompany, action: 'START_ESG_REPORT' },
    origin: 'ESG_REPORT_AGENT'
  });

  // 5T Transparent: renderOptions is carried on the task and consumed by the
  // preview/download renderers. It is NOT dropped here.
  const taskId = createTask(companyId, templateId, noteIds, customCompany, renderOptions);
  startAsyncTask(taskId, companyId);

  return jsonResponse({
    taskId,
    status: 'pending',
    message: '報告生成任務已啟動',
    progressUrl: `/api/sustain-write/v5/progress/${taskId}`,
  });
}

export async function GET() {
  return jsonResponse({
    version: '5.0-async',
    endpoints: {
      start: 'POST /api/sustain-write/v5/async { companyId }',
      progress: 'GET /api/sustain-write/v5/progress/:taskId',
      cancel: 'DELETE /api/sustain-write/v5/progress/:taskId',
    },
    companies: getCompanyList(),
    activeTasks: getAllTasks().filter(t => t.status === 'running' || t.status === 'pending').length,
  });
}
