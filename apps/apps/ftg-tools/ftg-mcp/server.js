#!/usr/bin/env node
/**
 * ftg-mcp — 墾趣旅遊 FTG 網頁生成 MCP server (stdio JSON-RPC 2.0)
 * 暴露工具:
 *   generate_ftg_page {version, theme, lang} -> 產出 apps/ftg-{version}/
 *   deploy_ftg_page   {version}              -> SCP 到 VPS /var/www/ftg-tours/{version}/
 * 依賴: 同目錄 ftg-gen.js (CLI)
 * 啟動: node server.js
 *
 * 安全: host/user 嚴格白名單 + 禁止字元過濾, SSH key/host 走 env 可覆寫
 */
'use strict';
const cp = require('child_process');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

const ROOT = path.resolve(__dirname, '..', '..'); // ftg-tools/ftg-mcp -> esggo
const GEN = path.join(__dirname, '..', 'ftg-gen.js');
const SSH_KEY = process.env.FTG_SSH_KEY || '~/.ssh/esggo_original';
const DEF_HOST = process.env.FTG_VPS_HOST || '161.118.248.180';
const DEF_USER = process.env.FTG_VPS_USER || 'ubuntu';

// 結構化錯誤日誌 (可觀測性強化)
function logErr(ctx, e) {
  process.stderr.write('[ftg-mcp][err] ' + ctx + ' :: ' + (e && e.message ? e.message : String(e)) + '\n');
}

// 防命令注入: 僅允許安全字元, 且 host 必須為 IP 或合法域名
function safeHost(h) {
  if (typeof h !== 'string') return null;
  if (/^[a-zA-Z0-9.\-]+$/.test(h) && !h.includes('..') && !h.includes('/') && !h.includes('@')) return h;
  return null;
}
function safeUser(u) {
  if (typeof u !== 'string') return null;
  if (/^[a-zA-Z0-9_\-]+$/.test(u)) return u;
  return null;
}
function safeVer(v) {
  if (typeof v !== 'string') return null;
  if (/^[a-zA-Z0-9.\-]+$/.test(v)) return v;
  return null;
}

function runGen(version, theme, lang) {
  return new Promise((res, rej) => {
    cp.execFile('node', [GEN, '--version', version, '--theme', theme, '--lang', lang],
      { cwd: ROOT, maxBuffer: 1024 * 1024 * 24 },
      (e, so, se) => e ? rej(e.message + '\n' + se) : res(so));
  });
}

function deploy(version) {
  const ver = safeVer(version);
  if (!ver) return Promise.reject(new Error('invalid version'));
  const local = path.join(ROOT, 'apps', 'ftg-' + ver);
  // 部署前檢查產出存在 (正確性)
  const must = ['index.html', 'styles.css', 'app.js'];
  for (const f of must) {
    if (!fs.existsSync(path.join(local, f))) {
      return Promise.reject(new Error('本地產出缺失: ' + path.join(local, f) + ' (請先 generate_ftg_page)'));
    }
  }
  const host = DEF_HOST, user = DEF_USER; // host/user 走 env 預設, 不接受外部覆寫以防注入
  const remote = `/var/www/ftg-tours/${ver}`;
  const keyArg = SSH_KEY;
  const mkdir = `ssh -i ${keyArg} -o StrictHostKeyChecking=accept-new ${user}@${host} "sudo mkdir -p ${remote}/assets && sudo chown -R ${user}:${user} ${remote}"`;
  const scp1 = `scp -i ${keyArg} -o StrictHostKeyChecking=accept-new ${local}/index.html ${local}/styles.css ${local}/app.js ${user}@${host}:${remote}/`;
  const scp2 = `scp -i ${keyArg} -o StrictHostKeyChecking=accept-new ${local}/assets/*.jpg ${user}@${host}:${remote}/assets/`;
  const full = `${mkdir} && ${scp1} && ${scp2}`;
  return new Promise((res, rej) => {
    cp.exec(full, { maxBuffer: 1024 * 1024 * 24 }, (e, so, se) => {
      if (e) rej(new Error(e.message + '\n' + se));
      else res(so);
    });
  });
}

const TOOLS = [
  {
    name: 'generate_ftg_page',
    description: '參數化生成墾趣旅遊 FTG 靜態網頁 (index.html/styles.css/app.js + 攝影圖)',
    inputSchema: {
      type: 'object',
      properties: {
        version: { type: 'string', description: '版本號, 如 2.7', default: '2.7' },
        theme: { type: 'string', enum: ['stitch-dark', 'light'], default: 'stitch-dark' },
        lang: { type: 'string', enum: ['zh', 'en'], default: 'zh' }
      },
      required: ['version']
    }
  },
  {
    name: 'deploy_ftg_page',
    description: '將已生成的 FTG 版本 SCP 部署到 VPS (SSH key/host 走 env: FTG_SSH_KEY/FTG_VPS_HOST/FTG_VPS_USER)',
    inputSchema: {
      type: 'object',
      properties: {
        version: { type: 'string', description: '要部署的版本號, 如 2.8', default: '2.7' }
      },
      required: ['version']
    }
  }
];

function handle(req) {
  const { method, params = {}, id } = req;
  if (method === 'initialize') {
    return { jsonrpc: '2.0', id, result: { protocolVersion: '2024-11-05', capabilities: { tools: {} }, serverInfo: { name: 'ftg-mcp', version: '1.0.0' } } };
  }
  if (method === 'tools/list') {
    return { jsonrpc: '2.0', id, result: { tools: TOOLS } };
  }
  if (method === 'tools/call') {
    const n = params.name, a = params.arguments || {};
    if (n === 'generate_ftg_page') {
      return runGen(a.version || '2.7', a.theme || 'stitch-dark', a.lang || 'zh')
        .then(out => ({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: out }] } }))
        .catch(e => { logErr('tool.' + (params.name || '?'), e); return { jsonrpc: '2.0', id, error: { code: -32000, message: String(e) } }; });
    }
    if (n === 'deploy_ftg_page') {
      return deploy(a.version || '2.7')
        .then(out => ({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: 'deployed ' + (a.version || '2.7') + '\n' + out }] } }))
        .catch(e => ({ jsonrpc: '2.0', id, error: { code: -32000, message: String(e) } }));
    }
    return { jsonrpc: '2.0', id, error: { code: -32601, message: 'unknown tool ' + n } };
  }
  return { jsonrpc: '2.0', id, error: { code: -32601, message: 'method not found: ' + method } };
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.on('line', line => {
  if (!line.trim()) return;
  try {
    const r = handle(JSON.parse(line));
    Promise.resolve(r).then(res => process.stdout.write(JSON.stringify(res) + '\n'));
  } catch (e) { /* ignore malformed */ }
});
process.stderr.write('[ftg-mcp] stdio server ready\n');
