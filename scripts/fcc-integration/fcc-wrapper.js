#!/usr/bin/env node
/**
 * fcc-integration — esggo ↔ free-claude-code 整合入口
 *
 * 用途：讓 esggo 專案能透過 free-claude-code 的本地代理，
 * 存取 61 個提供商的模型、程式碼生成與多代理協作能力。
 *
 * 使用方式：
 *   node scripts/fcc-integration/fcc-wrapper.js --model gpt-4o --prompt "..."
 *   node scripts/fcc-integration/fcc-wrapper.js --agent claude --task "..."
 *
 * 前置需求：
 *   - free-claude-code 已完成安裝並執行 (fcc-server)
 *   - 至少一個 coding agent 已連接 (Claude Code / Codex / Hermes)
 *
 * @author esggo team
 * @license AGPL-3.0
 */

import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── 配置 ──────────────────────────────────────────────────────────────────

// FCC 伺服器預設 URL（本機執行時的實際 port）
const FCC_SERVER_DEFAULT =
  process.env.FCC_SERVER_URL || 'http://127.0.0.1:8082';

// FCC CLI 執行檔路徑（相對於這個 wrapper 的位置）
const FCC_CLI = process.env.FCC_CLI || path.resolve(
  __dirname,
  '../../free-claude-code/.venv/Scripts/fcc-server.exe'
);

// FCC HERMES 執行檔路徑（相對於這個 wrapper 的位置）
const FCC_HERMES = process.env.FCC_HERMES || path.resolve(
  __dirname,
  '../../free-claude-code/.venv/Scripts/fcc-hermes.exe'
);
const AGENT_TIMEOUT = 300000; // 5 分鐘

// ─── 工具函數 ──────────────────────────────────────────────────────────────

function resolveFccServer() {
  // 優先使用環境變數，其次嘗試本機執行檔
  if (process.env.FCC_SERVER_URL) return process.env.FCC_SERVER_URL;

  // 尋找 fcc-server.exe；找到時回傳本機伺服器 URL（預設 port 8082）
  const candidates = [
    FCC_CLI,
    path.join(process.env.APPDATA || '', 'FreeClaudeCode', 'fcc-server.exe'),
    '/usr/local/bin/fcc-server',
    path.join(process.env.HOME || '', '.local', 'bin', 'fcc-server'),
  ];

  for (const c of candidates) {
    try {
      const { accessSync } = fs;
      const { F_OK } = fs.constants;
      accessSync(c, F_OK);
      return FCC_SERVER_DEFAULT; // 本機執行檔存在時，對應本機伺服器
    } catch {
      // 繼續尋找
    }
  }

  return FCC_SERVER_DEFAULT;
}

// ─── 認證 ───────────────────────────────────────────────────────────────────
// FCC 伺服器啟用了 proxy auth（~/.fcc/.env 的 PROXY_AUTH_ENABLED=true），
// 所有 /v1/* 端點都需要 Bearer token。
// token 解析順序：--token 參數 > FCC_PROXY_TOKEN > ~/.fcc/.env 的 ANTHROPIC_AUTH_TOKEN > 'freecc'
function resolveFccToken(argv = process.argv.slice(2)) {
  const idx = argv.indexOf('--token');
  if (idx >= 0 && argv[idx + 1]) return argv[idx + 1];

  if (process.env.FCC_PROXY_TOKEN) return process.env.FCC_PROXY_TOKEN;

  try {
    const envPath = path.join(process.env.HOME || process.env.USERPROFILE || '', '.fcc', '.env');
    const raw = fs.readFileSync(envPath, 'utf8');
    const m = raw.match(/^ANTHROPIC_AUTH_TOKEN=(.*)$/m);
    if (m && m[1].trim()) return m[1].trim();
  } catch {
    // 檔案不存在時使用預設值
  }

  return 'freecc'; // FCC Settings.proxy_auth_token 的預設值
}

function fccHeaders(extra = {}) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${resolveFccToken()}`,
    ...extra,
  };
}

function runFccCommand(args, opts = {}) {
  return new Promise((resolve, reject) => {
    // FCC CLI is an executable (or node script). Spawn it directly.
    const child = spawn(FCC_CLI, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, FCC_SERVER_URL: resolveFccServer() },
      ...opts,
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => { stdout += data; });
    child.stderr.on('data', (data) => { stderr += data; });

    child.on('error', (err) => reject(err));
    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr, code });
      } else {
        reject(new Error(`fcc-server exited with code ${code}: ${stderr}`));
      }
    });

    // 超時
    setTimeout(() => {
      if (!child.killed) {
        child.kill('SIGTERM');
        reject(new Error('fcc-server 執行超時'));
      }
    }, AGENT_TIMEOUT);
  });
}

// ─── 代理執行（專用）───
// FCC 的代理能力透過 /v1/messages（Anthropic Messages 相容）提供；
// 另有 Code Sessions（僅支援 codex harness）。
// 本 wrapper 預設走 HTTP；--local 時才 spawn 在地 fcc-hermes.exe。
async function runAgentCommand(agent, task, opts = {}) {
  const argv = process.argv.slice(2);
  const forceLocal = argv.includes('--local');

  if (!forceLocal) {
    console.log(`🔄 派遣 ${agent} 執行任務（FCC HTTP）...`);
    const res = await fetch(`${resolveFccServer()}/v1/messages`, {
      method: 'POST',
      headers: fccHeaders({ 'anthropic-version': '2023-06-01' }),
      body: JSON.stringify({
        model: process.env.FCC_AGENT_MODEL || 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [{ role: 'user', content: task || '分析代碼結構' }],
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(`agent 呼叫失敗 (HTTP ${res.status}): ${data?.error?.message || res.statusText}`);
    }
    const text = Array.isArray(data?.content)
      ? data.content.filter((b) => b?.type === 'text').map((b) => b.text || '').join('')
      : JSON.stringify(data);
    return { stdout: text || '(空回應)', stderr: '', code: 0 };
  }

  // ─── 在地 agent 模式（--local）───
  let agentExecutable = FCC_CLI;

  // Hermes 特化：指派 fcc-hermes.exe 作為執行檔
  if (agent === 'hermes' || agent === 'hermes-cli') {
    const hermesPath = FCC_HERMES;
    try {
      const { accessSync } = fs;
      const { F_OK } = fs.constants;
      accessSync(hermesPath, F_OK);
      console.log(`🔧 使用本地 Hermes: ${hermesPath}`);
      agentExecutable = hermesPath;
    } catch (err) {
      throw new Error(`找不到 fcc-hermes.exe: ${hermesPath}`);
    }
  }

  return new Promise((resolve, reject) => {
    // Hermes CLI 的一次性提示詞用法為 `-z <prompt>`（非 --task）
    const child = spawn(agentExecutable, ['-z', task || '分析代碼結構'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, FCC_SERVER_URL: resolveFccServer() },
      ...opts,
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => { stdout += data; });
    child.stderr.on('data', (data) => { stderr += data; });

    child.on('error', (err) => reject(err));
    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr, code });
      } else {
        reject(new Error(`agent ${agent} 執行失敗 (code ${code}): ${stderr}`));
      }
    });

    // 超時
    setTimeout(() => {
      if (!child.killed) {
        child.kill('SIGTERM');
        reject(new Error('agent 執行超時'));
      }
    }, AGENT_TIMEOUT);
  });
}

// ─── 主入口 ────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
esggo ↔ free-claude-code 整合入口

用法:
  node fcc-wrapper.js --model <模型名> --prompt "<提示詞>"
  node fcc-wrapper.js --agent <代理名> --task "<任務描述>"
  node fcc-wrapper.js --status
  node fcc-wrapper.js --help

選項:
  --model <名>     指定模型 (如 gpt-4o, claude-sonnet-4)
  --prompt <文字>  提示詞 (可用於模型呼叫)
  --agent <名>     指定 coding agent (claude, codex, hermes, opencode...)
  --task <文字>    任務描述 (用於代理呼叫)
  --local           搭配 --agent：強制使用本地執行檔 (fcc-hermes.exe)
  --status         檢查 free-claude-code 連線狀態
  --help           顯示此幫助

環境變數:
  FCC_SERVER_URL   free-claude-code 伺服器位址 (預設: http://127.0.0.1:8082)
  FCC_CLI          fcc-server 執行檔路徑
  FCC_PROXY_TOKEN  Bearer token (次選：~/.fcc/.env 的 ANTHROPIC_AUTH_TOKEN)
  FCC_AGENT_MODEL  代理呼叫使用的模型 (預設 claude-sonnet-4-20250514)

端點:
  模型列表  /v1/models        (需 Bearer)
  模型列表  /admin/api/models (免 auth)
  模型呼叫  /v1/messages      (Anthropic Messages 格式，需 Bearer)

範例:
  node fcc-wrapper.js --model claude-sonnet-4-20250514 --prompt "寫一段 Python 函式"
  node fcc-wrapper.js --agent hermes --task "分析這段程式碼的 bug"
  node fcc-wrapper.js --agent hermes --task "分析 bug" --local
`);
    process.exit(0);
  }

  // ─── 狀態檢查 ────────────────────────────────────────────────────────
  if (args.includes('--status')) {
    try {
      const res = await fetch(`${resolveFccServer()}/health`);
      if (res.ok) {
        const data = await res.json();
        console.log('✅ free-claude-code 連線正常');
        console.log(`   服務位址: ${resolveFccServer()}`);
        console.log(`   版本: ${data.version || 'unknown'}`);
      } else {
        console.log('⚠️  free-claude-code 連線失敗');
        console.log(`   HTTP 狀態: ${res.status}`);
      }
    } catch (err) {
      console.log('❌ free-claude-code 未執行或連線失敗');
      console.log(`   錯誤: ${err.message}`);
      console.log(`   請先啟動: fcc-server`);
    }
    process.exit(0);
  }

  // ─── 模型呼叫 ────────────────────────────────────────────────────────
  if (args.includes('--model')) {
    const idx = args.indexOf('--model');
    const model = args[idx + 1];
    const promptIdx = args.indexOf('--prompt');
    const prompt = promptIdx >= 0 ? args[promptIdx + 1] : '';

    if (!model) {
      console.error('❌ 請指定 --model');
      process.exit(1);
    }

    try {
      // FCC 提供 Anthropic Messages 相容端點 /v1/messages（非 OpenAI /v1/chat/completions）
      const res = await fetch(`${resolveFccServer()}/v1/messages`, {
        method: 'POST',
        headers: fccHeaders({ 'anthropic-version': '2023-06-01' }),
        body: JSON.stringify({
          model,
          max_tokens: 2048,
          messages: [{ role: 'user', content: prompt || '請幫我寫一段程式碼' }],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error(`❌ 模型呼叫失敗 (HTTP ${res.status}):`);
        console.error(data?.error?.message || JSON.stringify(data));
        process.exit(1);
      }

      const text = Array.isArray(data?.content)
        ? data.content
            .filter((b) => b?.type === 'text')
            .map((b) => b.text || '')
            .join('')
        : '';
      console.log('✅ 模型回應:');
      console.log(text || '(空回應)');
      console.log(`   model=${data?.model || model}  usage=${JSON.stringify(data?.usage || {})}`);
    } catch (err) {
      console.error('❌ 模型呼叫失敗:', err.message);
      process.exit(1);
    }
    process.exit(0);
  }

  // ─── 模型列表 ────────────────────────────────────────────────────────
  if (args.includes('--list-models')) {
    try {
      const res = await fetch(`${resolveFccServer()}/v1/models`, { headers: fccHeaders() });
      if (res.ok) {
        const data = await res.json();
        const models = data?.data || [];
        console.log(`✅ 可用模型列表 (${models.length} 個):`);
        models.forEach((m, i) => {
          console.log(`${i + 1}. ${m.id}`);
          console.log(`   提供者: ${m.provider || 'unknown'}`);
        });
      } else {
        console.log('⚠️  無法取得模型列表');
        console.log(`   HTTP 狀態: ${res.status}`);
      }
    } catch (err) {
      console.error('❌ 獲取模型列表失敗:', err.message);
      process.exit(1);
    }
    process.exit(0);
  }

  // ─── 代理呼叫 ────────────────────────────────────────────────────────
  if (args.includes('--agent')) {
    const idx = args.indexOf('--agent');
    const agent = args[idx + 1];
    const taskIdx = args.indexOf('--task');
    const task = taskIdx >= 0 ? args[taskIdx + 1] : '';

    if (!agent) {
      console.error('❌ 請指定 --agent');
      process.exit(1);
    }

    console.log(`🔄 派遣 ${agent} 執行任務...`);
    try {
      const result = await runAgentCommand(agent, task);
      console.log('✅ 代理執行完成');
      console.log(result.stdout.slice(0, 4000));
      if (result.stderr) console.error(result.stderr);
    } catch (err) {
      console.error('❌ 代理執行失敗:', err.message);
      process.exit(1);
    }
    process.exit(0);
  }

  // ─── 缺少參數 ────────────────────────────────────────────────────────
  console.error('❌ 未知或缺少參數');
  console.error('   請使用 --help 查看使用方式');
  process.exit(1);
}

main().catch((err) => {
  console.error('❌ 整合入口發生錯誤:', err);
  process.exit(1);
});
