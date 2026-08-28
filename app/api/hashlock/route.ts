// app/api/hashlock/route.ts
// ============================================================================
// HashLock Service — 5T 協議 T4 Trustworthy 的密碼學鎖定服務
//   提供三種 action：
//     generate      — SHA-256 hex hash lock（source + content + timestamp）
//     verify        — 驗證 hash lock（可帶 generate 回傳的 timestamp 精確比對）
//     verifyTrinity — 驗證確定性 trinity hash（不受時間窗限制）
//   認證：無（純計算服務，不讀寫任何持久化資料；僅公開 hash 生成與驗證）。
//   GET 僅回傳服務資訊，不執行任何寫入。
// ============================================================================
import { NextRequest } from 'next/server';
import { jsonResponse, jsonError } from '@lib/api-utils';
import { FiveTHashLock } from '@lib/five-t-protocol';

export const dynamic = 'force-dynamic';

// ── Types ─────────────────────────────────────────────────────

interface GenerateBody {
  action: 'generate';
  data: string;
  salt?: string;
}

interface VerifyBody {
  action: 'verify';
  data: string;
  salt: string;
  hashLock: string;
  /** 由 generate 回傳的 timestamp，用於精確驗證（可選） */
  timestamp?: number;
}

interface VerifyTrinityBody {
  action: 'verifyTrinity';
  data: string;
  salt: string;
  hashLock: string;
}

type HashLockBody = GenerateBody | VerifyBody | VerifyTrinityBody;

// ── POST Handler ──────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as HashLockBody;

    if (!body?.action) {
      return jsonError('INVALID_PARAMS', 'Missing required param: action', 400);
    }

    switch (body.action) {
      case 'generate': {
        const { data, salt } = body;
        if (!data) {
          return jsonError('INVALID_PARAMS', 'Missing required param: data', 400);
        }

        const ts = Date.now();
        const hashLock = FiveTHashLock.generate(data, salt || '', ts);
        return jsonResponse({
          hashLock,
          timestamp: ts,
        });
      }

      case 'verify': {
        const { data, salt, hashLock } = body;
        if (!data || !salt || !hashLock) {
          return jsonError('INVALID_PARAMS', 'Missing required params: data, salt, hashLock', 400);
        }

        const valid = FiveTHashLock.verify(data, salt, hashLock, undefined, body.timestamp);
        return jsonResponse({
          valid,
          hashLock,
        });
      }

      case 'verifyTrinity': {
        const { data, salt, hashLock } = body;
        if (!data || !salt || !hashLock) {
          return jsonError('INVALID_PARAMS', 'Missing required params: data, salt, hashLock', 400);
        }

        const valid = FiveTHashLock.verifyTrinity(data, salt, hashLock);
        return jsonResponse({
          valid,
          hashLock,
          type: 'trinity',
        });
      }

      default:
        return jsonError('INVALID_PARAMS', `Unknown action: ${(body as { action: string }).action}`, 400);
    }
  } catch {
    // 不洩漏內部錯誤細節（CLAUDE.md §2.3）
    return jsonError('INTERNAL_ERROR', 'Internal server error');
  }
}

// ── GET Handler ───────────────────────────────────────────────

export async function GET() {
  return jsonResponse({
    service: 'HashLock Service',
    version: '1.0.0',
    actions: ['generate', 'verify', 'verifyTrinity'],
  });
}
