// ============================================================
// OmniLive 萬能即時轉譯雙語字幕播放器 — 服務層
// 四流程串接: 輸入層 → 辨識層(STT) → 翻譯層(雙語) → 字幕層(SSE) → 播放器
// Zoom 場景最小可用設定流程 (見 README.md / spec.md)。
// 5T: X-OA-Trace 溯源標頭 / Traceable 標記 / Hash Lock (trace 不可篡改)。
// 純免費零 key 運作; Gemini 為可選雲端增強 (失敗自動回落)。
// @ts-check
// ============================================================
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { loadConfig, publicConfig } from './lib/config.mjs';
import { assertSource, describeSource, AUDIO_SOURCES } from './lib/audio-source.mjs';
import { transcribe, transcribeCaption } from './lib/stt.mjs';
import { translate } from './lib/translate.mjs';
import { SubtitleStore, buildSubtitle } from './lib/subtitle.mjs';
import { errorToJson, OmniLiveError } from './lib/errors.mjs';

// 零依賴 .env 讀取 (優先於已存在 process.env, 避免覆寫 shell 注入)
try {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
      const i = line.indexOf('=');
      if (i > 0) { const k = line.slice(0, i).trim(), v = line.slice(i + 1).trim(); if (k && process.env[k] === undefined) process.env[k] = v; }
    }
  }
} catch { /* 忽略, 維持預設 */ }

/** @type {ReturnType<typeof loadConfig>} */
let CFG;
try {
  CFG = loadConfig();
  assertSource(CFG.audioSource, CFG.audioDeviceId);
} catch (/** @type {any} */ e) {
  console.error('[omnilive] 設定失敗，無法啟動:', e.message);
  process.exit(1);
}

const APP_VERSION = '1.0.0';
const PORT = CFG.port;
const PUBLIC_DIR = path.join(process.cwd(), 'public');
const store = new SubtitleStore({ maxLines: CFG.subtitleMaxLines, ttlMs: CFG.subtitleTtlMs });
// STT 併發保護旗標 (DEPLOY.md #4): 同一時間只跑一個 STT 請求, 避免 ClientDisconnect 連環
let sttInflight = false;

// 定時清理過期字幕 (防長會議記憶體膨脹)
const pruneTimer = setInterval(() => store.prune(), Math.max(5000, CFG.subtitleTtlMs / 2));
if (pruneTimer.unref) pruneTimer.unref();

// SSE 客戶端集合 (播放器訂閱) + 房間註冊表
const sseClients = new Set();
const rooms = new Map();
/** @param {string} [password] 明文密碼 (選填) → 僅存 SHA-256 hash, 不存明文 */
function createRoom(password) {
  const id = Math.random().toString(36).slice(2, 8).toUpperCase();
  const pwdHash = password ? crypto.createHash('sha256').update(password).digest('hex') : '';
  rooms.set(id, { id, createdAt: Date.now(), expiresAt: Date.now() + CFG.roomTtlMs, pwdHash });
  return id;
}
/** 房間過期判定 (過期則下次清理回收) */
function isRoomExpired(r) { return r && r.expiresAt && Date.now() > r.expiresAt; }
/** 週期清理過期房間 (預設每 5min) */
function cleanupRooms() {
  let n = 0;
  for (const [id, r] of rooms) {
    // 有活躍觀眾的房間不清理 (仍在使用)
    if (isRoomExpired(r) && !roomViewers(id)) { rooms.delete(id); n++; }
  }
  if (n) console.log(`[omnilive] 清理過期房間 ${n} 間`);
}
setInterval(cleanupRooms, CFG.roomCleanupIntervalMs).unref();
/** @param {string} room @param {string} pwdParam 觀眾傳入的密碼明文或 hash (兩者皆可接受) */
function roomCheckPwd(room, pwdParam) {
  const r = rooms.get(room);
  if (!r || !r.pwdHash) return true; // 無密碼房間
  if (!pwdParam) return false;
  // 接受明文或 hash 比對 (hash 比對: 觀眾連結可攜帶 hash, 避免明文外洩)
  const h = pwdParam.length === 64 && /^[0-9a-f]+$/.test(pwdParam)
    ? pwdParam
    : crypto.createHash('sha256').update(pwdParam).digest('hex');
  return h === r.pwdHash;
}
function roomViewers(room) { let n = 0; for (const c of sseClients) if (c.room === room) n++; return n; }
/**
 * @param {import('./lib/subtitle.mjs').BilingualSubtitle} sub
 * @param {string} room
 */
function broadcast(sub, room = '') {
  const payload = { type: 'subtitle', room, data: sub };
  const data = `event: subtitle\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const c of sseClients) {
    try { if (!c.room || !room || c.room === room) c.res.write(data); } catch { sseClients.delete(c); }
  }
}

// ── 請求體讀取 (raw bytes for audio / json for text) ──
async function readBodyRaw(req, maxBytes = 10 * 1024 * 1024) {
  /** @type {Buffer[]} */ const chunks = []; let total = 0;
  for await (const c of req) { total += c.length; if (total > maxBytes) { req.destroy(); throw new Error('PAYLOAD_TOO_LARGE'); } chunks.push(/** @type {Buffer} */ (c)); }
  return Buffer.concat(chunks);
}
async function readBody(req) { return (await readBodyRaw(req)).toString('utf-8'); }

/**
 * 核心管線: STT → 雙語翻譯 → 字幕 → 廣播
 * @param {{text:string, language:string, engine:string}} stt
 * @param {string} room
 * @param {{from:string, to:string}} [langOverride]  caption 模式可由請求指定語言對
 * @returns {Promise<import('./lib/subtitle.mjs').BilingualSubtitle>}
 */
async function pipeline(stt, room = '', langOverride) {
  // 語言配對: 自動判斷模式 (CFG.from==='auto') → 交由 translate.detectLang 偵測來源語並翻向對向
  let from, to;
  if (langOverride && langOverride.from && langOverride.to) {
    from = langOverride.from; to = langOverride.to;
  } else if (CFG.from === 'auto' || CFG.to === 'auto') {
    // 自動模式: 來源交給 detectLang, 目標取對向 (若 to 已明確指定則尊重)
    from = 'auto';
    to = (CFG.to && CFG.to !== 'auto') ? CFG.to : 'auto';
  } else {
    from = stt.language && stt.language !== 'unknown' ? stt.language : CFG.from;
    to = CFG.to;
    if (from === to) to = from === 'zh-TW' ? 'en' : 'zh-TW';
  }
  const tr = await translate(stt.text, from, to, {
    translateTimeoutMs: CFG.translateTimeoutMs,
    translateRetries: CFG.translateRetries,
    myMemoryEmail: CFG.myMemoryEmail,
    geminiApiKey: CFG.geminiApiKey,
    geminiModel: CFG.geminiModel,
  });
  const sub = buildSubtitle(stt, tr);
  store.push(sub);
  broadcast(sub, room);
  return sub;
}

function writeJson(res, obj, extra = {}) {
  res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', ...extra });
  res.end(JSON.stringify(obj));
}

// ── 課程即時解說: 本地免費 LLM (Ollama qwen2.5:3b) 產生章節概要/重點/名詞解釋/類似案例 ──
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:3b';

/**
 * 把累積字幕文字送給本地 Ollama, 產出結構化課程解說 (零 key 免費)
 * @param {string} text 累積的字幕文字 (雙語)
 * @returns {Promise<object>} {summary,keypoints[],terms[],similar_cases[]}
 */
export async function generateCourse(text) {
  const prompt = `你是一個專業的課程助教。以下是即時會議/課堂的雙語字幕逐字稿（含原文與翻譯）。請整理成結構化課堂重點，嚴格只輸出 JSON，不要任何額外說明文字。

格式：
{
  "summary": "本節內容一句話概要",
  "keypoints": ["重點1", "重點2", "重點3"],
  "terms": [{"term":"重要名詞(中文)","en":"English term","wiki":"https://zh.wikipedia.org/wiki/名詞","explain":"一句話解釋"}],
  "similar_cases": ["相關/類似案例或變體整理1", "相關/類似案例或變體整理2"]
}

字幕逐字稿：
${text}

請輸出 JSON：`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 120000); // Ollama 冷啟動載入模型可能 >60s
  try {
    const r = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ model: OLLAMA_MODEL, prompt, stream: false, format: 'json', options: { temperature: 0.3 } }),
      signal: ctrl.signal,
    });
    if (!r.ok) throw new Error(`ollama ${r.status}`);
    const j = await r.json();
    const parsed = JSON.parse(j.response);
    return {
      summary: parsed.summary || '',
      keypoints: Array.isArray(parsed.keypoints) ? parsed.keypoints : [],
      terms: Array.isArray(parsed.terms) ? parsed.terms : [],
      similar_cases: Array.isArray(parsed.similar_cases) ? parsed.similar_cases : [],
    };
  } finally { clearTimeout(t); }
}

const server = http.createServer(/** @param {import('node:http').IncomingMessage} req @param {import('node:http').ServerResponse} res */ async (req, res) => {
  const url = req.url || '';
  const urlPath = url.split('?')[0];

  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

  // 健康檢查
  if (url === '/health' && req.method === 'GET') {
    return writeJson(res, { status: 'ok', version: APP_VERSION, audioSource: CFG.audioSource, sttPort: CFG.sttPort, subtitleCount: store.size() });
  }

  // 公開設定 (供播放器初始化)
  if (url === '/config' && req.method === 'GET') {
    return writeJson(res, { ...publicConfig(CFG), audioSources: AUDIO_SOURCES, audioSourceDesc: describeSource(CFG.audioSource, CFG.audioDeviceId) });
  }

  // 建立分享房間 (主持人呼叫) → 回傳 caster / viewer 分享連結
  if (url === '/api/room' && req.method === 'POST') {
    let body = {};
    try { const t = await readBody(req); if (t) body = JSON.parse(t); } catch {}
    const password = (body.password || '').toString();
    const id = createRoom(password);
    const proto = (req.headers['x-forwarded-proto'] || 'http').toString().split(',')[0].trim();
    const host = (req.headers['host'] || `localhost:${PORT}`).toString().split(',')[0].trim();
    const base = `${proto}://${host}`;
    const r = rooms.get(id);
    // 受保護房間: 觀眾連結攜帶 pwdHash (非明文), 掃描即入; 明文僅主持人 UI 顯示
    const viewerLink = r.pwdHash ? `${base}/?room=${id}&pwd=${r.pwdHash}` : `${base}/?room=${id}`;
    return writeJson(res, {
      room: id,
      casterLink: `${base}/?room=${id}&role=caster`,
      viewerLink,
      viewers: 0,
      passwordProtected: Boolean(r.pwdHash),
    });
  }

  // 房間狀態 (觀眾數 / 建立時間) — 供分享面板輪詢
  if (url.startsWith('/api/room/') && req.method === 'GET') {
    const id = url.split('/').pop() || '';
    if (!rooms.has(id)) { res.writeHead(404); return res.end(JSON.stringify({ error: 'room not found', code: 'ROOM_NOT_FOUND' })); }
    return writeJson(res, { room: id, viewers: roomViewers(id), createdAt: rooms.get(id).createdAt, expiresAt: rooms.get(id).expiresAt, expired: isRoomExpired(rooms.get(id)) });
  }

  // 字幕 SSE 串流 (播放器訂閱) — 受保護房間需 ?pwd= (明文或 hash)
  if ((url === '/stream' || url.startsWith('/stream?')) && req.method === 'GET') {
    const room = new URL(url, 'http://localhost').searchParams.get('room') || '';
    const pwd = new URL(url, 'http://localhost').searchParams.get('pwd') || '';
    if (!rooms.has(room)) rooms.set(room, { id: room, createdAt: Date.now(), expiresAt: Date.now() + CFG.roomTtlMs, pwdHash: '' }); // 開放房間: 首次訂閱即建立
    if (!roomCheckPwd(room, pwd)) { res.writeHead(401); return res.end(JSON.stringify({ error: 'room password required/mismatch', code: 'ROOM_PASSWORD_REQUIRED' })); }
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' });
    const client = { res, id: Date.now() + Math.random(), room };
    sseClients.add(client);
    res.write(`id: ${client.id}\nevent: hello\ndata: {"room":"${room}","version":"${APP_VERSION}","passwordProtected":${rooms.get(room).pwdHash ? 'true' : 'false'}}\n\n`);
    // 初始快照: 推送既有字幕, 避免播放器空白
    for (const s of store.snapshot()) res.write(`event: subtitle\ndata: ${JSON.stringify({ type: 'subtitle', room, data: s })}\n\n`);
    req.on('close', () => sseClients.delete(client));
    return;
  }

  // 靜態播放器 UI
  if (req.method === 'GET') {
    let file = null, ctype = 'text/html; charset=utf-8';
    if (urlPath === '/' || urlPath.startsWith('/index')) file = '/index.html';
    else if (urlPath.endsWith('.html') && fs.existsSync(path.join(PUBLIC_DIR, urlPath))) file = urlPath;
    else if (urlPath.endsWith('.css') && fs.existsSync(path.join(PUBLIC_DIR, urlPath))) { file = urlPath; ctype = 'text/css; charset=utf-8'; }
    else if (urlPath.endsWith('.js') && fs.existsSync(path.join(PUBLIC_DIR, urlPath))) { file = urlPath; ctype = 'application/javascript; charset=utf-8'; }
    if (file) {
      const fp = path.join(PUBLIC_DIR, file);
      if (fs.existsSync(fp)) return res.writeHead(200, { 'content-type': ctype, 'Cache-Control': 'no-cache' }).end(fs.readFileSync(fp));
    }
  }

  // 辨識層: 音訊 bytes → STT → 雙語字幕 (Zoom 場景主入口)
  if (url.split('?')[0] === '/api/transcribe' && req.method === 'POST') {
    // 併發保護 (DEPLOY.md #4): 上一個 STT 請求未完成就不送下一個,
    // 避免單 worker STT 忙不過來導致客戶端 timeout 斷開 (ClientDisconnect 連環)
    if (sttInflight) { res.writeHead(429); return res.end(JSON.stringify({ error: 'STT busy, retry later', code: 'STT_INFLIGHT' })); }
    sttInflight = true;
    const inflightTimer = setTimeout(() => { sttInflight = false; }, 45000); // 45s 超時保護防永久卡死
    let audioBuf;
    try { audioBuf = await readBodyRaw(req); } catch { sttInflight = false; clearTimeout(inflightTimer); res.writeHead(400); return res.end(JSON.stringify({ error: 'read fail', code: 'BAD_REQUEST' })); }
    if (!audioBuf.length) { sttInflight = false; clearTimeout(inflightTimer); res.writeHead(400); return res.end(JSON.stringify({ error: 'empty audio', code: 'BAD_REQUEST' })); }
    const q = new URL(url, 'http://localhost').searchParams;
    const room = q.get('room') || '';
    const vad = q.get('vad') === '1' || q.get('vad') === 'true';
    const reqLang = q.get('lang') || CFG.sttLang; // 沿用前端指定語言 (en/zh-TW), 避免強制 auto 導致 whisper 偶發 500
    try {
      const stt = await transcribe(audioBuf, { sttPort: CFG.sttPort, sttTimeoutMs: CFG.sttTimeoutMs, sttLang: reqLang, vad });
      sttInflight = false; clearTimeout(inflightTimer);
      if (!stt.text) return writeJson(res, { source: '', target: '', engine: stt.engine, trace: '', note: 'no speech detected' });
      // VAD 語者分段: 每個語音段各自成一筆雙語字幕 (帶 speaker 標籤)
      if (stt.segments && stt.segments.length) {
        const out = [];
        for (const seg of stt.segments) {
          if (!seg.text) continue; // 輪替段無文字則跳過 (靜音標記)
          const sub = await pipeline({ ...stt, text: seg.text }, room);
          sub.speaker = seg.speaker;
          out.push(sub);
        }
        return writeJson(res, out.length ? out : await pipeline(stt, room), { 'X-OA-Trace': out[0]?.trace || '' });
      }
      const sub = await pipeline(stt, room);
      return writeJson(res, sub, { 'X-OA-Trace': sub.trace });
    } catch (/** @type {any} */ e) {
      sttInflight = false; clearTimeout(inflightTimer);
      const j = errorToJson(e);
      return res.writeHead(j.code === 'STT_UNAVAILABLE' ? 502 : 500).end(JSON.stringify(j));
    }
  }

  // 手動字幕 / caption 模式: 文字 → 雙語字幕 (無音訊時兜底)
  if (url.split('?')[0] === '/api/speak' && req.method === 'POST') {
    let body; try { body = await readBody(req); } catch { res.writeHead(400); return res.end(JSON.stringify({ error: 'read fail' })); }
    let p; try { p = JSON.parse(body); } catch { res.writeHead(400); return res.end(JSON.stringify({ error: 'bad json' })); }
    const text = (p.text || '').toString();
    if (!text.trim()) { res.writeHead(400); return res.end(JSON.stringify({ error: 'missing text', code: 'BAD_REQUEST' })); }
    const room = p.room || '';
    try {
      const from = p.from || CFG.from;
      const to = p.to || CFG.to;
      const stt = transcribeCaption(text, { sttLang: CFG.sttLang, from });
      const sub = await pipeline(stt, room, { from, to });
      return writeJson(res, sub, { 'X-OA-Trace': sub.trace });
    } catch (/** @type {any} */ e) {
      const j = errorToJson(e);
      return res.writeHead(500).end(JSON.stringify(j));
    }
  }

  // 課程即時解說: 累積字幕 → 本地 Ollama 產生章節概要/重點/名詞/類似案例 (獨立介面用)
  if (url.split('?')[0] === '/api/course' && req.method === 'POST') {
    let body; try { body = await readBody(req); } catch { res.writeHead(400); return res.end(JSON.stringify({ error: 'read fail' })); }
    let p; try { p = JSON.parse(body); } catch { res.writeHead(400); return res.end(JSON.stringify({ error: 'bad json' })); }
    const room = p.room || '';
    // 優先用前端傳來的 text, 否則從 store 抓取該房間累積字幕
    let text = (p.text || '').toString().trim();
    if (!text && room) {
      const subs = store.getByRoom ? store.getByRoom(room) : store.snapshot().filter(s => s.room === room);
      text = subs.map(s => `${s.source || ''}\n${s.target || ''}`).join('\n\n');
    }
    if (!text.trim()) return writeJson(res, { summary: '', keypoints: [], terms: [], similar_cases: [], note: 'no transcript yet' });
    try {
      const course = await generateCourse(text.slice(-6000)); // 限制長度避免超過 LLM context
      return writeJson(res, course);
    } catch (/** @type {any} */ e) {
      return res.writeHead(502).end(JSON.stringify({ error: 'course gen failed', detail: e.message }));
    }
  }

  if (url.split('?')[0] === '/favicon.ico') { res.writeHead(204); return res.end(); }

  res.writeHead(404, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ usage: 'GET /health | GET /config | GET /stream (SSE) | POST /api/transcribe (audio) | POST /api/speak {text,room} | GET / (player)' }));
});

server.listen(PORT, () => {
  const d = describeSource(CFG.audioSource, CFG.audioDeviceId);
  console.log(`[omnilive] v${APP_VERSION} listening on :${PORT}`);
  console.log(`[omnilive] 音訊來源: ${d.label} (${CFG.audioSource})`);
  console.log(`[omnilive] 雙語: ${CFG.from} → ${CFG.to}${CFG.geminiApiKey ? '  (Gemini 增強開啟)' : ''}`);
  console.log(`[omnilive] 播放器: http://localhost:${PORT}/`);
});
