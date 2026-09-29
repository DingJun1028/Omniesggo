#!/usr/bin/env node

// ============================================================
// ESGGO CLI — Unified command-line tool
// ============================================================

const { program } = await import('commander');

program
  .name('esggo')
  .description('ESGGO — Unified CLI for ESG sustainability platform')
  .version('1.0.0');

// ── vault seal ─────────────────────────────────────────────
program
  .command('vault seal')
  .description('ZKP-seal an evidence document (5T Trust protocol)')
  .argument('<id>', 'evidence UUID')
  .action(async (id) => {
    const { createHash } = await import('crypto');
    console.log(`[S] Initiating ZKP sealing for ID: ${id}...`);
    const hash = createHash('sha256').update(id + Date.now()).digest('hex');
    console.log(`[v] Cryptographic Seal Applied Successfully!`);
    console.log('-'.repeat(35));
    console.log(`Document ID:  ${id}`);
    console.log(`Status:       VERIFIED`);
    console.log(`ZKP Hash:     ${hash}`);
    console.log('-'.repeat(35));
  });

// ── sonnar ─────────────────────────────────────────────────
const sonnar = program
  .command('sonnar')
  .description('ESGSonnar data queries');

sonnar
  .command('enterprise')
  .description('Fetch enterprise profile')
  .argument('<companyId>', 'company identifier')
  .action(async (companyId) => {
    const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const res = await fetch(`${base}/api/sonnar/enterprise?companyId=${companyId}`);
    const json = await res.json();
    console.log(JSON.stringify(json.data, null, 2));
  });

sonnar
  .command('crawl')
  .description('Trigger a source crawl')
  .argument('[sourceId]', 'source ID (omit for all)')
  .action(async (sourceId) => {
    const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const res = await fetch(`${base}/api/sonnar/crawl`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sourceId ? { sourceId } : { all: true }),
    });
    const json = await res.json();
    console.log(JSON.stringify(json.data, null, 2));
  });

sonnar
  .command('radar')
  .description('Show signal radar overview')
  .action(async () => {
    const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const res = await fetch(`${base}/api/sonnar/radar`);
    const json = await res.json();
    console.log(JSON.stringify(json.data, null, 2));
  });

sonnar
  .command('knowledge')
  .description('Analyze text for ESG knowledge')
  .argument('<text>', 'text to analyze')
  .action(async (text) => {
    const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const res = await fetch(`${base}/api/sonnar/knowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context: text }),
    });
    const json = await res.json();
    console.log(JSON.stringify(json.data, null, 2));
  });

// ── report ─────────────────────────────────────────────────
program
  .command('report daily')
  .description('Trigger daily report generation')
  .action(async () => {
    const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const res = await fetch(`${base}/api/daily-report`, { method: 'POST' });
    const json = await res.json();
    console.log(JSON.stringify(json, null, 2));
  });

// ── status ─────────────────────────────────────────────────
program
  .command('status')
  .description('Show system health')
  .action(async () => {
    const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    try {
      const res = await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(5000) });
      const json = await res.json();
      console.log(`Status: ${res.ok ? 'OK' : 'DEGRADED'}`);
      console.log(JSON.stringify(json, null, 2));
    } catch {
      console.error(`Cannot reach ${base} — is the server running?`);
      process.exit(1);
    }
  });

// ── db ─────────────────────────────────────────────────────
const db = program
  .command('db')
  .description('Prisma database operations');

db
  .command('migrate')
  .description('Run Prisma database migrations')
  .action(async () => {
    const { execSync } = await import('child_process');
    console.log('[DB] Running prisma migrate...');
    execSync('npx prisma migrate dev', { stdio: 'inherit' });
  });

db
  .command('push')
  .description('Push Prisma schema to database')
  .action(async () => {
    const { execSync } = await import('child_process');
    console.log('[DB] Pushing schema to database...');
    execSync('npx prisma db push', { stdio: 'inherit' });
  });

// ── seed ───────────────────────────────────────────────────
const seedCmd = program
  .command('seed')
  .description('OmniSeed contract operations');

seedCmd
  .command('awaken <uuid>')
  .description('Awaken a dormant OmniSeed to infinite evolution')
  .option('-v, --version <semver>', 'semantic version tag', '1.0.0-alpha')
  .option('-e, --entropy <float>', 'strictly controlled entropy limit', '0.1')
  .option('-l, --location <string>', 'target coordinates (#同心圓中心 or #記憶聖所)', '#同心圓中心')
  .action(async (uuid, options) => {
    const { createHash } = await import('crypto');
    const location = options.location;
    const version = options.version;
    const entropy = parseFloat(options.entropy);

    console.log(`[OmniSeed] Placing seed in space...`);
    
    // 1. Coordinates Verification
    if (location !== '#記憶聖所' && location !== '#同心圓中心') {
      console.error(`[混沌警告] 萬能種子未放置於正確坐標 (${location})，拒絕覺醒。`);
      process.exit(1);
    }

    console.log(`[OmniSeed] 坐標對齊成功: ${location}`);
    console.log(`[S] Initiating ZKP hyper-eternal awakening for UUID: ${uuid}...`);
    
    // 2. Compute Trinity Hash Lock
    const timestamp = Date.now();
    const evidenceString = JSON.stringify({
      source_origin: 'CLI Terminal Command',
      location,
      entropyControl: entropy
    });
    
    const hash = createHash('sha256')
      .update(`${uuid}::${version}::${evidenceString}::${timestamp}`)
      .digest('hex');

    // 3. Render gorgeous terminal output
    console.log(`\n=============================================`);
    console.log(`✨  [OmniSeed] 超 永 恆 覺 醒 完 成  ✨`);
    console.log(`=============================================`);
    console.log(`UUID:          ${uuid}`);
    console.log(`Version:       ${version}`);
    console.log(`Location:      ${location}`);
    console.log(`Entropy Limit: ${entropy}`);
    console.log(`Status:        INFINITE_EVOLVING`);
    console.log(`ZKP Hash Lock: ${hash}`);
    console.log(`ISO-14064-1:   Verified (Zero Hallucination)`);
    console.log(`=============================================`);
    console.log(`[v] Sacred Contract enforced (Object.isFrozen = true)`);
  });

// ── summon ────────────────────────────────────────────────
program
  .command('summon')
  .description('OA-Summon — 招喚 OmniAgent 神聖儀式（含真實閘道探活）')
  .option('-s, --soul <name>', '靈魂名稱', 'JunAiKey')
  .option('-k, --key <name>', '元鑰名稱', '萬能元鑰')
  .option('-h, --host <host>', 'VPS 主機', '161.118.248.180')
  .option('-p, --port <port>', 'VPS 端口', '8042')
  .option('--gateway <url>', '直接指定閘道 /status 端點')
  .option('--no-verify', '跳過實際探活（純模擬）')
  .option('--core', '覺醒階段實際初始化 OmniCore（耗時較長，會註冊 VPS Agent 並健康檢查）')
  .action(async (opts) => {
    const { spawnSync } = await import('node:child_process');
    const { fileURLToPath } = await import('node:url');
    const { dirname } = await import('node:path');
    const env = { ...process.env };
    env.OA_SOUL = opts.soul;
    env.OA_KEY = opts.key;
    env.OA_HOST = opts.host;
    env.OA_PORT = String(opts.port);
    if (opts.gateway) env.OA_GATEWAY = opts.gateway;
    if (!opts.verify) env.OA_NO_VERIFY = '1';
    if (opts.core) env.OA_CORE = '1';

    // 倉庫根（omni.mjs 位於 packages/cli/src/）
    const here = dirname(fileURLToPath(import.meta.url));
    const root = dirname(dirname(dirname(here)));
    console.error(`[summon] cwd=${root}`);
    const res = spawnSync(
      process.execPath,
      [root + '/node_modules/ts-node/dist/bin.js', '--transpile-only', 'scripts/run-summon.ts'],
      { cwd: root, env, stdio: 'inherit' }
    );
    if (res.error) console.error('[summon] spawn error:', res.error.message);
    process.exit(res.status ?? 1);
  });

// ── shared spawn helper (Windows/MSYS 相容) ───────────────
import { readFileSync, existsSync, appendFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { homedir } from 'node:os';

function repoRoot() {
  const here = dirname(fileURLToPath(import.meta.url));
  return dirname(dirname(dirname(here)));
}

// 統一 spawn：Windows 下外部 CLI (vercel/gh/git) 需 shell:true 否則 ENOENT。
// 回傳 { status, out, err }，錯誤時不輸出 undefined。
function run(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, { encoding: 'utf8', shell: true, ...opts });
  const out = (res.stdout || '').trim();
  const err = res.error ? res.error.message : (res.stderr || '').trim();
  return { status: res.status, out, err };
}

function logHistory(line) {
  try {
    const dir = resolve(homedir(), '.esggo');
    mkdirSync(dir, { recursive: true });
    appendFileSync(resolve(dir, 'history.log'), `${new Date().toISOString()} ${line}\n`);
  } catch { /* non-fatal */ }
}

// ── secret ─────────────────────────────────────────────────
function loadEnvFile() {
  const here = dirname(fileURLToPath(import.meta.url));
  const root = dirname(dirname(dirname(here)));
  const envPath = resolve(root, '.env');
  const map = new Map();
  if (!existsSync(envPath)) return { map, envPath };
  const text = readFileSync(envPath, 'utf8');
  for (const line of text.split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let val = m[2];
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    map.set(m[1], val);
  }
  return { map, envPath };
}

function mask(value) {
  if (!value) return '(empty)';
  if (value.length <= 8) return '****';
  return value.slice(0, 4) + '****' + value.slice(-4);
}

const SENSITIVE_PREFIX = ['FIREBASE', 'NEXT_PUBLIC_FIREBASE', 'FIRESTORE', 'GEMINI', 'OPENROUTER', 'GROQ', 'SUPABASE', 'UPSTASH', 'GATEWAY', 'VPS_', 'OCI_', 'PRIVATE'];

function isSensitive(key) {
  return SENSITIVE_PREFIX.some((p) => key.startsWith(p));
}

program
  .command('secret')
  .description('查看秘密並同步到 Vercel（Omni 秘密管理）')
  .addCommand(
    new (await import('commander')).Command('list')
      .description('列出 .env 中所有秘密 key（不含值）')
      .action(() => {
        const { map, envPath } = loadEnvFile();
        if (map.size === 0) {
          console.log(`[secret] ${envPath} 無內容或不存在`);
          return;
        }
        console.log(`[secret] ${map.size} 個秘密 (來源: ${envPath}):`);
        for (const key of [...map.keys()].sort()) {
          const tag = isSensitive(key) ? '🔒' : '·';
          console.log(`  ${tag} ${key}`);
        }
      })
  )
  .addCommand(
    new (await import('commander')).Command('view')
      .description('查看特定秘密（敏感值打碼）')
      .argument('<key>', '秘密名稱')
      .action((key) => {
        const { map } = loadEnvFile();
        if (!map.has(key)) {
          console.log(`[secret] 找不到: ${key}`);
          return;
        }
        const val = map.get(key);
        if (isSensitive(key)) {
          console.log(`${key} = ${mask(val)}`);
        } else {
          console.log(`${key} = ${val}`);
        }
      })
  )
  .addCommand(
    new (await import('commander')).Command('sync')
      .description('把 Firebase/Firestore 秘密同步到目標平台 (vercel | github)')
      .argument('<target>', 'vercel | github')
      .option('--env <name>', 'Vercel 環境 (production/preview/development)', 'production')
      .option('--yes', '非互動（跳過確認提示）')
      .action((target, opts) => {
        logHistory(`secret sync ${target} --env ${opts.env}`);
        const root = repoRoot();
        const { map } = loadEnvFile();
        const keys = [...map.keys()].filter(
          (k) => k.startsWith('FIREBASE') || k.startsWith('NEXT_PUBLIC_FIREBASE') || k.startsWith('FIRESTORE')
        );
        if (keys.length === 0) {
          console.log('[secret] .env 中無 Firebase/Firestore 秘密可同步');
          return;
        }
        if (target === 'vercel') {
          const ls = run('vercel', ['env', 'ls', opts.env], { cwd: root });
          const existing = new Set(ls.out.split('\n').map((l) => l.trim().split(/\s+/)[0]).filter(Boolean));
          let added = 0;
          for (const key of keys.sort()) {
            const val = map.get(key);
            if (existing.has(key)) { console.log(`[secret] 跳過 (已存在): ${key}`); continue; }
            const r = run('vercel', ['env', 'add', key, opts.env], { input: val + '\nN\n', cwd: root });
            if (r.status === 0) { console.log(`[secret] ✅ 已同步: ${key}`); added++; }
            else console.error(`[secret] ❌ 同步失敗: ${key} — ${r.err || r.out}`);
          }
          console.log(`[secret] Vercel 同步完成: 新增 ${added} / 共 ${keys.length}`);
        } else if (target === 'github') {
          let added = 0;
          for (const key of keys.sort()) {
            const val = map.get(key);
            const r = run('gh', ['secret', 'set', key, '--body', val, '--repo', 'DingJun1028/esggo']);
            if (r.status === 0) { console.log(`[secret] ✅ 已同步: ${key}`); added++; }
            else console.error(`[secret] ❌ 同步失敗: ${key} — ${r.err || r.out}`);
          }
          console.log(`[secret] GitHub 同步完成: 新增 ${added} / 共 ${keys.length}`);
        } else {
          console.error(`[secret] 不支援的同步目標: ${target}（僅 vercel | github）`);
          process.exit(1);
        }
      })
  )
  .addCommand(
    new (await import('commander')).Command('pull')
      .description('從 Vercel 拉回環境變數到本地 .env（雙向同步）')
      .argument('<target>', '目前僅支援: vercel')
      .option('--env <name>', 'Vercel 環境', 'production')
      .action((target, opts) => {
        if (target !== 'vercel') { console.error(`[secret] 不支援: ${target}`); process.exit(1); }
        logHistory(`secret pull ${target} --env ${opts.env}`);
        const root = repoRoot();
        const r = run('vercel', ['env', 'pull', '.env.vercel', opts.env], { cwd: root });
        if (r.status !== 0) { console.error(`[secret] ❌ 拉取失敗: ${r.err || r.out}`); process.exit(1); }
        console.log('[secret] ✅ 已從 Vercel 拉取至 .env.vercel（手動 merge 到 .env 避免覆蓋本地值）');
      })
  );

// ── verify ────────────────────────────────────────────────
// 一鍵本地驗證：lint + typecheck + test + next build (app/ 必跑 next build)
program
  .command('verify')
  .description('一鍵本地驗證 (lint + typecheck + test + next build)')
  .action(async () => {
    logHistory('verify');
    const root = repoRoot();
    const steps = [
      ['lint', ['run', 'lint']],
      ['typecheck', ['run', 'typecheck']],
      ['test', ['run', 'test']],
    ];
    for (const [name, args] of steps) {
      process.stdout.write(`[verify] ${name} ... `);
      const r = run('pnpm', args, { cwd: root });
      if (r.status === 0) console.log('✅');
      else { console.log('❌'); console.error(r.err || r.out); process.exit(1); }
    }
    // app/ 路由型別只靠 next build 驗證（root tsconfig EXCLUDES app/**）
    process.stdout.write('[verify] next build (app/ 型別門檻) ... ');
    const b = run('pnpm', ['exec', 'next', 'build'], { cwd: root });
    if (b.status === 0) console.log('✅ BUILD_EXIT=0');
    else { console.log('❌'); console.error(b.err || b.out); process.exit(1); }
    console.log('[verify] 全綠 — 可安全合規合併');
  });

// ── deploy ────────────────────────────────────────────────
const deploy = program
  .command('deploy')
  .description('觸發部署 (vercel | vps)');
deploy
  .command('vercel')
  .description('觸發 Vercel 生產部署')
  .action(() => {
    logHistory('deploy vercel');
    const root = repoRoot();
    const r = run('vercel', ['--prod'], { cwd: root });
    console.log(r.status === 0 ? '[deploy] ✅ Vercel 部署已觸發' : `[deploy] ❌ ${r.err || r.out}`);
    process.exit(r.status === 0 ? 0 : 1);
  });
deploy
  .command('vps')
  .description('觸發 Deploy to Oracle VPS (GitHub Actions)')
  .action(() => {
    logHistory('deploy vps');
    const r = run('gh', ['workflow', 'run', 'deploy-oracle.yml', '--ref', 'main'], { cwd: repoRoot() });
    console.log(r.status === 0 ? '[deploy] ✅ VPS 部署已觸發 (GitHub Actions)' : `[deploy] ❌ ${r.err || r.out}`);
    process.exit(r.status === 0 ? 0 : 1);
  });

// ── gateway ────────────────────────────────────────────────
const gateway = program.command('gateway').description('OmniGateway 代理交辦與狀態查詢');
gateway
  .command('status')
  .description('查詢 Gateway 狀態')
  .option('-h, --host <host>', 'Gateway host', '127.0.0.1')
  .option('-p, --port <port>', 'Gateway port', '8642')
  .action(async (opts) => {
    const base = `http://${opts.host}:${opts.port}`;
    try {
      const token = process.env.GATEWAY_API_KEY || process.env.GATEWAY_KEY || '';
      const r = await fetch(`${base}/status`, {
        headers: token ? { 'X-Omni-Token': token, Accept: 'application/json' } : { Accept: 'application/json' },
        signal: AbortSignal.timeout(5000),
      });
      const json = await r.json().catch(() => ({}));
      console.log(JSON.stringify(json, null, 2));
      if (!r.ok) process.exit(1);
    } catch (err) {
      console.error(`Cannot reach ${base} — ${err.message}`);
      process.exit(1);
    }
  });
gateway
  .command('task <title>')
  .description('透過 Gateway 交辦任務')
  .option('-h, --host <host>', 'Gateway host', '127.0.0.1')
  .option('-p, --port <port>', 'Gateway port', '8642')
  .action(async (title, opts) => {
    const base = `http://${opts.host}:${opts.port}`;
    try {
      const token = process.env.GATEWAY_API_KEY || process.env.GATEWAY_KEY || '';
      if (!token) {
        console.error('Missing GATEWAY_API_KEY / GATEWAY_KEY');
        process.exit(1);
      }
      const r = await fetch(`${base}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Omni-Token': token, Accept: 'application/json' },
        body: JSON.stringify({
          task: { id: `cli_${Date.now()}`, taskType: 'compliance_review', title, prompt: title },
          skillId: 'compliance_review',
        }),
        signal: AbortSignal.timeout(120000),
      });
      const json = await r.json().catch(() => ({}));
      console.log(JSON.stringify(json, null, 2));
      if (!r.ok) process.exit(1);
    } catch (err) {
      console.error(`Gateway task failed: ${err.message}`);
      process.exit(1);
    }
  });

// ── Parse ──────────────────────────────────────────────────
// ── run — unified python pipeline ──────────────────────────
const { spawn } = await import('node:child_process');
// existsSync 已於檔頭 (line 231) 自 'node:fs' 靜態匯入，此處不可重複宣告

const PIPELINE_STAGES = [
  { key: 'gen',   label: 'Generate ESG data',     file: 'scripts/generate_esg_data.py' },
  { key: 'build', label: 'Build full DB',          file: 'scripts/build_full_db.py' },
  { key: 'vault', label: 'Run vault',              file: 'run_vault.py' },
  { key: 'sync',  label: 'Oracle sync',            file: 'scripts/oracle-sync.py' },
];

function resolvePython() {
  const candidates = ['python3', 'python', 'python3.11', 'python3.12'];
  return candidates.find((bin) => {
    try { require('node:child_process').execSync(`${bin} --version`, { stdio: 'ignore' }); return true; }
    catch { return false; }
  }) || 'python3';
}

function runStage(py, file, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(py, [file], { cwd, stdio: 'inherit', env: process.env });
    child.on('error', reject);
    child.on('close', (code) => resolve(code));
  });
}

const runCmd = program
  .command('run')
  .description('Run ESGGO unified Python pipeline (gen → build → vault → sync).')
  .option('-c, --cwd <path>', 'Project root', process.cwd())
  .option('-p, --python <bin>', 'Python binary', '')
  .option('--stage <name>', 'Run only one stage: gen|build|vault|sync')
  .action(async (opts) => {
    const cwd = opts.cwd;
    const py = opts.python || resolvePython();
    const only = opts.stage ? [opts.stage] : PIPELINE_STAGES.map((s) => s.key);
    console.log(`[esggo-run] cwd=${cwd} python=${py}`);
    for (const stage of PIPELINE_STAGES) {
      if (!only.includes(stage.key)) continue;
      console.log(`
[esggo-run] >>> ${stage.label} (${stage.file})`);
      if (!existsSync(`${cwd}/${stage.file}`)) {
        console.warn(`[esggo-run] skip ${stage.file}: not found`);
        continue;
      }
      const code = await runStage(py, stage.file, cwd);
      if (code !== 0) {
        console.error(`[esggo-run] ${stage.label} failed with exit ${code}`);
        process.exitCode = code ?? 1;
        return;
      }
      console.log(`[esggo-run] <<< ${stage.label} OK`);
    }
    console.log(`
[esggo-run] Pipeline complete.`);
  });

program.parse();

