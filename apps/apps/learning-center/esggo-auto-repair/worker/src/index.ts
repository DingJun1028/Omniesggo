import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import type { RepairJob } from './repair';

export interface Env extends CloudflareBindings {
  WEBHOOK_SECRET?: string;
  REPAIR_PAT?: string;
  AUTO_MERGE?: boolean;
}

interface WebhookPayload {
  action?: string;
  issue?: { number: number; pull_request?: boolean };
  pull_request?: { number: number };
  repository?: { full_name: string };
}

const TRUSTED_REPOS = [
  'DingJun1028/hermes-workspace-docs',
  'DingJun1028/esggo_vps',
  'DingJun1028/ftg-tours-website',
  'DingJun1028/esggo-learning-center',
  'DingJun1028/esggo',
];

const RELEVANT_ACTIONS = new Set([
  'opened', 'synchronize', 'reopened', 'labeled', 'created',
]);

function isTrustedRepo(repo: string): boolean {
  return TRUSTED_REPOS.some((t) => repo.startsWith(t));
}

async function verifyWebhookSignature(payload: string, signatureHeader: string | null | undefined, secret: string): Promise<boolean> {
  if (!signatureHeader) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const expectedSig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const expectedHex = Array.from(new Uint8Array(expectedSig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const prefix = 'sha256=';
  const received = signatureHeader.startsWith(prefix) ? signatureHeader.slice(prefix.length) : signatureHeader;
  if (received.length !== expectedHex.length) return false;
  const receivedBytes = new Uint8Array(received.match(/.{2}/g)!.map((b) => parseInt(b, 16)));
  const expectedBytes = new Uint8Array(expectedSig);
  if (receivedBytes.length !== expectedBytes.length) return false;
  return receivedBytes.every((b, i) => b === expectedBytes[i]);
}

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors());

app.get('/', (c) => c.text('esggo-auto-repair:ok'));

app.get('/health', (c) => c.json({
  status: 'ok',
  queue: !!c.env.REPAIR_QUEUE,
  webhookConfigured: !!c.env.WEBHOOK_SECRET,
  patConfigured: !!c.env.REPAIR_PAT,
}));

app.post('/github/webhook', async (c) => {
  const secret = c.env.WEBHOOK_SECRET;
  if (secret) {
    const rawBody = await c.req.text();
    const signature = c.req.header('x-hub-signature-256');
    const valid = await verifyWebhookSignature(rawBody, signature, secret);
    if (!valid) {
      throw new HTTPException(401, { message: 'Invalid webhook signature' });
    }
    c.req.raw = new Request(c.req.raw, { body: rawBody });
  }

  const body: WebhookPayload = await c.req.json();
  const repo = body.repository?.full_name || '';
  const prNumber = body.pull_request?.number || (body.issue?.pull_request ? body.issue?.number : undefined);
  const action = body.action || '';

  if (!repo) {
    return c.json({ ok: false, error: 'Missing repository field' }, 400);
  }

  if (!isTrustedRepo(repo)) {
    return c.json({ ok: true, ignored: true, reason: 'untrusted_repo', repo });
  }

  if (action && !RELEVANT_ACTIONS.has(action)) {
    return c.json({ ok: true, ignored: true, reason: 'irrelevant_action', action });
  }

  const queue = c.env.REPAIR_QUEUE;
  if (!queue) {
    console.error('REPAIR_QUEUE binding is not configured');
    return c.json({ ok: false, error: 'Queue not configured' }, 500);
  }

  const job: RepairJob = {
    repo,
    prNumber,
    action,
    delivered_at: new Date().toISOString(),
  };

  await queue.send(job);

  return c.json({ ok: true, queued: true, job });
});

export default {
  fetch: app.fetch,
  async queue(batch: MessageBatch<RepairJob>, env: Env, ctx: ExecutionContext): Promise<void> {
    const { repairLogic } = await import('./repair');
    const token = env.REPAIR_PAT;

    for (const msg of batch.messages) {
      const job = msg.body;
      console.log(JSON.stringify({
        event: 'queue.start',
        repo: job.repo,
        prNumber: job.prNumber,
        action: job.action,
      }));

      if (!token) {
        console.error(JSON.stringify({
          event: 'queue.error',
          repo: job.repo,
          error: 'REPAIR_PAT not configured',
        }));
        msg.retry({ delaySeconds: 60 });
        continue;
      }

      try {
        const result = await repairLogic(job, token);
        console.log(JSON.stringify({
          event: 'queue.complete',
          repo: job.repo,
          prNumber: job.prNumber,
          patched: result.patched,
          skipped: result.skipped,
          errors: result.errors,
        }));

        if (result.errors.length > 0) {
          msg.retry({ delaySeconds: 120 });
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error(JSON.stringify({
          event: 'queue.error',
          repo: job.repo,
          prNumber: job.prNumber,
          error: errorMsg,
        }));
        msg.retry({ delaySeconds: 30 });
      }
    }
  },
};
