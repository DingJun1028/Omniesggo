// ═══════════════════════════════════════════════════════════════
// POST /api/omni-soul — OmniSoul 系統端點
// ═══════════════════════════════════════════════════════════════

import { jsonResponse, jsonError, jsonErrorInternal } from '@lib/api-utils';
import { createOmniSoul, getOmniSoul } from '@/agents/omni-soul';
import type { SoulAwakeningState } from '@/types/omni-soul';
import { initSoul } from '@/agents/omni-soul-auto-seed';

export const dynamic = 'force-dynamic';

// ── Types ──────────────────────────────────────────────────

interface SoulOption {
  id: string;
  description: string;
}

interface SoulDecideContext {
  intent: string;
  options: SoulOption[];
}

interface AwakenAction {
  action: 'awaken';
  targetState: string;
}

interface DecideAction {
  action: 'decide';
  intent: string;
  options: SoulOption[];
}

interface ReflectAction {
  action: 'reflect';
}

interface ParseIntentAction {
  action: 'parseIntent';
  intent: string;
}

type SoulAction = AwakenAction | DecideAction | ReflectAction | ParseIntentAction;

// ── GET Handler ─────────────────────────────────────────────
export async function GET() {
  try {
    let soul = getOmniSoul();

    if (!soul) {
      await initSoul();
      soul = createOmniSoul();
    }

    const state = {
      name: soul.name,
      state: soul.state,
      alignment: soul.alignment,
      recentDecisions: soul.recentDecisions.length,
    };

    return jsonResponse(state);
  } catch (error) {
    return jsonErrorInternal(error);
  }
}

// ── POST Handler ────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SoulAction;

    if (!body?.action) {
      return jsonError('INVALID_PARAMS', 'Missing required param: action', 400);
    }

    let soul = getOmniSoul();
    if (!soul) {
      await initSoul();
      soul = createOmniSoul();
    }

    switch (body.action) {
      case 'awaken': {
        const { targetState } = body;
        if (!targetState) {
          return jsonError('INVALID_PARAMS', 'Missing required param: targetState', 400);
        }
        await soul.awaken(targetState as SoulAwakeningState);
        return jsonResponse({ status: 'awakened', state: { name: soul.name, state: soul.state, alignment: soul.alignment } });
      }

      case 'decide': {
        const { intent, options } = body;
        if (!intent || !options?.length) {
          return jsonError('INVALID_PARAMS', 'Missing required params: intent, options', 400);
        }
        const context: SoulDecideContext = { intent, options };
        const decision = await soul.decide(context);
        return jsonResponse({ decision, state: { name: soul.name, state: soul.state, alignment: soul.alignment } });
      }

      case 'reflect': {
        const reflection = await soul.reflect();
        return jsonResponse({ reflection, state: { name: soul.name, state: soul.state, alignment: soul.alignment } });
      }

      case 'parseIntent': {
        const { intent } = body;
        if (!intent) {
          return jsonError('INVALID_PARAMS', 'Missing required param: intent', 400);
        }
        const parsed = await soul.parseIntent(intent);
        return jsonResponse({ parsed });
      }

      default:
        return jsonError('INVALID_PARAMS', `Unknown action: ${(body as { action: string }).action}`, 400);
    }
  } catch (error) {
    return jsonErrorInternal(error);
  }
}
