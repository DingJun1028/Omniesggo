// apps/gateway/sync/server.ts
// ============================================================================
// OmniAgent 雙向同步引擎 — 常駐服務
//   - 監聽 loopback :8650（所有外部流量經 nginx / relay 轉發，不直綁 0.0.0.0）
//   - requireAuth：X-Omni-Token 驗證（與 v3 閘道一致）
//   - 暴露 /health /status /sync/esggo(POST 寫入) /sync/omni(POST 寫入)
//     /summon(POST 觸發 OA-Summon) /ws(雙向廣播頻道)
// ============================================================================
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';
import { SyncEngine } from './sync-engine.js';
import { GatewayClient } from './gateway-client.js';
import { RelayClient } from './relay-client.js';
import type { ESGGOState, OmniState, SyncPacket } from './types.js';
import { safeParsePacket } from './schema.js';

const PORT = Number(process.env.SYNC_PORT || 8650);
const BIND = process.env.SYNC_BIND_ADDR || '127.0.0.1';
const TOKEN = process.env.OMNI_KEY || process.env.GATEWAY_API_KEY || '';
const ORIGIN_ID = process.env.SYNC_ORIGIN_ID || `sync_${process.env.VPS_IP || 'vps'}_${Date.now()}`;

if (!TOKEN) {
  console.error('[SyncEngine] FATAL: OMNI_KEY / GATEWAY_API_KEY not set — refusing to start without auth.');
  process.exit(1);
}

const engine = new SyncEngine({
  originId: ORIGIN_ID,
  onBroadcast: (pkt: SyncPacket) => {
    // 廣播到 gateway WS（萬能系統側）與 relay（外部中繼）
    gateway.broadcast(JSON.stringify(pkt));
    // relay 僅承載 cmd/result 類；state 類經 gateway WS 即可
  },
});

const gateway = new GatewayClient({ token: TOKEN });
const relay = new RelayClient({ token: process.env.ESGGO_RELAY_TOKEN || TOKEN });

const app = express();
app.use(express.json());

function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction): void {
  const t = (req.headers['x-omni-token'] || req.headers['x-api-key'] || '').toString().replace('Bearer ', '');
  if (!TOKEN || !t || t !== TOKEN) {
    res.status(401).json({ error: 'Unauthorized: Invalid API Key', hint: 'Set X-Omni-Token header' });
    return;
  }
  next();
}

// 公開健康（不含拓撲）
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'online', engine: 'omni-sync', originId: ORIGIN_ID, uptime: process.uptime() });
});

// 需驗證：回傳同步健康 + 雙側視圖
app.get('/status', requireAuth, (_req: Request, res: Response) => {
  res.json({
    status: 'online',
    originId: ORIGIN_ID,
    health: engine.getHealth(),
    esggo: engine.getEsggo(),
    omni: engine.getOmni(),
  });
});

// ESGGO(Next.ts) 推送自身狀態視圖 -> 引擎雙向同步
app.post('/sync/esggo', requireAuth, (req, res) => {
  const parsed = safeParsePacket({ ...req.body, from: 'esggo', to: 'omni', v: 1, seq: 0, ts: Date.now(), originId: ORIGIN_ID });
  if (!parsed) return res.status(400).json({ error: 'invalid esggo state envelope' });
  engine.ingestEsggo(parsed.payload as ESGGOState);
  res.json({ status: 'synced', seq: parsed.seq });
});

// 萬能系統(gateway) 推送狀態視圖 -> 引擎雙向同步
app.post('/sync/omni', requireAuth, (req, res) => {
  const parsed = safeParsePacket({ ...req.body, from: 'omni', to: 'esggo', v: 1, seq: 0, ts: Date.now(), originId: ORIGIN_ID });
  if (!parsed) return res.status(400).json({ error: 'invalid omni state envelope' });
  engine.ingestOmni(parsed.payload as OmniState);
  res.json({ status: 'synced', seq: parsed.seq });
});

// 觸發 OA-Summon（L3 萬能同步層）
app.post('/summon', requireAuth, (_req, res) => {
  const rite = engine.summonRitual();
  res.json({ summoned: true, ritual: rite });
});

const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    const pkt = engine.receive(data.toString());
    if (!pkt) ws.send(JSON.stringify({ error: 'invalid packet' }));
    else ws.send(JSON.stringify({ ack: pkt.seq }));
  });
});

// 啟動：連 gateway WS 廣播頻道 + 週期輪詢兩側
gateway.connectWs((raw) => engine.receive(raw));
const poll = setInterval(async () => {
  const omni = await gateway.status(true);
  if (omni && (omni as unknown as OmniState).agents) {
    engine.ingestOmni(omni as unknown as OmniState);
  }
}, 5000);

const srv = httpServer.listen(PORT, BIND, () => {
  console.log(`[SyncEngine] OmniAgent 雙向同步引擎 on ${BIND}:${PORT} (auth=required)`);
});

function shutdown(): void {
  clearInterval(poll);
  gateway.close();
  srv.close(() => process.exit(0));
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
