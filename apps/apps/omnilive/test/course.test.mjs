import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

// 必須在載入 server.mjs 前設定: 該模組載入時就決定是否 listen。
// 靜態 import 會被提升, 故改用動態載入 (top-level await)。
process.env.OMNILIVE_NO_LISTEN = '1';
const { generateCourse, CourseGenError } = await import('../server.mjs');

/**
 * 起一座假 Ollama, 驗證 generateCourse 的逾時 / 錯誤分類邏輯。
 * 真實 Ollama 在 VPS 純 CPU 上需 >400s, 無法在測試中等待。
 * @param {(body: any) => {status: number, payload: any, delayMs?: number}} handler
 */
async function withFakeOllama(handler, fn) {
  const srv = http.createServer(async (req, res) => {
    let raw = '';
    for await (const c of req) raw += c;
    let body = {}; try { body = JSON.parse(raw); } catch { /* 忽略 */ }
    const { status, payload, delayMs = 0 } = handler(body);
    if (delayMs) await new Promise(r => setTimeout(r, delayMs));
    res.writeHead(status, { 'content-type': 'application/json' });
    res.end(JSON.stringify(payload));
  });
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const port = srv.address().port;
  const oldUrl = process.env.OLLAMA_URL;
  process.env.OLLAMA_URL = `http://127.0.0.1:${port}`;
  try { await fn(); }
  finally {
    if (oldUrl === undefined) delete process.env.OLLAMA_URL; else process.env.OLLAMA_URL = oldUrl;
    await new Promise(r => srv.close(r));
  }
}

const OK_PAYLOAD = {
  response: JSON.stringify({
    summary: '本節談技術架構',
    keypoints: ['架構分層', '字幕同步'],
    terms: [{ term: 'SSE', en: 'Server-Sent Events', wiki: 'https://zh.wikipedia.org/wiki/SSE', explain: '伺服器推送' }],
    similar_cases: ['案例甲'],
  }),
};

test('generateCourse 成功時回傳結構化解說', async () => {
  await withFakeOllama(() => ({ status: 200, payload: OK_PAYLOAD }), async () => {
    const r = await generateCourse('字幕內容');
    assert.equal(r.summary, '本節談技術架構');
    assert.equal(r.keypoints.length, 2);
    assert.equal(r.terms[0].en, 'Server-Sent Events');
    assert.equal(r.similar_cases.length, 1);
  });
});

test('generateCourse 逾時拋 CourseGenError(code=timeout) 而非通用錯誤', async () => {
  await withFakeOllama(
    () => ({ status: 200, payload: OK_PAYLOAD, delayMs: 400 }),
    async () => {
      await assert.rejects(
        () => generateCourse('字幕', { timeoutMs: 80 }),
        (e) => {
          assert.ok(e instanceof CourseGenError, '應為 CourseGenError');
          assert.equal(e.code, 'timeout');
          assert.match(e.message, /逾時/);
          return true;
        },
      );
    },
  );
});

test('generateCourse HTTP 錯誤標記 code=ollama', async () => {
  await withFakeOllama(() => ({ status: 500, payload: { error: 'boom' } }), async () => {
    await assert.rejects(
      () => generateCourse('字幕'),
      (e) => { assert.ok(e instanceof CourseGenError); assert.equal(e.code, 'ollama'); return true; },
    );
  });
});

test('generateCourse 回應非合法 JSON 標記 code=parse', async () => {
  await withFakeOllama(() => ({ status: 200, payload: { response: '這不是 JSON' } }), async () => {
    await assert.rejects(
      () => generateCourse('字幕'),
      (e) => { assert.ok(e instanceof CourseGenError); assert.equal(e.code, 'parse'); return true; },
    );
  });
});

test('num_predict 上界有傳給 Ollama（限制輸出長度）', async () => {
  let seen = null;
  await withFakeOllama((b) => { seen = b; return { status: 200, payload: OK_PAYLOAD }; }, async () => {
    await generateCourse('字幕', { numPredict: 321 });
    assert.equal(seen.options.num_predict, 321);
  });
});

test('model 可逐次覆寫（不污染全域預設）', async () => {
  let seen = null;
  await withFakeOllama((b) => { seen = b; return { status: 200, payload: OK_PAYLOAD }; }, async () => {
    await generateCourse('字幕', { model: 'qwen3:8b-64k' });
    assert.equal(seen.model, 'qwen3:8b-64k');
  });
});
