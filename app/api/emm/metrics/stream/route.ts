// ============================================================
// EMM Metrics SSE Stream — Proxy external gateway stream
// app/api/emm/metrics/stream/route.ts
// ============================================================

const GATEWAY_URL = process.env.EMM_GATEWAY_URL || 'http://omniagent-gateway:8642';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  let externalStream: ReadableStreamDefaultReader<Uint8Array> | null = null;
  let cleanup: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;

      // Try connecting to external gateway SSE
      (async () => {
        try {
          const res = await fetch(`${GATEWAY_URL}/metrics/stream`, { signal: AbortSignal.timeout(5000) });
          if (res.ok && res.body) {
            externalStream = res.body.getReader();
            pump();
          } else {
            sendMock();
          }
        } catch {
          sendMock();
        }
      })();

      let mockInterval: ReturnType<typeof setInterval> | null = null;

      function sendMock() {
        if (closed) return;
        const mock = {
          ts: Date.now(),
          cpu_load: (Math.random() * 60 + 10).toFixed(1),
          mem_percent: Math.round(Math.random() * 40 + 30),
          proc_rss_mb: Math.round(Math.random() * 200 + 150),
          ws_clients: Math.round(Math.random() * 3),
          uptime: Math.floor(process.uptime()),
        };
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(mock)}\n\n`));
      }

      async function pump() {
        if (!externalStream || closed) return;
        try {
          while (true) {
            const { done, value } = await externalStream.read();
            if (done) break;
            controller.enqueue(value);
          }
        } catch {
          // fall through
        }
        // If external stream ends, send mock at interval
        if (!closed) {
          mockInterval = setInterval(sendMock, 2000);
        }
      }

      cleanup = () => {
        closed = true;
        if (mockInterval) clearInterval(mockInterval);
        externalStream?.cancel();
      };
    },
    cancel() {
      cleanup?.();
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
