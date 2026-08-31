// ftg-gen 安全強化測試 (node --test)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

const HERE = process.cwd();

test('版本號含注入字元時被白名單擋下 (CLI 層防護)', () => {
  const ver = 'x<script>';
  let out;
  try {
    out = execFileSync('node', ['ftg-gen.js', '--version', ver, '--theme', 'light', '--lang', 'en'], {
      cwd: HERE,
      encoding: 'utf8',
    });
  } catch (e) {
    out = e.stdout || '';
  }
  // safeVer 會回退 2.7，產出目錄 ftg-2.7
  const dir = path.join(HERE, '..', 'ftg-2.7');
  assert.ok(fs.existsSync(path.join(dir, 'index.html')), 'safeVer 應回退到 ftg-2.7 而非 x<script>');
  // 清理
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch {}
});

test('生成輸出不含注入字元 (XSS 防護端對端)', () => {
  const ver = '2.7';
  execFileSync('node', ['ftg-gen.js', '--version', ver, '--theme', 'light', '--lang', 'en'], { cwd: HERE });
  const dir = path.join(HERE, '..', 'ftg-' + ver);
  const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
  assert.ok(html.includes('FTG 2.7'), 'title 應含 FTG 2.7');
  assert.ok(!html.includes('x<script>'), '注入字元不應出現在輸出');
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch {}
});
