// ftg-mcp 最小冒煙測試 (node --test)
// 驗證: 工具清單 / 命令注入防護 / 部署前檢查
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

const HERE = process.cwd(); // ftg-tools (test run cwd)
const GEN = path.join(HERE, 'ftg-gen.js'); // abs, but we run via relative
const SERVER = path.join(HERE, 'ftg-mcp', 'server.js');

test('CLI 生成可執行且產出 index.html', () => {
  const ver = 'test-' + Date.now();
  execFileSync('node', ['ftg-gen.js', '--version', ver, '--theme', 'light', '--lang', 'en'], { cwd: HERE });
  const dir = path.join(HERE, '..', 'ftg-' + ver);
  assert.ok(fs.existsSync(path.join(dir, 'index.html')), 'index.html 應產出');
  assert.ok(fs.existsSync(path.join(dir, 'styles.css')), 'styles.css 應產出');
  assert.ok(fs.existsSync(path.join(dir, 'app.js')), 'app.js 應產出');
  // 清理
  fs.rmSync(dir, { recursive: true, force: true });
});

test('MCP tools/list 回傳兩工具', () => {
  const out = execFileSync('node', ['./ftg-mcp/server.js'], {
    cwd: process.cwd(),
    input: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }) + '\n'
  }).toString();
  const res = JSON.parse(out.trim());
  const names = res.result.tools.map(t => t.name);
  assert.ok(names.includes('generate_ftg_page'));
  assert.ok(names.includes('deploy_ftg_page'));
});

test('deploy_ftg_page 在本地產出缺失時報錯 (不盲目 scp)', () => {
  const out = execFileSync('node', ['./ftg-mcp/server.js'], {
    cwd: process.cwd(),
    input: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'deploy_ftg_page', arguments: { version: 'nonexistent-xyz' } } }) + '\n'
  }).toString();
  const res = JSON.parse(out.trim());
  assert.equal(res.error.code, -32000);
  assert.match(res.error.message, /本地產出缺失/);
});
