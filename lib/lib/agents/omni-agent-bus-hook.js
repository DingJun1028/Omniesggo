// omni-agent-bus-hook.js
// Broadcast hooks for OmniAgentBus – optional integrations (webhook, Telegram, Scaling API, Slack anomaly alert)

const { omniBus } = require('./omni-agent-bus');
const https = require('https');

/**
 * Generic POST helper.
 */
function postWebhook(url, payload) {
  const data = JSON.stringify(payload);
  const parsed = new URL(url);
  const options = {
    hostname: parsed.hostname,
    port: parsed.port || 443,
    path: parsed.pathname + (parsed.search || ''),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
      ...(process.env.OMNI_BUS_WEBHOOK_HEADERS ? JSON.parse(process.env.OMNI_BUS_WEBHOOK_HEADERS) : {}),
    },
  };
  const req = https.request(options, res => {
    // Drain response
    res.on('data', () => {});
  });
  req.on('error', err => {
    console.error('[OmniAgentBus Hook] webhook error:', err);
  });
  req.write(data);
  req.end();
}

// ---------------------------------------------------------------------------
// 1️⃣ Generic health‑check webhook (if OMNI_BUS_WEBHOOK_URL is set)
// ---------------------------------------------------------------------------
if (process.env.OMNI_BUS_WEBHOOK_URL) {
  omniBus.registerBroadcastHook(async ev => {
    await postWebhook(process.env.OMNI_BUS_WEBHOOK_URL, ev);
  });
  console.debug('[OmniAgentBus Hook] generic webhook registered');
}

// ---------------------------------------------------------------------------
// 2️⃣ Telegram alert bridge (requires TELEGRAM_BOT_TOKEN & TELEGRAM_CHAT_ID)
// ---------------------------------------------------------------------------
if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
  const tgUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
  omniBus.registerBroadcastHook(async ev => {
    const payload = {
      chat_id: process.env.TELEGRAM_CHAT_ID,
      text: `⚠️ ${ev.event}: ${JSON.stringify(ev.payload)}`,
      parse_mode: 'Markdown',
    };
    await postWebhook(tgUrl, payload);
  });
  console.debug('[OmniAgentBus Hook] Telegram bridge registered');
}

// ---------------------------------------------------------------------------
// 3️⃣ Auto‑scaling trigger (requires SCALING_API_URL & SCALING_THRESHOLD)
// ---------------------------------------------------------------------------
if (process.env.SCALING_API_URL && process.env.SCALING_THRESHOLD) {
  omniBus.registerBroadcastHook(async ev => {
    if (ev.event === 'system:autonomy:tick') {
      const recent = omniBus.getEvents({
        limit: 500,
        event: 'request:high_load',
        afterTs: Date.now() - 5 * 60 * 1000,
      });
      if (recent.length > Number(process.env.SCALING_THRESHOLD)) {
        await postWebhook(process.env.SCALING_API_URL, { action: 'scale_up' });
        console.debug('[OmniAgentBus Hook] scaling trigger fired');
      }
    }
  });
  console.debug('[OmniAgentBus Hook] auto‑scaling hook registered');
}

// ---------------------------------------------------------------------------
// 4️⃣ Anomaly detection & Slack alert (requires SLACK_WEBHOOK_URL & ANOMALY_THRESHOLD)
// ---------------------------------------------------------------------------
if (process.env.SLACK_WEBHOOK_URL && process.env.ANOMALY_THRESHOLD) {
  omniBus.registerBroadcastHook(async ev => {
    if (ev.event === 'event:error') {
      const recent = omniBus.getEvents({
        event: 'event:error',
        afterTs: Date.now() - 2 * 60 * 1000,
      });
      if (recent.length > Number(process.env.ANOMALY_THRESHOLD)) {
        const payload = {
          text: `⚠️ High error rate detected: ${recent.length} errors in last 2 min.`,
          blocks: [{ type: 'section', text: { type: 'mrkdwn', text: '*Error Spike Alert*' } }],
        };
        await postWebhook(process.env.SLACK_WEBHOOK_URL, payload);
        console.debug('[OmniAgentBus Hook] Slack anomaly alert sent');
      }
    }
  });
  console.debug('[OmniAgentBus Hook] anomaly detection hook registered');
}

// ---------------------------------------------------------------------------
// 5️⃣ Fallback: if no hook was registered, log a debug line.
// ---------------------------------------------------------------------------
if (omniBus.broadcastHooks.size === 0) {
  console.debug('[OmniAgentBus Hook] no broadcast hooks configured');
}

