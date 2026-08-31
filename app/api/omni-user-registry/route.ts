/**
 * GET /api/omni-user-registry
 * OmniUserRegistry — RAG 成長資料庫 API
 *
 * POST /api/omni-user-registry
 *   { action: "record", userId, type, content }
 *   { action: "search",   userId, query, limit? }
 *   { action: "preferences", userId }
 */
import { NextRequest } from 'next/server';
import { getOmniUserRegistry } from '@/agents/omni-user-registry';
import type { UserInteraction } from '@/agents/omni-user-registry';
import { jsonResponse, jsonError, jsonErrorInternal } from '@lib/api-utils';

export const dynamic = 'force-dynamic';

// ─── GET ──────────────────────────────────────────────────────
export async function GET() {
  try {
    const registry = getOmniUserRegistry();
    const metrics = registry.getMetrics();
    const knowledge = registry.getKnowledgeStats();

    return jsonResponse({ metrics, knowledge });
  } catch (err) {
    const error = err as Error;
    console.error('OmniUserRegistry GET Error:', error);
    return jsonErrorInternal(error);
  }
}

// ─── POST ─────────────────────────────────────────────────────
interface RecordBody {
  action: 'record';
  userId: string;
  type: UserInteraction['type'];
  content: string;
}

interface SearchBody {
  action: 'search';
  userId: string;
  query: string;
  limit?: number;
}

interface PreferencesBody {
  action: 'preferences';
  userId: string;
}

type PostBody = RecordBody | SearchBody | PreferencesBody;

export async function POST(req: NextRequest) {
  try {
    const body: PostBody = await req.json();
    const registry = getOmniUserRegistry();

    switch (body.action) {
      case 'record': {
        const { userId, type, content } = body;
        if (!userId || !type || !content) {
          return jsonError('INVALID_PARAMS', '缺少必要參數: userId, type, content');
        }
        const validTypes: UserInteraction['type'][] = [
          'query',
          'command',
          'feedback',
          'implicit',
        ];
        if (!validTypes.includes(type)) {
          return jsonError(
            'INVALID_PARAMS',
            `無效的互動類型: ${type}，允許值: ${validTypes.join(', ')}`,
          );
        }
        const interactionId = await registry.recordInteraction({
          userId,
          type,
          content,
          timestamp: Date.now(),
        });
        return jsonResponse({ interactionId });
      }

      case 'search': {
        const { userId, query, limit } = body;
        if (!userId || !query) {
          return jsonError('INVALID_PARAMS', '缺少必要參數: userId, query');
        }
        const results = await registry.enhancedSearch(
          userId,
          query,
          limit ?? 10,
        );
        return jsonResponse({ results, count: results.length });
      }

      case 'preferences': {
        const { userId } = body;
        if (!userId) {
          return jsonError('INVALID_PARAMS', '缺少必要參數: userId');
        }
        const preferences = registry.getUserPreferences(userId);
        return jsonResponse({ userId, preferences });
      }

      default:
        return jsonError('UNKNOWN_TOOL', `未知的 action: ${(body as { action: string }).action}`);
    }
  } catch (err) {
    const error = err as Error;
    console.error('OmniUserRegistry POST Error:', error);
    return jsonErrorInternal(error);
  }
}
