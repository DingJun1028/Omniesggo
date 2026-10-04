/**
 * GET /api/cron/status — list all cron jobs + last run time
 * POST /api/cron/run — manually trigger a job {job: 'daily-report' | 'achievement-check' | 'crawler-trigger'}
 */

import { NextRequest, NextResponse } from 'next/server';
import { jsonError, jsonResponse } from '@lib/api-utils';
import { verifyWebhookSignature } from '@lib/webhook-auth';

/**
 * 認證守門：cron 手動觸發端點僅供內部排程或持有 CRON_SECRET 的服務呼叫。
 * 使用常數時間 HMAC 比對避免時序攻擊。
 */
function assertCronAuth(req: NextRequest): NextResponse | null {
  const secret = process.env.CRON_SECRET;
  const signature = req.headers.get('x-cron-secret');
  const bearer = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

  if (secret) {
    const provided = signature || bearer;
    if (!provided) {
      return jsonError('UNAUTHORIZED', 'Invalid or missing cron secret', 401);
    }

    // Use timing-safe comparison when possible
    const payload = `${req.method}:${req.url}`;
    if (verifyWebhookSignature(payload, provided, secret)) {
      return null;
    }

    // Fallback for simple equality if payload-based verification isn't appropriate
    if (provided === secret) {
      return null;
    }

    return jsonError('UNAUTHORIZED', 'Invalid or missing cron secret', 401);
  }

  if (!req.headers.get('x-user-id')) {
    return jsonError('UNAUTHORIZED', 'Authentication required', 401);
  }
  return null;
}

export async function GET() {
  return jsonResponse({
    success: true,
    data: {
      jobs: [
        { name: 'daily-report', interval: '24h', description: '每日永續觀察者日報生成' },
        { name: 'achievement-check', interval: '1h', description: '用戶成就/階級檢查' },
        { name: 'crawler-trigger', interval: '6h', description: 'ESG 爬蟲觸發' },
        { name: 'esggo-monitor-vps-health', interval: '30m', agentId: 13, description: 'Hermes Agent 13: VPS 健康狀態自動巡檢' },
        { name: 'esggo-monitor-docker-status', interval: '2h', agentId: 14, description: 'Hermes Agent 14: Docker & 本地 AI 服務巡檢' },
        { name: 'esggo-daily-report', interval: '24h', agentId: 28, description: 'Hermes Agent 28: 30 萬能蜂群全自動巡檢日報' },
      ],
    },
    metadata: { timestamp: Date.now(), provider: 'hermes-30-agent-cron-scheduler' },
  });
}

export async function POST(req: NextRequest) {
  const authErr = assertCronAuth(req);
  if (authErr) return authErr;
  try {
    const body = await req.json();
    const { job } = body;

    const {
      generateDailyReportJob,
      checkUserAchievements,
      monitorVpsHealthJob,
      monitorDockerStatusJob,
      generateSwarmDailyReportJob,
    } = await import('@/lib/cron-jobs');

    switch (job) {
      case 'daily-report': {
        const result = await generateDailyReportJob();
        return jsonResponse({ success: result.success, data: result });
      }
      case 'achievement-check': {
        const result = await checkUserAchievements();
        return jsonResponse(result);
      }
      case 'esggo-monitor-vps-health':
      case 'vps-health-check': {
        const result = await monitorVpsHealthJob();
        return jsonResponse({ success: result.success, data: result });
      }
      case 'esggo-monitor-docker-status':
      case 'docker-status-check': {
        const result = await monitorDockerStatusJob();
        return jsonResponse({ success: result.success, data: result });
      }
      case 'esggo-daily-report':
      case 'swarm-daily-report': {
        const result = await generateSwarmDailyReportJob();
        return jsonResponse({ success: result.success, data: result });
      }
      default:
        return jsonError('INVALID_ACTION', `Unknown job: ${job}`);
    }
  } catch (error) {
    console.error('[cron] POST failed:', error);
    return jsonError('INTERNAL_ERROR');
  }
}

