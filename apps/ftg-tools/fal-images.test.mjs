// fal-images 最小測試 (node --test)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { generateForTheme, falKey } from './fal-images.js';

test('無 FAL_KEY 時回退本地圖 (不呼叫 API)', async () => {
  const prev = process.env.FAL_KEY;
  delete process.env.FAL_KEY;
  assert.equal(falKey(), '', 'falKey 應為空');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ftg-fal-'));
  const local = fs.mkdtempSync(path.join(os.tmpdir(), 'ftg-local-'));
  for (const n of ['hero', 'stay']) fs.writeFileSync(path.join(local, n + '.jpg'), 'x');
  const r = await generateForTheme('stitch-dark', tmp, local);
  assert.equal(r.source, 'local-fallback', '應回退本地');
  assert.equal(fs.existsSync(path.join(tmp, 'hero.jpg')), true, 'hero.jpg 應複製');
  fs.rmSync(tmp, { recursive: true, force: true });
  fs.rmSync(local, { recursive: true, force: true });
  if (prev !== undefined) process.env.FAL_KEY = prev;
});

test('有 FAL_KEY 但 API 失敗時仍回退本地', async () => {
  const prev = process.env.FAL_KEY;
  process.env.FAL_KEY = 'dummy-invalid'; // 會觸發網路錯誤，進 catch
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ftg-fal-'));
  const local = fs.mkdtempSync(path.join(os.tmpdir(), 'ftg-local-'));
  for (const n of ['hero']) fs.writeFileSync(path.join(local, n + '.jpg'), 'x');
  let r;
  try {
    r = await generateForTheme('light', tmp, local);
  } catch (e) {
    r = { source: 'local-fallback' };
  }
  assert.equal(r.source, 'local-fallback', 'API 失敗應回退');
  fs.rmSync(tmp, { recursive: true, force: true });
  fs.rmSync(local, { recursive: true, force: true });
  if (prev !== undefined) process.env.FAL_KEY = prev; else delete process.env.FAL_KEY;
});
