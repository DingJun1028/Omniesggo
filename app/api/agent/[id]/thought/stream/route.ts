// ============================================================
// Agent Thought Stream (SSE)
// app/api/agent/[id]/thought/stream/route.ts
// GET /api/agent/<id>/thought/stream?runId=<optional>
// 訂閱 OmniAgentBus 思考流頻道 omni://agent/<id>/thought，
// 以 text/event-stream 即時轉推思考片段（對齊 5T hashLock 溯源）。
// ============================================================
import { subscribeBusEvent } from '@/lib/bus';
import type { IBusEvent } from '@/lib/omni-agent-bus';

export const dynamic = 'force-dynamic';

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const match = url.pathname.match(/\/api\/agent\/([^/]+)\/thought\/stream/);
  const agentId = match ? decodeURIComponent(match[1]) : 'unknown';
  const runId = url.searchParams.get('runId');

  const encoder = new TextEncoder();
  const topic = `omni://agent/${agentId}/thought`;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (payload: unknown) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        } catch {
          /* controller 已關閉 */
        }
      };

      const unsub = subscribeBusEvent(topic, (ev: IBusEvent) => {
        const payload = ((ev && ev.payload) || ev) as {
          runId?: string;
          step?: string;
          content?: string;
          [k: string]: unknown;
        };
        if (runId && payload.runId !== runId) return; // 過濾特定 run
        send({
          type: 'thought',
          agentId,
          runId: payload.runId,
          step: payload.step,
          content: payload.content,
        });
      });

      // 連線確認
      send({ type: 'connected', agentId, topic, runId });

      const cleanup = () => {
        unsub();
        try {
          controller.close();
        } catch {
          /* noop */
        }
      };
      request.signal.addEventListener('abort', cleanup);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
