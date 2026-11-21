/**
 * ==========================================
 * 完全代主自行 - 委派事件總線訂閱 (SSE)
 * ==========================================
 *
 * 即時推送某 delegation 的生命週期事件（經 omni-agent-bus 'external-forward'
 * 主題，含 SHA-256 hashLock 溯源）。以 monitor 權限把關（與 audit API 一致）。
 *
 * 路由:
 * - GET /api/delegation/events/stream?delegationId=xxx
 *     ?delegationId 必需；須具備該 delegation 的 monitor (or full) 權限
 *     -> text/event-stream，斷線自動退訂
 */

import { NextRequest } from 'next/server';
import { enhancedOmniBus } from '../../../../../lib/omni-agent-bus';
import { getDelegationManager } from '../../../../../agents/complete-delegation';
import { DelegationEventNames } from '../../../../../types/complete-delegation';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const DELEGATION_EVENT_TYPES = new Set(Object.values(DelegationEventNames));

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const delegationId = searchParams.get('delegationId');

  if (!delegationId) {
    return new Response(JSON.stringify({ error: 'delegationId is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const manager = getDelegationManager();
  const delegation = await manager.getDelegation(delegationId);
  if (!delegation) {
    return new Response(JSON.stringify({ error: 'Delegation not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const canMonitor = await manager.validateDelegation(delegationId, 'monitor');
  if (!canMonitor) {
    return new Response(
      JSON.stringify({
        error:
          'Insufficient permissions: event stream requires monitor (or full) permission',
      }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const lastIdHeader = request.headers.get('Last-Event-ID');
  const sinceParam = searchParams.get('sinceId');
  const sinceId =
    lastIdHeader && /^\d+$/.test(lastIdHeader)
      ? Number(lastIdHeader)
      : sinceParam && /^\d+$/.test(sinceParam)
        ? Number(sinceParam)
        : undefined;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      let heartbeat: ReturnType<typeof setInterval> | null = null;

      const send = (data: unknown, id?: number) => {
        if (closed) return;
        const prefix = id != null ? `id: ${id}\n` : '';
        try {
          controller.enqueue(encoder.encode(`${prefix}data: ${JSON.stringify(data)}\n\n`));
        } catch {
          /* controller 已關閉 */
        }
      };

      send({ type: 'CONNECTED', delegationId, ts: Date.now() });

      try {
        const trail = await manager.getFullEventTrail(delegationId, sinceId);
        for (const rec of trail) {
          send(
            {
              type: 'REPLAY',
              delegationId: rec.delegationId,
              hashLock: rec.hashLock,
              ts: rec.ts,
              source: rec.source,
              payload: rec.payload,
            },
            rec.id
          );
        }
        send({ type: 'REPLAY_DONE', delegationId, ts: Date.now(), count: trail.length });
      } catch {
        /* best-effort */
      }

      const unsub = enhancedOmniBus.subscribe('external-forward', (ev: unknown) => {
        const e = ev as Record<string, unknown>;
        const raw = e.payload as Record<string, unknown> | undefined;

        const delegationPayload = (() => {
          if (!raw || typeof raw !== 'object') return raw;
          if ('delegationId' in raw) return raw as Record<string, unknown>;
          if (raw.payload && typeof raw.payload === 'object') return raw.payload as Record<string, unknown>;
          return raw as Record<string, unknown>;
        })();

        const payload = delegationPayload as
          | { type?: string; delegationId?: string }
          | undefined;
        if (!payload || payload.delegationId !== delegationId) return;
        const eventType =
          (payload && payload.type) ||
          (typeof e.event === 'string' ? e.event : undefined);
        if (!eventType || !DELEGATION_EVENT_TYPES.has(eventType)) return;

        const hashLock =
          raw && typeof raw.hashLock === 'string'
            ? (raw.hashLock as string)
            : typeof e.hashLock === 'string'
              ? (e.hashLock as string)
              : undefined;

        const frameId =
          raw && typeof raw.journalId === 'number' ? (raw.journalId as number) : undefined;

        const sourceVal = (() => {
          if (raw && typeof raw === 'object' && raw.evidence && typeof raw.evidence === 'object') {
            const src = (raw.evidence as Record<string, unknown>).source;
            if (typeof src === 'string') return src;
          }
          if (raw && typeof raw === 'object') {
            const src = (raw as Record<string, unknown>).source_origin;
            if (typeof src === 'string') return src;
          }
          if (typeof e.source_origin === 'string') return e.source_origin;
          return undefined;
        })();

        const ts =
          (typeof e.ts === 'number' ? e.ts : undefined) ??
          (delegationPayload && typeof delegationPayload === 'object' && typeof (delegationPayload as Record<string, unknown>).ts === 'number'
            ? ((delegationPayload as Record<string, unknown>).ts as number)
            : undefined);
        send(
          {
            type: payload.type,
            delegationId: payload.delegationId,
            hashLock,
            ts,
            payload,
            source: sourceVal,
          },
          frameId
        );
      });
      heartbeat = setInterval(() => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch {
          /* controller 已關閉 */
        }
      }, 25000);

      request.signal.addEventListener('abort', () => {
        if (closed) return;
        closed = true;
        if (heartbeat) clearInterval(heartbeat);
        unsub();
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      });
    },
    cancel() {
      // kept as placeholder to satisfy ReadableStream contract;
      // abort-driven cleanup runs in start().
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
