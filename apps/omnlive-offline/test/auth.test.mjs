// OmniLive 主持人端金鑰驗證測試 (node --test)
//
// 背景: POST /api/room、/api/transcribe、/api/speak、/api/course 會實際消耗
// 主機 CPU (STT 跑 whisper, /api/course 跑本地 LLM — 實測單次 115 秒)。
// 上線前這四個端點完全無防護, 任何拿到網址的人都能無限觸發並打爆主機。
// 本測試鎖定 OMNILIVE_HOST_KEY 的行為契約。
//
// 5T: Trustworthy — 未授權者不得觸發高耗能端點。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// 刻意用 8799: node --test 會並行執行各測試檔, 8795/8796/8797/8798 已被佔用
const PORT = '8799';
const KEY = 'test-key-123';
const BASE = `http://localhost:${PORT}`;

function startServer(env = {}) {
  const env2 = { ...process.env, PORT, OMNILIVE_AUDIO_SOURCE: 'caption', OMNILIVE_HOST_KEY: KEY, ...env };
  return spawn('node', ['server.mjs'], { cwd: ROOT, env: env2 });
}

const wait = ms => new Promise(r => setTimeout(r, ms));

/** 等服務就緒 (最多 6s), 回 true/false */
async function waitReady() {
  for (let i = 0; i < 40; i++) {
    try { const r = await fetch(`${BASE}/health`); if (r.ok) return true; } catch { /* 尚未起來 */ }
    await wait(150);
  }
  return false;
}

/** POST 並回傳狀態碼 */
async function post(p, headers = {}) {
  const r = await fetch(BASE + p, { method: 'POST', headers });
  return r.status;
}

test('公開端點在設定金鑰後仍保持可用 (不得被擋)', async () => {
  const srv = startServer();
  try {
    assert.ok(await waitReady(), '服務未在 6s 內就緒');
    for (const p of ['/health', '/config', '/']) {
      const r = await fetch(BASE + p);
      assert.equal(r.status, 200, `GET ${p} 應維持 200, 實際 ${r.status}`);
    }
  } finally { srv.kill('SIGKILL'); }
});

test('POST /api/* 無金鑰 → 401', async () => {
  const srv = startServer();
  try {
    assert.ok(await waitReady(), '服務未在 6s 內就緒');
    for (const ep of ['room', 'speak', 'course', 'transcribe']) {
      assert.equal(await post(`/api/${ep}`), 401, `POST /api/${ep} 無憑證應 401`);
    }
  } finally { srv.kill('SIGKILL'); }
});

test('錯誤金鑰 → 401 (兩種傳遞方式都要擋)', async () => {
  const srv = startServer();
  try {
    assert.ok(await waitReady(), '服務未在 6s 內就緒');
    assert.equal(await post('/api/room', { 'X-OmniLive-Key': 'wrong-key' }), 401, 'X-OmniLive-Key 傳錯應 401');
    assert.equal(await post('/api/room', { Authorization: 'Bearer wrong' }), 401, 'Bearer 傳錯應 401');
    assert.equal(await post('/api/room', { 'X-OmniLive-Key': '' }), 401, '空字串金鑰應 401');
  } finally { srv.kill('SIGKILL'); }
});

test('正確金鑰 → 放行 (X-OmniLive-Key 與 Bearer 皆可)', async () => {
  const srv = startServer();
  try {
    assert.ok(await waitReady(), '服務未在 6s 內就緒');
    assert.equal(await post('/api/room', { 'X-OmniLive-Key': KEY }), 200, 'X-OmniLive-Key 正確應放行');
    assert.equal(await post('/api/room', { Authorization: `Bearer ${KEY}` }), 200, 'Bearer 正確應放行');
  } finally { srv.kill('SIGKILL'); }
});

test('401 回應格式可被前端解析', async () => {
  const srv = startServer();
  try {
    assert.ok(await waitReady(), '服務未在 6s 內就緒');
    const r = await fetch(`${BASE}/api/room`, { method: 'POST' });
    assert.equal(r.status, 401);
    const j = await r.json();
    assert.equal(j.code, 'HOST_KEY_REQUIRED', '應回可辨識的錯誤碼');
    assert.equal(r.headers.get('www-authenticate'), 'Bearer realm="omnilive"');
  } finally { srv.kill('SIGKILL'); }
});

test('未設定金鑰時維持開放 (本機開發向後相容)', async () => {
  // 上線時若忘記設金鑰就是裸奔, 故此處明確記錄「不設 = 不驗證」而非靜默鎖死
  const srv = startServer({ OMNILIVE_HOST_KEY: '' });
  try {
    assert.ok(await waitReady(), '服務未在 6s 內就緒');
    assert.equal(await post('/api/room'), 200, '未設定金鑰時應維持開發模式開放');
  } finally { srv.kill('SIGKILL'); }
});
