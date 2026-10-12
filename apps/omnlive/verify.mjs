// OmniLive 可重現驗證流程 (npm run verify)
// 不依賴外網/whisper: 啟動服務 → /health → /config → 手動字幕 → SSE 接收。
// 目的: 讓後續可快速確認 Zoom 場景下「設定成功 + 雙語字幕資料流跑通」。
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { readSSEOnce } from './test/sse-helper.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname);
const PORT = 8799;
const BASE = `http://localhost:${PORT}`;
const wait = ms => new Promise(r => setTimeout(r, ms));
const log = (m) => console.log('  ' + m);
let failed = false;
function check(cond, label) { if (cond) console.log('✅ ' + label); else { console.log('❌ ' + label); failed = true; } }

const srv = spawn('node', ['server.mjs'], { cwd: ROOT, env: { ...process.env, OMNILIVE_TRANSLATE_MOCK: '1', PORT: String(PORT), OMNILIVE_AUDIO_SOURCE: 'caption', OMNILIVE_FROM: 'zh-TW', OMNILIVE_TO: 'en' } });

async function getJSON(u) { const r = await fetch(u); return r.json(); }

async function main() {
  console.log('🔍 OmniLive 驗收驗證 (Zoom 場景最小可用流程)');
  // 1. 啟動
  let up = false;
  for (let i = 0; i < 40; i++) { try { const h = await getJSON(BASE + '/health'); if (h.status === 'ok') { up = true; break; } } catch {} await wait(150); }
  check(up, '服務啟動 /health 可達');
  if (!up) { srv.kill('SIGKILL'); process.exit(1); }

  // 2. 設定讀取
  const cfg = await getJSON(BASE + '/config');
  check(cfg.audioSource === 'caption', '/config 回傳音訊來源設定: ' + cfg.audioSource);
  check(cfg.from === 'zh-TW' && cfg.to === 'en', `/config 雙語配對: ${cfg.from}→${cfg.to}`);

  // 3. 手動字幕 → 雙語
  const res = await fetch(BASE + '/api/speak', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text: '歡迎參加線上會議', room: 'verify' }) });
  const sub = await res.json();
  check(res.headers.get('X-OA-Trace') != null, '回應帶 5T X-OA-Trace 溯源標頭');
  check(sub.source === '歡迎參加線上會議', '辨識(手動)結果回傳原文');
  check(/MOCK:zh-TW→en/.test(sub.target), '翻譯層輸出雙語目標: ' + sub.target);

  // 4. SSE 即時推送
  const got = await readSSEOnce(BASE + '/stream?room=verify', p => p.data && p.data.source === '歡迎參加線上會議');
  check(got && got.source === '歡迎參加線上會議', 'SSE 播放器收到雙語字幕推送');

  // 5. 靜態播放器可達
  const page = await fetch(BASE + '/');
  check(page.status === 200 && (page.headers.get('content-type') || '').includes('text/html'), '播放器 UI (/) 可載入');

  // 6. 建立分享房間 + 觀眾連結 (即時分享 / QR 來源)
  const rroom = await fetch(BASE + '/api/room', { method: 'POST' });
  const rj = await rroom.json();
  check(rroom.status === 200 && /^[A-Z0-9]{6}$/.test(rj.room), '建立分享房間並取得 6 位房間碼: ' + rj.room);
  check(/room=/.test(rj.viewerLink) && /role=caster/.test(rj.casterLink), '產生觀眾/主持人雙連結');
  // 先開兩個觀眾 SSE 連線，再經房間送出字幕，驗證同步
  const vGotP = readSSEOnce(BASE + '/stream?room=' + rj.room, p => p.data && p.data.source === '分享驗證');
  const v2P = readSSEOnce(BASE + '/stream?room=' + rj.room, p => p.data && p.data.source === '分享驗證');
  await fetch(BASE + '/api/speak', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text: '分享驗證', room: rj.room }) });
  const [vGot, v2] = await Promise.all([vGotP, v2P]);
  check(vGot != null && v2 != null, '同房間多觀眾經分享連結收到同步字幕');

  console.log(failed ? '\n❌ 驗證失敗' : '\n✅ 全部通過 — Zoom 場景設定成功，雙語字幕資料流與即時分享跑通');
  srv.kill('SIGKILL');
  // 不呼叫 process.exit：避免 Node24/Win 在已 kill 子行程 handle 上觸發 UV assertion
  setTimeout(() => {}, 50).unref?.();
  if (failed) process.exitCode = 1;
}
main().catch(e => { console.error(e); srv.kill('SIGKILL'); process.exitCode = 1; });
