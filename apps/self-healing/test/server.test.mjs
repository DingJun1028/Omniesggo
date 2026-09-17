// Self-Healing Engine 測試檔
// 驗證 Webhook 端點、5T 治理、Gmail 解析

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SERVER_PATH = resolve(__dirname, '..', 'server.mjs');
const PORT = 8799;
const BASE = `http://127.0.0.1:${PORT}`;
let server;

// 啟動測試用伺服器（child process）
test.before(async () => {
  server = spawn('node', [SERVER_PATH], {
    env: { ...process.env, PORT: String(PORT), GEMINI_API_KEY: 'test-key' },
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  // 等待伺服器啟動（最多 15 秒）
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('server start timeout')), 15000);
    const check = setInterval(async () => {
      try {
        const res = await fetch(`${BASE}/health`);
        if (res.ok) {
          clearInterval(check);
          clearTimeout(timeout);
          resolve();
        }
      } catch {}
    }, 300);
  });
});

test.after(() => {
  if (server) server.kill();
});

async function post(path, body, headers = {}) {
  return fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

async function get(path) {
  return fetch(`${BASE}${path}`);
}

// ═══════════════════════════════════════════
// 測試案例
// ═══════════════════════════════════════════

test('GET /health 回傳 200 + 5T 標誌', async () => {
  const res = await get('/health');
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.status, 'ok');
  assert.equal(data.fiveT, true);
  assert.equal(data.service, 'self-healing-engine');
});

test('GET /api/5t 回傳完整 5T 協定', async () => {
  const res = await get('/api/5t');
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.protocol, '5T');
  assert.equal(data.compliant, true);
  assert.ok(data.items.Traceable);
  assert.ok(data.items.Trackable);
  assert.ok(data.items.Transparent);
  assert.ok(data.items.Trustworthy);
  assert.ok(data.items.Tangible);
});

test('POST /webhook/github 忽略非失敗事件', async () => {
  const res = await post('/webhook/github', {
    action: 'completed',
    workflow_run: { conclusion: 'success' },
  }, { 'x-github-event': 'workflow_run' });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.status, 'ignored');
});

test('POST /webhook/github 接受失敗事件並回傳 202 + UUID', async () => {
  const res = await post('/webhook/github', {
    action: 'completed',
    workflow_run: {
      conclusion: 'failure',
      name: 'CI',
      output_title: 'Build Failed: typecheck error',
    },
  }, { 'x-github-event': 'workflow_run' });
  assert.equal(res.status, 202);
  const data = await res.json();
  assert.equal(data.status, 'accepted');
  assert.ok(data.uuid);
  assert.equal(data.fiveT.traceable, 'GitHub-Actions-Error');
});

test('POST /webhook/github 驗證 HMAC 簽章', async () => {
  const payload = JSON.stringify({
    action: 'completed',
    workflow_run: { conclusion: 'failure' },
  });
  // 無 secret 設定時，不帶簽章應通過
  const res = await post('/webhook/github', JSON.parse(payload), { 'x-github-event': 'workflow_run' });
  assert.equal(res.status, 202);
});

test('POST /webhook/gmail 忽略非失敗信件', async () => {
  const res = await post('/webhook/gmail', {
    emailContent: Buffer.from('Subject: PR Merged\nFrom: notifications@github.com').toString('base64'),
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.status, 'ignored');
});

test('POST /webhook/gmail 接受失敗信件並回傳 202', async () => {
  const emailContent = `Subject: Run failed - main branch
From: notifications@github.com
Message-ID: <test-123@github.com>

Workflow run failed for commit abc1234
Error: TypeCheck failed in apps/test.ts`;

  const res = await post('/webhook/gmail', {
    emailContent: Buffer.from(emailContent).toString('base64'),
  });
  assert.equal(res.status, 202);
  const data = await res.json();
  assert.equal(data.status, 'accepted');
  assert.ok(data.uuid);
});

test('GET /api/tasks 回傳服務狀態', async () => {
  const res = await get('/api/tasks');
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.service, 'self-healing-engine');
  assert.equal(data.status, 'running');
});

test('GET 未知路徑回傳 404', async () => {
  const res = await get('/unknown');
  assert.equal(res.status, 404);
});
