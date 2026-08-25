// ============================================================
// 萬能即時翻譯 — 服務層 (HTTP + WebSocket + SSE) · 純免費版
// 引擎: Google gtx(免費,零key) → LibreTranslate(自建) → MyMemory(免費) → 原文兜底 (零付費 key)
//       [可選] Ollama+Gemma (設 OLLAMA_MODEL 時啟用, 插於引擎鏈最前端)
// 端點:
//   GET  /health           健康檢查
//   GET  /                 Live 即時翻譯 UI
//   GET  /studio          收音端 (系統音 → 多語翻譯)
//   GET  /float           一體式半透明懸浮影音字幕 (Zoom 系統音+影像+雙語字幕)
//   GET  /stream?room=xxx 觀眾端 (SSE 雙語浮層字幕)
//   POST /translate       單語 / 多語翻譯 (回 JSON，並廣播 SSE)
//   POST /speak           即時轉播推播 (studio 已轉錄文字 → SSE 字幕)
//   WS   /ws              即時流 (輸入即翻譯並廣播)
// 5T 溯源標頭: X-OA-Engine / X-OA-Cached / X-OA-Trace
// 萬能即時翻譯 全域全端全量全面 雙向同步 TypeScript 繁中英碼 終始矩陣架構: 領域型別契約見 ../../shared/types.ts (canonical) → types/generated/esggo-shared.d.ts (generated)
// @ts-check
/// <reference path="./types/generated/esggo-shared.d.ts" />
// ============================================================
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { WebSocketServer } from 'ws';
import { translateDetailed, translateToMany, stats, hashOf } from './translate.mjs';
import { speechToSubtitle } from './stt_client.mjs';
import { s2sStatus, isS2SEnabled } from './s2s_gemini_live.mjs';
import { recordUtterance, getContext, buildContextHint, resetRoom, contextStatus, isContextEnabled } from './context_buffer.mjs';
// 深貫廣通: 共享記憶整合 (TencentDB Agent Memory)
import { storeSubtitleAsMemory, retrieveMemoryContext } from './src/memory-integration.mjs';

// 讀取 .env（零依賴實作，優先於 process.env 已存在值）
try {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
      const i = line.indexOf('=');
      if (i > 0) { const k = line.slice(0, i).trim(), v = line.slice(i + 1).trim(); if (k && process.env[k] === undefined) process.env[k] = v; }
    }
  }
} catch { /* 忽略 .env 讀取錯誤，維持預設 */ }

const PORT = Number(process.env.PORT || 8788);
const APP_NAME = '萬能即時翻譯';
const APP_VERSION = '1.7.0';           // v1.7: 跨句脈絡記憶 (context awareness) + Gemini 前文注入增強
// Gemini 3.5 Live Translate 技術整合: 可選雲端增強層 (需 GEMINI_API_KEY), 預設關閉維持純免費零 key 運作.
const GEMINI_INTEGRATED = true;

// ── 生產級安全配置 ──────────────────────────────────────────
// 請求體上限: 音訊 10MB / JSON 1MB (防 DoS 內存耗盡)
const MAX_AUDIO_BYTES = Number(process.env.MAX_AUDIO_BYTES || 10 * 1024 * 1024);
const MAX_JSON_BYTES = Number(process.env.MAX_JSON_BYTES || 1024 * 1024);
// CORS 白名單 (生產級: 不開放 *, 限定自有域名)
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://translate.esggo.co,https://esggo.co,https://*.esggo.co')
  .split(',').map(s => s.trim()).filter(Boolean);
// 安全標頭 (CSP / X-Frame-Options / HSTS 等)
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(self), geolocation=()',
  'Content-Security-Policy': "default-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self'",
};
const PUBLIC_DIR = path.join(process.cwd(), 'public');

// 5T 溯源標頭 (在 writeHead 中內聯注入, 避免 writeHead 後 setHeader 衝突)
/**
 * @param {import('node:http').ServerResponse} res
 * @param {any} obj
 * @param {Record<string, string>} [extraHeaders]
 */
function writeJson(res, obj, extraHeaders = {}) {
  res.writeHead(200, {
    'content-type': 'application/json; charset=utf-8',
    ...extraHeaders,
  });
  res.end(JSON.stringify(obj));
}

// SSE 觀眾端客戶端集合與廣播
// 每個 SSE 客戶端帶 room 訂閱（?room=xxx）；broadcast 時按 room 過濾（room 空 = 接收全部）
const sseClients = new Set();
/**
 * @param {import('./types/generated/esggo-shared.d.ts').ISseTranslationEvent} payload
 */
function broadcastTranslation(payload) {
  const data = `event: translation\ndata: ${JSON.stringify(payload)}\n\n`;
  // 深貫廣通: 同步到共享記憶 (非阻塞, 失敗不影響廣播)
  if (payload.room && payload.text) {
    storeSubtitleAsMemory({
      text: payload.text,
      translation: typeof payload.tgt === 'string' ? payload.tgt : (payload.translations ? Object.values(payload.translations).join(' / ') : ''),
      source_origin: payload.speaker || 'sse',
      lang_from: payload.from || 'auto',
      lang_to: payload.to || 'zh-TW',
    }, payload.room, payload.speaker === 'caster' ? 'caster' : 'viewer').catch(() => {});
  }
  for (const c of sseClients) {
    try {
      // room 過濾：客戶端指定 room 時，只收相同 room 的轉播
      if (c.room && payload.room && c.room !== payload.room) continue;
      c.res.write(data);
    } catch { sseClients.delete(c); }
  }
}

/**
 * 以 Buffer 累積請求體 (原始 bytes, 用於音訊上傳)
 * @param {import('node:http').IncomingMessage} req
 * @returns {Promise<Buffer>}
 */
async function readBodyRaw(req, maxBytes = MAX_AUDIO_BYTES) {
  /** @type {Buffer[]} */
  const chunks = [];
  let total = 0;
  for await (const c of req) {
    total += c.length;
    if (total > maxBytes) {
      req.destroy();
      throw new Error('PAYLOAD_TOO_LARGE');
    }
    chunks.push(/** @type {Buffer} */ (c));
  }
  return Buffer.concat(chunks);
}

/**
 * 以 Buffer 累積請求體再轉字串 (避免多 byte UTF-8 在 stream 分塊邊界被切斷導致亂碼，Cloudflare Tunnel 環境下必須)
 * @param {import('node:http').IncomingMessage} req
 * @returns {Promise<string>}
 */
async function readBody(req) {
  return (await readBodyRaw(req)).toString('utf-8');
}

// --- 共用：執行翻譯並廣播 SSE（REST /translate、/speak 與 WS /ws 共用，打通 studio→stream 即時轉播） ---
/**
 * @param {import('./types/generated/esggo-shared.d.ts').ISpeakPayload} p
 * @returns {Promise<(import('./types/generated/esggo-shared.d.ts').ISseTranslationEvent & { version?: string }) | null>}
 */
async function doTranslateAndBroadcast({ text, from, to, targets, room, speaker = 'studio' }) {
  if (!text) return null;
  const trace = hashOf(text).slice(0, 16);
  // 脈絡增強: 取回近期前文 (供 Gemini 引擎注入, 提升連貫)
  const ctxHint = buildContextHint({ room });
  if (Array.isArray(targets) && targets.length) {
    const r = await translateToMany(text, String(from), /** @type {string[]} */ (targets));
    /** @type {import('./types/generated/esggo-shared.d.ts').ISseTranslationEvent} */
    const out = { text, translations: r.translations || {}, engines: r.engines || {}, trace, room: room || '', speaker: speaker || 'studio' };
    broadcastTranslation(out);
    const tgt0a = /** @type {Record<string, string>} */ (r.translations || {})[String(targets[0])] || '';
    recordUtterance({ room, src: text, tgt: tgt0a, from: String(from), to: String(targets[0]) });
    return { ...out, engine: Object.values(r.engines || {})[0] || 'n/a', cached: false };
  }
  const rec = await translateDetailed(text, String(from), String(to), ctxHint);
  /** @type {Record<string, string>} */
  const tr = { [/** @type {string} */ (to)]: rec.text };
  // 脈絡: 記錄本句 + 把近期前文附帶於 payload (供 UI 顯示「前文」, 誠實降級: 免費鏈不影響輸出)
  const ctx = getContext({ room });
  recordUtterance({ room, src: text, tgt: rec.text, from, to });
  /** @type {import('./types/generated/esggo-shared.d.ts').ISseTranslationEvent} */
  const out = { text, translations: tr, engine: rec.engine, cached: rec.cached, trace, room: room || '', speaker: speaker || 'studio', context: ctx.length ? ctx.slice(-3) : undefined };
  broadcastTranslation(out);
  return { ...out, text: rec.text };
}

const server = http.createServer(async (req, res) => {
  /** @type {string} */
  const url = req.url || '';
  const urlPath = url.split('?')[0];
  // CORS (生產級: 白名單來源, 非 *)
  const origin = req.headers.origin;
  const allowOrigin = origin && ALLOWED_ORIGINS.some(o => o === '*' || o === origin || (o.startsWith('*.') && origin.endsWith(o.slice(1)))) ? (origin || '*') : (ALLOWED_ORIGINS[0] || '*');
  res.setHeader('Access-Control-Allow-Origin', allowOrigin);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-OA-Trace');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) res.setHeader(k, v);
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

  // 健康檢查
  if (url === '/health' && req.method === 'GET') {
    return writeJson(res, { status: 'ok', version: APP_VERSION, stats });
  }

  // Gemini 3.5 Live Translate 技術狀態 — 供 UI 顯示「可選增強」徽章
  if (url === '/gemini-live-3-5/status' && req.method === 'GET') {
    return writeJson(res, {
      name: 'Gemini 3.5 Live Translate',
      integrated: GEMINI_INTEGRATED,
      enabled: !!process.env.GEMINI_API_KEY,
      engine: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      mode: process.env.GEMINI_API_KEY
        ? 'cloud-enhanced (opt-in, graceful fallback to free chain)'
        : 'off — running free/zero-key chain',
      subtitle: '繁中 ↔ 英文 雙向及時字幕',
      ts: Date.now(),
    });
  }

  // 語音對語音同傳升級路徑狀態 (可選, 需 GEMINI_API_KEY + GEMINI_LIVE_S2S=1)
  if (url === '/s2s/status' && req.method === 'GET') {
    return writeJson(res, s2sStatus());
  }

  // 跨句脈絡記憶狀態 (context awareness)
  if (url === '/context/status' && req.method === 'GET') {
    return writeJson(res, contextStatus());
  }
  if (url === '/context/reset' && req.method === 'POST') {
    const q = new URL(url, 'http://localhost').searchParams;
    resetRoom(q.get('room') || '');
    return writeJson(res, { ok: true, status: contextStatus() });
  }

  // 指標端點 (生產級監控: Prometheus 相容結構)
  if (url === '/metrics' && req.method === 'GET') {
    const mem = process.memoryUsage();
    return writeJson(res, {
      service: 'universal-translator',
      version: APP_VERSION,
      uptime_seconds: Math.floor(process.uptime()),
      stats,
      memory: {
        rss_mb: Math.round(mem.rss / 1024 / 1024),
        heap_used_mb: Math.round(mem.heapUsed / 1024 / 1024),
        heap_total_mb: Math.round(mem.heapTotal / 1024 / 1024),
      },
      sse_clients: sseClients.size,
      stt_port: Number(process.env.STT_PORT || 8791),
    });
  }

  // SSE 觀眾端串流（精確匹配 /stream 或 /stream?room=...，避免遮蔽 /stream.html 靜態頁）
  if ((url === '/stream' || url.startsWith('/stream?')) && req.method === 'GET') {
    // 解析 query: ?src=studio&room=xxx（room 用於多房間隔離）
    const q = new URL(url, 'http://localhost').searchParams;
    const room = q.get('room') || '';
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });
    const client = { res, id: Date.now() + Math.random(), room };
    sseClients.add(client);
    res.write(`id: ${client.id}\nevent: heartbeat\ndata: {"room":"${room}"}\n\n`);
    req.on('close', () => { sseClients.delete(client); });
    return; // 到此為止，不進靜態路由
  }

  // 靜態前端 UI + 資源 (html/js/css 同目錄白名單)
  if (req.method === 'GET') {
    let file = null, ctype = 'text/html; charset=utf-8';
    if (urlPath === '/' || urlPath.startsWith('/index')) file = '/index.html';
    else if (urlPath === '/studio' || urlPath === '/studio.html') file = '/studio.html';
    else if (urlPath === '/stream' || urlPath === '/stream.html') file = '/stream.html';
    else if (urlPath === '/overlay' || urlPath === '/overlay.html') file = '/overlay.html';
    else if (urlPath === '/float' || urlPath === '/float.html') file = '/float.html';
    else if (urlPath === '/player' || urlPath === '/player.html') file = '/player.html';
    else if (/^\/(qrcode\.min\.js|esggo-shared\.d\.ts)$/.test(urlPath)) { file = urlPath; ctype = 'application/javascript; charset=utf-8'; }
    else if (urlPath.endsWith('.html') && fs.existsSync(path.join(PUBLIC_DIR, urlPath))) file = urlPath;
    if (file) {
      const fp = path.join(PUBLIC_DIR, file);
      if (fs.existsSync(fp)) {
        return res.writeHead(200, { 'content-type': ctype, 'Cache-Control': 'no-cache, no-store, must-revalidate' }).end(fs.readFileSync(fp));
      }
    }
  }

  // 外部影片 CORS 代理：解瀏覽器跨域擷音軌限制 (即時翻譯外部影片源)
  // 安全防護 (生產級): 阻 SSRF (內網/link-local/metadata) + 大小上限 + 逾時
  if (urlPath === '/proxy-media' && req.method === 'GET') {
    const MAX_PROXY_BYTES = 50 * 1024 * 1024; // 50MB 上限
    const PROXY_TIMEOUT_MS = 20000;
    try {
      const rawUrl = req.url || '';
      const raw = rawUrl.split('?')[1] ? new URLSearchParams(rawUrl.split('?')[1]).get('url') || '' : '';
      const target = new URL(raw, 'http://x');
      if (!/^https?:$/.test(target.protocol)) { res.writeHead(400); return res.end('invalid protocol'); }
      // SSRF 防護: 阻內網/link-local/metadata
      const host = target.hostname.toLowerCase();
      const isPrivate = /^(localhost|0\.0\.0\.0|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|\[::1\]|::1)/.test(host)
        || host === 'metadata.google.internal' || host.endsWith('.internal') || host.endsWith('.local');
      if (isPrivate) { res.writeHead(400); return res.end('blocked: private host'); }
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), PROXY_TIMEOUT_MS);
      const upstream = await fetch(target.toString(), { signal: controller.signal });
      clearTimeout(timer);
      if (!upstream.ok) { res.writeHead(upstream.status); return res.end('upstream error'); }
      // 串流轉發 (不整包載入記憶體) + 大小邊界
      const ct = upstream.headers.get('content-type') || 'video/mp4';
      const cl = Number(upstream.headers.get('content-length') || 0);
      if (cl > MAX_PROXY_BYTES) { res.writeHead(413); return res.end('payload too large'); }
      res.writeHead(200, {
        'content-type': ct,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store',
      });
      if (!upstream.body) { const buf = Buffer.from(await upstream.arrayBuffer()); return res.end(buf); }
      let sent = 0;
      const reader = upstream.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        sent += value.byteLength;
        if (sent > MAX_PROXY_BYTES) { res.end(); return; }
        res.write(Buffer.from(value));
      }
      res.end();
    } catch (/** @type {any} */ e) {
      res.writeHead(500); return res.end('proxy fail: ' + e.message);
    }
  }

  // 即時轉播推播：studio 直接推播已轉錄文字 → 觀眾端 SSE 即時字幕（免觀眾端二次翻譯）
  if (url === '/speak' && req.method === 'POST') {
    let body;
    try { body = await readBody(req); } catch { res.writeHead(400); return res.end('read fail'); }
    let p;
    try { p = JSON.parse(body); } catch { res.writeHead(400); return res.end('bad json'); }
    const { text, from = 'auto', to = 'zh-TW', targets, room = '', speaker = 'studio' } = p;
    if (!text) { res.writeHead(400); return res.end('missing text'); }
    const rec = await doTranslateAndBroadcast({ text, from: String(from), to: String(to), targets, room, speaker });
    if (!rec) { res.writeHead(400); return res.end('missing text'); }
    return writeJson(res, { ok: true, ...rec, version: APP_VERSION }, {
      'X-OA-Engine': String(rec.engine || 'n/a'), 'X-OA-Trace': String(rec.trace || ''),
    });
  }

  // 翻譯核心 API (單語 / 多語) — 同時廣播 SSE，打通 studio(REST)→stream(SSE) 即時轉播
  if (url === '/translate' && req.method === 'POST') {
    let body;
    try { body = await readBody(req); } catch { res.writeHead(400); return res.end('read fail'); }
    let p;
    try { p = JSON.parse(body); } catch { res.writeHead(400); return res.end('bad json'); }

    const { text, from = 'auto', to = 'zh-TW', targets, room = '' } = p;
    if (!text) { res.writeHead(400); return res.end('missing text'); }

    // 多語平行翻譯 (即時轉播場景)
    if (Array.isArray(targets) && targets.length) {
      const r = await translateToMany(text, String(from), /** @type {string[]} */ (targets));
      const firstEngine = Object.values(r.engines || {})[0] || 'n/a';
      const tgt0b = /** @type {Record<string, string>} */ (r.translations || {})[String(targets[0])] || '';
      recordUtterance({ room, src: text, tgt: tgt0b, from: String(from), to: String(targets[0]) });
      broadcastTranslation({ text, translations: r.translations || {}, engines: r.engines || {}, trace: hashOf(text).slice(0, 16), room, speaker: 'rest' });
      return writeJson(res, { ...r, version: APP_VERSION }, {
        'X-OA-Engine': String(firstEngine), 'X-OA-Cached': 'false', 'X-OA-Trace': hashOf(text).slice(0, 16),
      });
    }

    // 單語翻譯
    const ctxHint = buildContextHint({ room });
    const rec = await translateDetailed(text, String(from), String(to), ctxHint);
    /** @type {Record<string, string>} */
    const tr = { [String(to)]: rec.text };
    const ctx = getContext({ room });
    recordUtterance({ room, src: text, tgt: rec.text, from, to });
    broadcastTranslation({ text, translations: tr, engine: rec.engine, cached: rec.cached, trace: hashOf(rec.text).slice(0, 16), room, speaker: 'rest', context: ctx.length ? ctx.slice(-3) : undefined });
    return writeJson(res, { text: rec.text, engine: rec.engine, cached: rec.cached, version: APP_VERSION }, {
      'X-OA-Engine': String(rec.engine || 'n/a'), 'X-OA-Cached': String(rec.cached), 'X-OA-Trace': hashOf(rec.text).slice(0, 16),
    });
  }

  // 語音轉雙語字幕 (STT → 即時雙向翻譯) — 終始矩陣 ISpeechToSubtitleResult
  // 鎖定繁中↔英文: detected=zh-TW|en, 對向自動互譯, 5T 溯源
  if (url.split('?')[0] === '/speech-to-subtitle' && req.method === 'POST') {
    let audioBuf;
    try { audioBuf = await readBodyRaw(req); } catch { res.writeHead(400); return res.end('read fail'); }
    if (!audioBuf.length) { res.writeHead(400); return res.end(JSON.stringify({ error: 'empty audio' })); }
    const q = new URL(url, 'http://localhost').searchParams;
    const rawLang = q.get('lang');
    const langHint = rawLang === 'zh-TW' || rawLang === 'en' ? rawLang : '';
    try {
      const r = await speechToSubtitle(audioBuf, langHint);
      return writeJson(res, r, { 'X-OA-Engine': String(r.engine || 'n/a'), 'X-OA-Trace': String(r.trace || '') });
    } catch (/** @type {any} */ e) {
      res.writeHead(502);
      return res.end(JSON.stringify({ error: 'speech-to-subtitle failed: ' + (e.message || e) }));
    }
  }

  // 伺服器端語音轉文字 (STT): 前端 MediaRecorder 分段錄音 → 此端點 → 呼叫本地 faster-whisper 微服務 → 回文字
  // 免費零 key: 不依賴瀏覽器 Web Speech API, 手機/平板/任意瀏覽器皆可用
  if (url.split('?')[0] === '/transcribe' && req.method === 'POST') {
    let audioBuf;
    try { audioBuf = await readBodyRaw(req); } catch { res.writeHead(400); return res.end('read fail'); }
    if (!audioBuf.length) { res.writeHead(400); return res.end(JSON.stringify({ error: 'empty audio' })); }
    const q = new URL(url, 'http://localhost').searchParams;
    const lang = q.get('lang') || '';
    try {
      const sttRes = await fetch(`http://127.0.0.1:${process.env.STT_PORT || 8790}/transcribe?lang=${encodeURIComponent(lang)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: new Uint8Array(audioBuf),
        signal: AbortSignal.timeout(Number(process.env.STT_TIMEOUT_MS || 30000)),
      });
      const sttJson = await sttRes.json();
      if (!sttRes.ok) { res.writeHead(sttRes.status); return res.end(JSON.stringify(sttJson)); }
      return writeJson(res, { text: sttJson.text || '', language: sttJson.language || 'unknown' });
    } catch (/** @type {any} */ e) {
      res.writeHead(502);
      return res.end(JSON.stringify({ error: 'STT service unavailable: ' + (e.message || e) }));
    }
  }

  // favicon: 回 204 避免瀏覽器 console 404 雜訊 (非功能需求)
  if (url.split('?')[0] === '/favicon.ico') {
    res.writeHead(204, { 'Cache-Control': 'no-cache' });
    return res.end();
  }

  res.writeHead(404, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ usage: 'POST /translate {text,from,to|targets[]} | POST /speak {text,from,to|targets[],room} | GET /health | WS /ws | GET / (UI) | GET /stream?room=xxx (SSE) | GET /float (一體式懸浮浮窗)' }));
});

// WebSocket 即時流 (若 ws 套件可用)
if (typeof WebSocketServer !== 'undefined') {
  const wss = new WebSocketServer({ server, path: '/ws' });
  wss.on('connection', (/** @type {any} */ ws) => {
    ws.on('message', async (/** @type {any} */ msg) => {
      let p; try { p = JSON.parse(msg.toString()); } catch { return; }
      const { text, from = 'auto', to = 'zh-TW', targets, room = '' } = p;
      if (!text) return;
      const rec = await doTranslateAndBroadcast({ text, from, to, targets, room });
      if (rec) ws.send(JSON.stringify({ ...rec, version: APP_VERSION }));
    });
  });
}

server.listen(PORT, () => {
  console.log(`[universal-translator] listening on :${PORT} (HTTP + WS /ws + SSE /stream + UI + /float)`);
});
