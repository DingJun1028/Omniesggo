#!/usr/bin/env node
// ze hermes — Hermes Agent 完全集成
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

const hermesDir = path.join(homedir(), 'AppData', 'Local', 'hermes', 'hermes-agent');
const root = process.cwd();
const opencode = ['pnpm', 'exec', 'opencode'];

function checkHermesServer() {
  const p = path.join(hermesDir, 'agent', 'transports', 'hermes_tools_mcp_server.py');
  return existsSync(p);
}
function checkMcpList() {
  const r = spawnSync(opencode[0], opencode.slice(1).concat(['mcp', 'list']), { cwd: root, stdio: 'pipe', timeout: 90000 });
  return { ok: r.status === 0, out: r.stdout?.toString() || '' };
}

const action = process.argv[2] || 'status';

console.log('🤖 Hermes 完全集成');
console.log(`  Hermes Agent：${checkHermesServer() ? '✅ 已安裝' : '❌ 缺失'}（${path.join(hermesDir, 'agent', 'transports', 'hermes_tools_mcp_server.py')}）`);

if (action === 'status') {
  const { ok, out } = checkMcpList();
  console.log(`  Hermes MCP：${ok ? '✅ 已連線' : '⚠️  連線問題'}`);
  console.log(`  MCP 詳情：${out.split('\n').find((l) => l.includes('hermes'))?.trim() || 'N/A'}`);
} else if (action === 'start') {
  const r = spawnSync(opencode[0], opencode.slice(1).concat(['mcp', 'auth', 'cloudflare']), { cwd: root, stdio: 'inherit' });
  process.exit(r.status ?? 1);
} else if (action === 'check') {
  const r = spawnSync(opencode[0], opencode.slice(1).concat(['mcp', 'list']), { cwd: root, stdio: 'inherit' });
  process.exit(r.status ?? 1);
}
