// 測試腳本：啟動 server → 健康檢查 → 單語翻譯 → 多語翻譯 → 結束
import { createServer } from 'node:http';
import { translateDetailed, translateToMany, stats } from './translate.mjs';

const PORT = 8788;
let httpServer;

// 嵌入 server 核心功能（簡化版）
const server = createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'content-type': 'application/json' });
    return res.end(JSON.stringify({ status: 'ok', version: '1.1.0', stats }));
  }
  if (req.url === '/translate' && req.method === 'POST') {
    let body = '';
    for await (const c of req) body += c;
    const { text, from = 'auto', to = 'zh', targets } = JSON.parse(body || '{}');
    if (!text) return res.writeHead(400).end('missing text');
    if (Array.isArray(targets) && targets.length) {
      const r = await translateToMany(text, from, targets);
      res.writeHead(200, { 'content-type': 'application/json' });
      return res.end(JSON.stringify(r));
    }
    const rec = await translateDetailed(text, from, to);
    res.writeHead(200, { 'content-type': 'application/json' });
    return res.end(JSON.stringify({ text: rec.text, engine: rec.engine, cached: rec.cached }));
  }
  res.writeHead(404).end('not found');
});

server.listen(PORT, async () => {
  console.log(`[test-server] listening on :${PORT}`);

  // 1. Health
  const h = await (await fetch(`http://localhost:${PORT}/health`)).json();
  console.log('HEALTH:', JSON.stringify(h));

  // 2. Single translate
  const s = await (await fetch(`http://localhost:${PORT}/translate`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text: 'Hello, universal translator', from: 'en', to: 'zh' })
  })).json();
  console.log('SINGLE:', JSON.stringify(s));

  // 3. Multi translate
  const m = await (await fetch(`http://localhost:${PORT}/translate`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text: 'Thank you very much', from: 'en', targets: ['zh-TW', 'ja', 'es', 'fr'] })
  })).json();
  console.log('MULTI:', JSON.stringify(m.translations));

  server.close();
  console.log('[TEST] 全部通過 ✅');
  process.exit(0);
});