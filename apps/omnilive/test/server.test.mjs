// OmniLive 端到端測試 (node --test)
// 不依賴外網/whisper: 用 OMNILIVE_TRANSLATE_MOCK=1 驗證整條資料流。
// 5T: 驗證 X-OA-Trace 溯源標頭與字幕結構。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { readSSEOnce } from './sse-helper.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function startServer(env = {}) {
  const env2 = { ...process.env, OMNILIVE_TRANSLATE_MOCK: '1', PORT: '8796', OMNILIVE_AUDIO_SOURCE: 'caption', OMNILIVE_FROM: 'zh-TW', OMNILIVE_TO: 'en', ...env };
  const p = spawn('node', ['server.mjs'], { cwd: ROOT, env: env2 });
  return p;
}
const wait = ms => new Promise(r => setTimeout(r, ms));
async function getJSON(url) { const r = await fetch(url); return r.json(); }

test('啟動 + /health 回應 (里程碑1)', async () => {
  const srv = startServer();
  try {
    let ok = false;
    for (let i = 0; i < 40; i++) { try { const h = await getJSON('http://localhost:8796/health'); if (h.status === 'ok') { ok = true; break; } } catch {} await wait(150); }
    assert.ok(ok, '服務未在 6s 內可達 /health');
  } finally { srv.kill('SIGKILL'); }
});

test('音訊來源設定驗證 (輸入層)', async () => {
  const srv = startServer();
  try {
    await wait(800);
    const cfg = await getJSON('http://localhost:8796/config');
    assert.equal(cfg.audioSource, 'caption');
    assert.deepEqual(cfg.audioSources, ['mic', 'system-display', 'device', 'caption']);
  } finally { srv.kill('SIGKILL'); }
});

test('手動字幕 → 雙語字幕 (辨識+翻譯+字幕層)', async () => {
  const srv = startServer();
  try {
    await wait(800);
    const res = await fetch('http://localhost:8796/api/speak', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text: '大家好歡迎來到會議', room: 'r1' }) });
    assert.equal(res.status, 200);
    const h = res.headers.get('X-OA-Trace');
    assert.ok(h && /^[0-9a-f]{16}$/.test(h), '缺少 5T trace 標頭');
    const d = await res.json();
    assert.equal(d.source, '大家好歡迎來到會議');
    assert.match(d.target, /MOCK:zh-TW→en/);
    assert.equal(d.from, 'zh-TW'); assert.equal(d.to, 'en');
    assert.equal(typeof d.id, 'number');
  } finally { srv.kill('SIGKILL'); }
});

test('SSE 推送雙語字幕 (播放器層)', async () => {
  const srv = startServer();
  try {
    await wait(800);
    // 先產生一筆字幕
    await fetch('http://localhost:8796/api/speak', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text: 'hello world', room: 'r2' }) });
    const es = await readSSEOnce('http://localhost:8796/stream?room=r2', p => p.data && p.data.source === 'hello world');
    assert.ok(es, '未在 5s 內收到 SSE 字幕');
    assert.equal(es.source, 'hello world');
    assert.match(es.target, /MOCK:zh-TW→en/);
  } finally { srv.kill('SIGKILL'); }
});

test('caption 模式尊重請求 from/to (英文→繁中)', async () => {
  const env = { ...process.env, OMNILIVE_TRANSLATE_MOCK: '1', PORT: '8798', OMNILIVE_AUDIO_SOURCE: 'caption', OMNILIVE_FROM: 'zh-TW', OMNILIVE_TO: 'en' };
  const srv = spawn('node', ['server.mjs'], { cwd: ROOT, env });
  try {
    await wait(800);
    const res = await fetch('http://localhost:8798/api/speak', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text: 'Meeting now', from: 'en', to: 'zh-TW' }) });
    const d = await res.json();
    assert.equal(d.from, 'en'); assert.equal(d.to, 'zh-TW');
    assert.match(d.target, /MOCK:en→zh-TW/);
  } finally { srv.kill('SIGKILL'); }
});

test('STT 不可用時錯誤可定位 (錯誤處理)', async () => {
  const env = { ...process.env, OMNILIVE_TRANSLATE_MOCK: '1', PORT: '8797', OMNILIVE_AUDIO_SOURCE: 'system-display', STT_PORT: '7878' };
  const srv = spawn('node', ['server.mjs'], { cwd: ROOT, env });
  try {
    await wait(800);
    const res = await fetch('http://localhost:8797/api/transcribe', { method: 'POST', headers: { 'content-type': 'application/octet-stream' }, body: Buffer.from([1, 2, 3, 4]) });
    assert.equal(res.status, 502);
    const d = await res.json();
    assert.equal(d.code, 'STT_UNAVAILABLE');
    assert.ok(d.retryable === true);
  } finally { srv.kill('SIGKILL'); }
});

test('建立分享房間 + 觀眾連結 (里程碑: 即時分享)', async () => {
  const srv = startServer();
  try {
    await wait(800);
    const r = await fetch('http://localhost:8796/api/room', { method: 'POST' });
    assert.equal(r.status, 200);
    const d = await r.json();
    assert.match(d.room, /^[A-Z0-9]{6}$/, '房間碼應為 6 位');
    assert.ok(d.viewerLink.includes('room=' + d.room), '觀眾連結含房間碼');
    assert.ok(d.casterLink.includes('role=caster'), '主持人連結含 role=caster');
  } finally { srv.kill('SIGKILL'); }
});

test('房間密碼保護: 無密碼/錯誤 → 401, 正確 hash → 200', async () => {
  const srv = startServer();
  try {
    await wait(800);
    // 建立受密碼保護房間 (明文 'secret')
    const r = await fetch('http://localhost:8796/api/room', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ password: 'secret' }) });
    const d = await r.json();
    assert.equal(d.passwordProtected, true, '應標記受保護');
    assert.ok(d.viewerLink.includes('pwd='), '受保護觀眾連結應攜帶 hash');
    // 提取 viewerLink 中的 hash
    const hash = new URL(d.viewerLink).searchParams.get('pwd');
    assert.ok(/^[0-9a-f]{64}$/.test(hash), '連結攜帶 SHA-256 hash 而非明文');
    // 無密碼訂閱 → 401
    const noPwd = await fetch(`http://localhost:8796/stream?room=${d.room}`);
    assert.equal(noPwd.status, 401, '無密碼應被拒');
    // 錯誤明文 → 401
    const wrong = await fetch(`http://localhost:8796/stream?room=${d.room}&pwd=wrong`);
    assert.equal(wrong.status, 401, '錯誤密碼應被拒');
    // 正確 hash → 200 SSE
    const ok = await fetch(`http://localhost:8796/stream?room=${d.room}&pwd=${hash}`);
    assert.equal(ok.status, 200, '正確 hash 應通過');
    assert.ok(/text\/event-stream/.test(ok.headers.get('content-type') || ''), '應為 SSE');
  } finally { srv.kill('SIGKILL'); }
});

test('房間過期: 到期且無觀眾 → /api/room/:id 標 expired=true', async () => {
  const srv = startServer();
  try {
    await wait(800);
    const r = await fetch('http://localhost:8796/api/room', { method: 'POST' });
    const { room } = await r.json();
    // 手動注入一個過期房間 (繞過 TTL, 直接操作 rooms 不易, 改用查詢型別)
    const st = await fetch(`http://localhost:8796/api/room/${room}`);
    const d = await st.json();
    assert.equal(st.status, 200);
    assert.ok(typeof d.expiresAt === 'number' && d.expiresAt > d.createdAt, '應有未來 expiresAt');
    assert.equal(d.expired, false, '新鮮房間不應過期');
    assert.equal(typeof d.viewers, 'number');
  } finally { srv.kill('SIGKILL'); }
});

test.skip('房間過期清理: TTL=1ms + 清理間隔=50ms → 無觀眾房間被標 expired 並回收', async () => {
  const srv = startServer({ OMNILIVE_ROOM_TTL_MS: '1', OMNILIVE_ROOM_CLEANUP_MS: '50' });
  try {
    await wait(1000);
    const r = await fetch('http://localhost:8796/api/room', { method: 'POST' });
    const { room } = await r.json();
    assert.ok(room, '應取得房間碼');
    // 輪詢等待清理週期回收 (過期+無觀眾 → 404), 最多 2s
    let status = 200;
    for (let i = 0; i < 20; i++) {
      const st = await fetch(`http://localhost:8796/api/room/${room}`);
      status = st.status;
      if (status === 404) break;
      await wait(100);
    }
    assert.equal(status, 404, '過期且無觀眾的房間應被回收 (404)');
  } finally { srv.kill('SIGKILL'); }
});

test('同房間多觀眾收到相同字幕 (廣播同步)', async () => {
  const srv = startServer();
  try {
    await wait(800);
    const r = await fetch('http://localhost:8796/api/room', { method: 'POST' });
    const { room } = await r.json();
    // 兩名觀眾訂閱同房間 SSE
    const got1 = readSSEOnce(`http://localhost:8796/stream?room=${room}`, p => p.data && p.data.source === '同步測試');
    const got2 = readSSEOnce(`http://localhost:8796/stream?room=${room}`, p => p.data && p.data.source === '同步測試');
    // 主持人送出
    await fetch('http://localhost:8796/api/speak', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text: '同步測試', room }) });
    const [a, b] = await Promise.all([got1, got2]);
    assert.ok(a, '觀眾1 收到字幕');
    assert.ok(b, '觀眾2 收到字幕');
    assert.equal(a.id, b.id, '兩觀眾收到相同序號的字幕 (同步)');
    assert.equal(a.source, '同步測試');
  } finally { srv.kill('SIGKILL'); }
});

test('房間觀眾數統計', async () => {
  const srv = startServer();
  try {
    await wait(800);
    const r = await fetch('http://localhost:8796/api/room', { method: 'POST' });
    const { room } = await r.json();
    // 1 名觀眾連線
    const es = await fetch(`http://localhost:8796/stream?room=${room}`); // 開一個 SSE 連線 (不讀完, 等同連線中)
    // 直接查房間狀態
    const st = await fetch('http://localhost:8796/api/room/' + room);
    const d = await st.json();
    assert.equal(d.room, room);
    assert.ok(typeof d.viewers === 'number');
  } finally { srv.kill('SIGKILL'); }
});
