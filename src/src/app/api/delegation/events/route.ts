/**
 * ==========================================
 * 完全代主自行 - 委派事件雙向同步 (client → bus)
 * ==========================================
 *
 * POST /api/delegation/events
 *   接收 client 端經同一 omni-agent-bus 回寫的委派事件，
 *   與 GET /api/delegation/events/stream（server→client）互補，構成雙向同步。
 *   需具備該 delegation 的 execute（或 full）權限。
 *
 * body: { delegationId: string, type: DelegationEventNames, topic?: DelegationTopics, payload?: object }
 * 200 → { success, hashLock }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDelegationManager } from '../../../../agents/complete-delegation';
import { publishDelegationEvent } from '../../../../agents/complete-delegation/events';
import { DelegationEventNames, DelegationTopics } from '../../../../types/complete-delegation';
import { ERROR_CODES } from '@esggo/errors';

const EVENT_TYPES = new Set(Object.values(DelegationEventNames));
const TOPIC_VALUES = new Set(Object.values(DelegationTopics));

function topicForType(type: string): string {
  if (type.startsWith('delegation.decision.reported')) return DelegationTopics.REPORTING;
  if (type.startsWith('delegation.decision')) return DelegationTopics.DECISION;
  if (type.startsWith('delegation.execution')) return DelegationTopics.EXECUTION;
  return DelegationTopics.AUTHORIZATION;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { delegationId, type, topic, payload } = body ?? {};

    if (!delegationId || typeof delegationId !== 'string') {
      return NextResponse.json({ error: 'delegationId is required' }, { status: 400 });
    }
    if (!type || typeof type !== 'string' || !EVENT_TYPES.has(type)) {
      return NextResponse.json(
        { error: 'type must be a valid DelegationEventNames value' },
        { status: 400 }
      );
    }
    if (topic && typeof topic === 'string' && !TOPIC_VALUES.has(topic)) {
      return NextResponse.json(
        { error: 'topic must be a valid DelegationTopics value' },
        { status: 400 }
      );
    }

    const manager = getDelegationManager();
    const delegation = await manager.getDelegation(delegationId);
    if (!delegation) {
      return NextResponse.json({ error: 'Delegation not found' }, { status: 404 });
    }

    // 雙向回寫屬於動作，需 execute（或 full）權限
    const canWrite = await manager.validateDelegation(delegationId, 'execute');
    if (!canWrite) {
      return NextResponse.json(
        {
          error:
            'Insufficient permissions: event writeback requires execute (or full) permission',
        },
        { status: 403 }
      );
    }

    const resolvedTopic = topic && TOPIC_VALUES.has(topic) ? topic : topicForType(type);

    const result = await publishDelegationEvent(
      type,
      resolvedTopic,
      {
        type,
        delegationId,
        ...(payload && typeof payload === 'object' ? payload : {}),
      },
      'client'
    );

    if (result.status === 'error' || !result.hashLock) {
      return NextResponse.json(
        { success: false, error: 'event forward failed' },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, hashLock: result.hashLock });
  } catch (error) {
    console.error('[Delegation Events API] 回寫事件失敗:', error);
    return NextResponse.json(
      {
        error: ERROR_CODES.INTERNAL_ERROR.message, code: ERROR_CODES.INTERNAL_ERROR.code,
      },
      { status: 500 }
    );
  }
}
