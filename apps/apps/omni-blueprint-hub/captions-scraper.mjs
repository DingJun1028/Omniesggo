// ============================================================
// 萬能藍圖中心 — Akkadu 即時字幕擷取層 (Browser Automation)
// 零 npm 依賴：直接用 chrome-headless-shell --dump-dom 渲染後抓取 aria-live caption
// 符合 5T：sourceOrigin / hash / timestamp
//
// 設計：定時 (DUMP_INTERVAL) 對固定連結執行 headless dump-dom，
// 解析出 caption 容器文字，與上一輪比對，變更則透過回調廣播。
// ============================================================
import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { writeFile, appendFile } from 'node:fs/promises';

// CHROME 路徑可配置：本機用 playwright chromium，VPS 若裝了也可指定
const CHROME = process.env.CHROME_BIN || 'C:/Users/dingj/AppData/Local/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-win64/chrome-headless-shell.exe';
const TARGET_URL = 'https://akkadu.ai/live/kxxf';
const DUMP_INTERVAL = 8000; // 8s 抓取一次字幕

// 提取 caption 文字：多策略健壯解析（Akkadu minified 無固定 class）
function extractCaptions(dom) {
  const caps = [];
  const seen = new Set();
  const push = (txt) => {
    const t = txt.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (t && !seen.has(t)) { seen.add(t); caps.push(t); }
  };
  // 1. aria-live 容器
  const liveRe = /<[^>]*aria-live[^>]*>([\s\S]*?)<\/[^>]+>/gi;
  let m; while ((m = liveRe.exec(dom)) !== null) push(m[1]);
  // 2. caption / subtitle / transcript class
  const capRe = /<[^>]*class="[^"]*(caption|subtitle|transcript|cc-text|live-subtitles)[^"]*"[^>]*>([\s\S]*?)<\/[^>]+>/gi;
  while ((m = capRe.exec(dom)) !== null) push(m[2]);
  // 3. data-* caption 屬性
  const dataRe = /<[^>]*data-[a-z-]*(caption|subtitle|transcript)[a-z-]*="([^"]*)"/gi;
  while ((m = dataRe.exec(dom)) !== null) push(m[2]);
  // 4. JSON-LD / inline script 中的 caption 欄位（備援）
  const jsonRe = /"(caption|subtitle|transcript|text)"\s*:\s*"([^"]{2,500})"/gi;
  while ((m = jsonRe.exec(dom)) !== null) push(m[2]);
  return caps;
}

function dumpDom() {
  return new Promise((resolve) => {
    const p = spawn(CHROME, [
      '--headless=new', '--no-sandbox', '--disable-gpu',
      '--disable-dev-shm-usage', '--virtual-time-budget=5000',
      '--dump-dom', TARGET_URL
    ], { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    let err = '';
    p.stdout.on('data', d => { out += d; });
    p.stderr.on('data', d => { err += d; });
    const to = setTimeout(() => {
      p.kill('SIGKILL');
      resolve(out.length > 0 ? { ok: true, dom: out } : { ok: false, error: 'timeout-no-output' });
    }, 25000);
    p.on('close', (code) => {
      clearTimeout(to);
      if (out.length > 0) resolve({ ok: true, dom: out });
      else resolve({ ok: false, error: err.slice(0, 200) || `exit ${code}` });
    });
    p.on('error', e => { clearTimeout(to); resolve({ ok: false, error: String(e) }); });
  });
}

// 輪詢主迴圈，變更時呼叫 onUpdate
let lastCaptionHash = '';
export async function startCaptionMonitor(onUpdate) {
  const tick = async () => {
    const r = await dumpDom();
    const ts = new Date().toISOString();
    if (!r.ok) {
      onUpdate({ ok: false, error: r.error, sourceOrigin: TARGET_URL, timestamp: ts });
      return;
    }
    const caps = extractCaptions(r.dom);
    const joined = caps.join(' || ');
    const hash = crypto.createHash('sha256').update(joined).digest('hex');
    if (hash !== lastCaptionHash && joined.length > 0) {
      lastCaptionHash = hash;
      onUpdate({
        ok: true,
        sourceOrigin: TARGET_URL,
        captions: caps,
        text: joined,
        hash,
        timestamp: ts
      });
    } else {
      onUpdate({ ok: true, sourceOrigin: TARGET_URL, captions: caps, text: joined, hash, timestamp: ts, unchanged: joined.length === 0 });
    }
  };
  await tick(); // 首輪
  setInterval(tick, DUMP_INTERVAL);
}

// ---- Akkadu 房間狀態監控 (B 核心: 挖到的真實後端) ----
// rooms/kxxf -> 房間狀態(broadcast 開播偵測)
// tokens/agora-rtm-audience -> Agora audience token (接收字幕, 不需登入)
const ROOM_API = 'https://api-translator.akkadu.com/rooms/kxxf';
const TOKEN_API = 'https://api-translator.akkadu.com/tokens/agora-rtm-audience';
const ROOM_POLL = 15000;

async function fetchJson(url) {
  try {
    const r = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!r.ok) return { ok: false, status: r.status };
    return { ok: true, data: await r.json() };
  } catch (e) { return { ok: false, error: String(e) }; }
}

// 房間開播狀態（供 captions 層啟停）
let roomBroadcasting = false;
let roomAgora = null;

let lastRoomState = '';
export async function startRoomMonitor(onUpdate) {
  const tick = async () => {
    const ts = new Date().toISOString();
    const room = await fetchJson(ROOM_API);
    if (!room.ok) {
      onUpdate({ ok: false, type: 'room-status', error: room.error || room.status, sourceOrigin: ROOM_API, timestamp: ts });
      return;
    }
    const d = room.data?.data || {};
    const state = `${d.status}|${d.broadcast}|${d.lock}`;
    const agora = await fetchJson(TOKEN_API);
    const agoraData = agora.ok ? agora.data?.data : null;
    roomBroadcasting = !!d.broadcast;
    roomAgora = agoraData || null;
    if (state !== lastRoomState) {
      lastRoomState = state;
      onUpdate({
        ok: true, type: 'room-status',
        room: { id: d.id, name: d.name, status: d.status, broadcast: d.broadcast, lock: d.lock, plan: d.plan, maxParticipants: d.maxParticipants },
        agora: agoraData ? { appId: agoraData.appId, uid: agoraData.uid, expiration: agoraData.expiration, hasToken: !!agoraData.token } : null,
        sourceOrigin: ROOM_API, timestamp: ts, changed: true
      });
    } else {
      onUpdate({ ok: true, type: 'room-status', room: { status: d.status, broadcast: d.broadcast }, agora: agoraData ? { hasToken: true } : null, sourceOrigin: ROOM_API, timestamp: ts, changed: false });
    }
  };
  await tick();
  setInterval(tick, ROOM_POLL);
}

// ============================================================
// 協調器：房間開播時自動啟動 caption DOM 抓取（本機 chromium）
// 字幕由 Akkadu 網頁經 Agora 收到後渲染在 aria-live 容器，headless 抓 DOM
// ============================================================
let captionTimer = null;
// 本機抓到字幕後推送目標（VPS 轉播端）；預設本機，可設 INGEST_URL 指向 live.esggo.co
const INGEST_URL = process.env.INGEST_URL || `http://localhost:${process.env.PORT || 8787}/ingest`;
async function pushCaption(cap) {
  try {
    await fetch(`${INGEST_URL}?src=akkadu-kxxf`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cap)
    });
  } catch (e) { /* 推送失敗不中斷抓取 */ }
}
export async function startAkkaduMonitor(onCaption, onRoom) {
  let firstDumpDone = false;
  // 房間監控
  startRoomMonitor((room) => {
    onRoom && onRoom(room);
    // 開播才啟動 caption 抓取
    if (room.ok && room.room && room.room.broadcast && !captionTimer) {
      captionTimer = setInterval(async () => {
        const r = await dumpDom();
        if (!r.ok) { onCaption && onCaption({ ok: false, error: r.error, sourceOrigin: TARGET_URL, timestamp: new Date().toISOString() }); return; }
        // 開播首輪存 DOM 快照（反推 selector / 留證據）
        if (!firstDumpDone) {
          firstDumpDone = true;
          try { await writeFile(new URL('./debug_dom.html', import.meta.url), r.dom); } catch {}
        }
        const caps = extractCaptions(r.dom);
        const joined = caps.join(' || ');
        if (joined.length > 0) {
          const cap = { ok: true, sourceOrigin: TARGET_URL, captions: caps, text: joined, hash: crypto.createHash('sha256').update(joined).digest('hex'), timestamp: new Date().toISOString(), agora: roomAgora ? { appId: roomAgora.appId, uid: roomAgora.uid } : null };
          onCaption && onCaption(cap);
          pushCaption(cap); // 推送到 VPS 轉播端
          // 留字幕證據檔
          try { await appendFile(new URL('./debug_caption.txt', import.meta.url), joined + '\n'); } catch {}
        }
      }, DUMP_INTERVAL);
    } else if ((!room.room || !room.room.broadcast) && captionTimer) {
      clearInterval(captionTimer); captionTimer = null; firstDumpDone = false;
    }
  });
}

// 若直接執行則自測
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
const isMain = import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (isMain) {
  console.log('=== Akkadu caption 自測 (3 輪順序) ===');
  (async () => {
    for (let n = 0; n < 3; n++) {
      const r = await dumpDom();
      if (r.ok) {
        const caps = extractCaptions(r.dom);
        console.log(`[${n}] captions(${caps.length}):`, (caps.slice(0, 3).join(' | ') || '(空/無即時字幕-未登入)').slice(0, 200));
      } else {
        console.log(`[${n}] FAIL:`, r.error);
      }
      if (n < 2) await new Promise(r => setTimeout(r, DUMP_INTERVAL));
    }
    process.exit(0);
  })();
}
