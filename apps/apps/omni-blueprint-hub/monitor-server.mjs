// ============================================================
// 萬能藍圖中心 — 監視 + 轉播伺服器 (Monitor & Broadcast Server)
// 原生 Node (無外部依賴)：定時輪詢固定連結 → 擷取內容 → SSE 即時轉播
// 符合 5T：sourceOrigin (可溯源) / hash (Trustworthy) / timestamp (Trackable)
//
// 啟動：  node monitor-server.mjs
// 轉播頁：http://localhost:8787/stream?src=akkadu-kxxf
// ============================================================
// ⚠ 必須是第一個 import：ESM import 為 hoisted，.env 需在其他模組讀 env 前載入
import { ENV_INFO } from './env-boot.mjs';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname } from 'node:path';
import crypto from 'node:crypto';
import { startAkkaduMonitor } from './captions-scraper.mjs';
import { translateToMany, hashOf, stats as tstats } from './translate.mjs';

// 輪詢來源註冊表 (固定連結監視目標)
const SOURCES = {
  'akkadu-kxxf': 'https://akkadu.ai/live/kxxf'
};

// 推送式來源 (講者 POST /speak 推送, 不輪詢 URL)
const PUSH_SOURCES = new Set(['studio']);

// 自託管即時翻譯：多語目標 / 預設來源語
const LANG_TARGETS = (process.env.LANG_TARGETS || 'zh-CN,en,ja,es,ko,fr').split(',');
const LANG_DEFAULT = process.env.LANG_DEFAULT || 'en';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 8787);
const INGEST_TOKEN = process.env.INGEST_TOKEN || '';      // 設定後 /ingest,/speak 需帶 token
const REPLAY_MAX = Number(process.env.REPLAY_MAX || 20);  // 新訂閱者可回補的近期事件數
const RATE_MAX = Number(process.env.RATE_MAX || 60);      // 每 IP 每分鐘寫入次數上限
const BOOT_AT = new Date().toISOString();

const POLL_INTERVAL = 15000; // 15s 輪詢

// 靜態資產白名單 (未列者一律 404，避免 .mjs/.json/.conf 外洩)
const PUBLIC_FILES = new Set([
  '/index.html', '/stream.html', '/studio.html', '/live-sync.html',
  '/styles.css', '/app.js', '/data.js', '/sync.js'
]);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.ts': 'text/plain; charset=utf-8'
};

// ---- SSE 訂閱者管理 ----
/** @type {Map<string, Set<http.ServerResponse>>} */
const channels = new Map();

// ---- 事件回放環形緩衝 (新訂閱者可補看近期字幕/翻譯) ----
/** @type {Map<string, Array<{type:string,data:any}>>} */
const replay = new Map();
function pushReplay(src, event) {
  if (!replay.has(src)) replay.set(src, []);
  const buf = replay.get(src);
  buf.push(event);
  if (buf.length > REPLAY_MAX) buf.shift();
}

// ---- 簡易速率限制 (滑動視窗 1 分鐘) ----
const rate = new Map();
function rateOk(ip) {
  const now = Date.now();
  const arr = (rate.get(ip) || []).filter(t => now - t < 60000);
  if (arr.length >= RATE_MAX) { rate.set(ip, arr); return false; }
  arr.push(now); rate.set(ip, arr);
  return true;
}

function authOk(url, req) {
  if (!INGEST_TOKEN) return true;
  const t = url.searchParams.get('token') || (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  return t === INGEST_TOKEN;
}

function subscribe(src) {
  if (!channels.has(src)) channels.set(src, new Set());
  return channels.get(src);
}

function broadcast(src, event) {
  if (event.type !== 'heartbeat') pushReplay(src, event);
  const subs = channels.get(src);
  if (!subs) return;
  const payload = `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;
  for (const res of subs) {
    try { res.write(payload); } catch { /* 斷線由 abort 處理 */ }
  }
}

// ---- 擷取並摘要網頁內容 ----
async function fetchSource(url) {
  const ts = new Date().toISOString();
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 12000);
    const r = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'OmniBlueprintHub-Monitor/0.5' },
      redirect: 'follow'
    });
    clearTimeout(t);
    const html = await r.text();
    // 簡易可見文字擷取 (去 script/style/tag)
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 600);
    const hash = crypto.createHash('sha256').update(html).digest('hex');
    return {
      ok: true,
      status: r.status,
      contentType: r.headers.get('content-type'),
      length: html.length,
      text,
      hash,
      sourceOrigin: url,
      timestamp: ts
    };
  } catch (e) {
    return { ok: false, error: String(e?.message || e), sourceOrigin: url, timestamp: ts };
  }
}

// ---- 輪詢迴圈 ----
const lastHash = new Map();
const lastSnap = new Map(); // 存最新完整快照，供新訂閱者立即推送
async function poll(src, url) {
  const snap = await fetchSource(url);
  const prev = lastHash.get(src);
  if (snap.ok) {
    lastSnap.set(src, snap); // 永遠緩存最新快照
    if (snap.hash !== prev) {
      lastHash.set(src, snap.hash);
      broadcast(src, { type: 'snapshot', data: snap });
    }
  } else if (!snap.ok) {
    lastSnap.set(src, snap);
    broadcast(src, { type: 'error', data: snap });
  }
  // 無變更也廣播 heartbeat 供前端確認連線存活
  broadcast(src, { type: 'heartbeat', data: { src, at: snap.timestamp, changed: snap.ok && snap.hash !== prev } });
}

for (const [src, url] of Object.entries(SOURCES)) {
  subscribe(src);
  poll(src, url); // 立即首輪
  setInterval(() => poll(src, url), POLL_INTERVAL);
}

// ---- Akkadu 房間狀態 + 字幕協調 (B: 開播即自動抓字幕) ----
startAkkaduMonitor(
  (cap) => { // onCaption
    if (cap.ok && cap.captions && cap.captions.length > 0) {
      broadcast('akkadu-kxxf', { type: 'caption', data: cap });
    } else if (!cap.ok) {
      broadcast('akkadu-kxxf', { type: 'caption-error', data: cap });
    }
  },
  (room) => { // onRoom
    broadcast('akkadu-kxxf', { type: 'room-status', data: room });
  }
);

// ---- HTTP 伺服器 ----
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;

  // SSE 轉播端點
  if (path === '/stream') {
    const src = url.searchParams.get('src') || 'akkadu-kxxf';
    const isPolled = !!SOURCES[src];
    const isPushed = PUSH_SOURCES.has(src);
    if (!isPolled && !isPushed) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('未知來源 src。可用: ' + [...Object.keys(SOURCES), ...PUSH_SOURCES].join(', '));
      return;
    }
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });
    res.write('retry: 3000\n\n');
    const subs = subscribe(src);
    subs.add(res);
    // SSE keep-alive comment ping (穿透 nginx/CF 閒置逾時)
    const ka = setInterval(() => { try { res.write(': ka\n\n'); } catch { /* ignore */ } }, 25000);

    // 輪詢源：立即單發最新快照；推送源(studio)無快照，僅確認連線
    const cached = lastSnap.get(src);
    if (cached) {
      const payload = `event: snapshot\ndata: ${JSON.stringify(cached)}\n\n`;
      try { res.write(payload); } catch { /* ignore */ }
    } else if (isPolled) {
      poll(src, SOURCES[src]);
    }

    // 回放近期事件 (字幕/翻譯)，晚進的觀眾不會看到空白
    for (const ev of (replay.get(src) || [])) {
      try { res.write(`event: ${ev.type}\ndata: ${JSON.stringify(ev.data)}\n\n`); } catch { /* ignore */ }
    }

    req.on('close', () => { clearInterval(ka); subs.delete(res); });
    return;
  }

  // 健康檢查 / 可觀測性 (5T: Transparent)
  if (path === '/healthz') {
    const subsCount = Object.fromEntries([...channels].map(([k, v]) => [k, v.size]));
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({
      ok: true, bootAt: BOOT_AT, uptimeSec: Math.round(process.uptime()),
      sources: Object.keys(SOURCES), pushSources: [...PUSH_SOURCES],
      subscribers: subsCount, langTargets: LANG_TARGETS,
      translate: tstats, authRequired: !!INGEST_TOKEN,
      version: '0.6.0',
      memoryMB: Math.round(process.memoryUsage().rss / 1048576),
      envFileLoaded: ENV_INFO.loaded,
      translateEngine: process.env.LIBRETRANSLATE_URL ? 'libretranslate' : 'mymemory'
    }, null, 2));
    return;
  }

  // 字幕擷取端點（本機 chromium 抓到字幕後推送到此，VPS 經 SSE 轉播）
  // 解決 VPS 無瀏覽器導致 caption-error 的缺口
  if (path === '/ingest' && req.method === 'POST') {
    const ip = req.socket.remoteAddress || '?';
    if (!authOk(url, req)) { res.writeHead(401, { 'Content-Type': 'application/json' }); res.end('{"ok":false,"error":"unauthorized"}'); return; }
    if (!rateOk(ip)) { res.writeHead(429, { 'Content-Type': 'application/json' }); res.end('{"ok":false,"error":"rate limited"}'); return; }
    let body = '';
    req.on('data', c => { body += c; if (body.length > 1e6) req.destroy(); });
    req.on('end', () => {
      const src = url.searchParams.get('src') || 'akkadu-kxxf';
      if (!SOURCES[src]) { res.writeHead(404); res.end('unknown src'); return; }
      try {
        const cap = JSON.parse(body);
        broadcast(src, { type: 'caption', data: { ...cap, ingestedAt: new Date().toISOString(), origin: 'local-chromium' } });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: String(e) }));
      }
    });
    return;
  }

  // 講者端即時轉錄入口 (自託管即時翻譯核心)
  // 來源: studio.html 用 Web Speech API 取得語音轉錄後 POST 到此
  // 中樞翻譯到多語經 SSE broadcast
  if (path === '/speak' && req.method === 'POST') {
    const ip = req.socket.remoteAddress || '?';
    if (!authOk(url, req)) { res.writeHead(401, { 'Content-Type': 'application/json' }); res.end('{"ok":false,"error":"unauthorized"}'); return; }
    if (!rateOk(ip)) { res.writeHead(429, { 'Content-Type': 'application/json' }); res.end('{"ok":false,"error":"rate limited"}'); return; }
    let body = '';
    req.on('data', c => { body += c; if (body.length > 1e5) req.destroy(); });
    req.on('end', async () => {
      try {
        const cap = JSON.parse(body);
        const text = (cap.text || '').trim();
        const src = cap.src || 'studio';
        const from = cap.from || LANG_DEFAULT;
        if (!text) { res.writeHead(400); res.end(JSON.stringify({ ok: false, error: 'empty' })); return; }
        // 翻譯到多語 (可插拔引擎, 零依賴預設 MyMemory)
        const { translations: trans, engines } = await translateToMany(text, from, LANG_TARGETS);
        const payload = {
          ok: true, src, sourceOrigin: 'studio:' + (cap.speaker || 'speaker'),
          from, text, translations: trans, engines,
          hash: hashOf(text + '|' + from),
          timestamp: new Date().toISOString()
        };
        broadcast('studio', { type: 'translation', data: payload });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, translations: trans, engines }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: String(e) }));
      }
    });
    return;
  }

  // 靜態檔：白名單制 (只公開前端資產，不外洩原始碼/設定)
  const file = path === '/' ? '/index.html' : decodeURIComponent(path);
  if (!PUBLIC_FILES.has(file)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
    return;
  }
  const filePath = join(__dirname, file);
  if (!filePath.startsWith(__dirname)) {           // 雙保險：路徑穿越防護
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Forbidden');
    return;
  }
  try {
    const buf = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
    res.end(buf);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`◆ 萬能藍圖中心 監視+轉播伺服器已啟動`);
  console.log(`  版本 v0.6.0 | .env ${ENV_INFO.loaded ? `已載入 ${ENV_INFO.count} 項` : '未使用'} | 認證 ${INGEST_TOKEN ? '啟用' : '關閉'}`);
  console.log(`  健康檢查:   http://localhost:${PORT}/healthz`);
  console.log(`  轉播新網址: http://localhost:${PORT}/stream?src=akkadu-kxxf`);
  console.log(`  監視目標:   ${SOURCES['akkadu-kxxf']} (每 ${POLL_INTERVAL / 1000}s 輪詢)`);
});

// 優雅關閉 (SSE 連線先收線再退出)
function shutdown(sig) {
  console.log(`\n◆ 收到 ${sig}，優雅關閉中…`);
  for (const subs of channels.values()) {
    for (const res of subs) { try { res.end(); } catch { /* ignore */ } }
  }
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 5000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (e) => console.error('[unhandledRejection]', e));
