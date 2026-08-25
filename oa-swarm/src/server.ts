/**
 * OA-Team 蜂群守護 HTTP/SSE 伺服器 (背景模式)
 * 桌面背景運行 + VPS 佈署就緒 (無外部依賴, Node 內建 http)
 */
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { SwarmCore } from './swarm-core.js';
import { SOUL_MATRIX_60, ARRAY_NAMES, LOCAL_AGENTS, VPS_AGENTS } from './soul-matrix-60.js';
import { VoiceBridge } from './s2s-bridge.js';

export function createServerApp(core: SwarmCore, port = 8788) {
  const sseClients = new Set<(d: string) => void>();
  const voice = new VoiceBridge(core);

  // 熵減循環 (每 60s) 推送 SSE
  setInterval(() => {
    core.tickEntropyReduction();
    const s = core.getState();
    const msg = JSON.stringify({ state: s });
    sseClients.forEach((fn) => fn(msg));
  }, 60000);

  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', `http://localhost:${port}`);

    // SSE 串流
    if (url.pathname === '/stream') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });
      const send = (d: string) => res.write(`data: ${d}\n\n`);
      sseClients.add(send);
      send(JSON.stringify({ state: core.getState() }));
      req.on('close', () => sseClients.delete(send));
      return;
    }

    // 60 矩陣 (雙蜂戰隊)
    if (url.pathname === '/matrix') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        agents: SOUL_MATRIX_60,
        arrays: ARRAY_NAMES,
        localCount: LOCAL_AGENTS.length,
        vpsCount: VPS_AGENTS.length,
        total: SOUL_MATRIX_60.length,
      }));
      return;
    }

    // OAB 狀態
    if (url.pathname === '/oab') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(core.getState().oab));
      return;
    }

    // OAB 歷史記憶檢索 (雙蜂隊共享)
    if (url.pathname === '/oab/history') {
      const data = await core.oabQuery(10);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ count: data.length, records: data }));
      return;
    }

    // 語音代理健康
    if (url.pathname === '/voice/health') {
      const p = await voice.probe();
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(p));
      return;
    }

    // 語音轉錄 → 蜂群執行
    if (url.pathname === '/voice' && req.method === 'POST') {
      let body = '';
      req.on('data', (c) => (body += c));
      req.on('end', async () => {
        try {
          const { text } = JSON.parse(body || '{}');
          const r = await voice.handleTranscript(text || '');
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify(r));
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: false, error: String(e) }));
        }
      });
      return;
    }

    // 執行任務
    if (url.pathname === '/execute' && req.method === 'POST') {
      let body = '';
      req.on('data', (c) => (body += c));
      req.on('end', async () => {
        try {
          const { task } = JSON.parse(body || '{}');
          const artifact = await core.executeSwarmTask(task || '空任務', 'http-api');
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: true, artifact }));
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: false, error: String(e) }));
        }
      });
      return;
    }

    // 儀表板
    if (url.pathname === '/' || url.pathname === '/dashboard') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(dashboardHtml());
      return;
    }

    // 健康
    if (url.pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, state: core.getState() }));
      return;
    }

    res.writeHead(404);
    res.end('Not found');
  });

  return { server, port };
}

function dashboardHtml(): string {
  const candidates = [
    new URL('./dashboard.html', import.meta.url),
    new URL('../src/dashboard.html', import.meta.url),
  ];
  for (const c of candidates) {
    try {
      return readFileSync(c, 'utf-8');
    } catch {
      /* try next */
    }
  }
  return '<x>dashboard 載入失敗</x>';
}
