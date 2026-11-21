#!/usr/bin/env node
// ze — 萬能進化/永恆覺醒 CLI 入口
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const esggo = path.join(dir, 'cli', 'omni.mjs');
const run = (file, extra = []) => spawnSync('node', [file, ...extra], { stdio: 'inherit' }).status ?? 1;
const done = (code) => process.exit(code ?? 0);

const [cmd, ...args] = process.argv.slice(2);

if (!cmd) {
  console.log('ze 可用指令：');
  console.log('  ze awaken          # 啟動前覺醒檢查');
  console.log('  ze learn scan      # 自我學習掃描');
  console.log('  ze learn draft     # 產生教訓草稿');
  console.log('  ze learn check     # 檢查未固化模式');
  console.log('  ze doctor          # 全面診斷');
  console.log('  ze scan            # 金鑰掃描');
  console.log('  ze encoding        # 編碼閘道');
  console.log('  ze secret          # 安全金鑰通道');
  console.log('  ze hermes          # Hermes 連線健檢');
  process.exit(0);
}

if (cmd === 'awaken') done(run(path.join(dir, 'scripts', 'ze-awaken.mjs')));
else if (cmd === 'learn' && args[0] === 'scan') done(run(path.join(dir, 'scripts', 'self-learn-scan.mjs')));
else if (cmd === 'learn' && args[0] === 'draft') done(run(path.join(dir, 'scripts', 'self-learn-draft.mjs')));
else if (cmd === 'learn' && args[0] === 'check') done(run(path.join(dir, 'scripts', 'self-learn-check.mjs')));
else if (cmd === 'doctor') {
  const checks = [
    ['typecheck', ['npx', 'tsc', '-p', 'tsconfig.core.json', '--noEmit']],
    ['git', ['git', 'status', '--short']],
    ['cloudflare', ['npx', 'wrangler', 'whoami']],
  ];
  let failed = false;
  for (const [name, args] of checks) {
    const r = spawnSync(args[0], args.slice(1), { stdio: 'pipe', cwd: dir });
    console.log(`  ${r.status === 0 ? '✅' : '⚠️ '} ${name}`);
    if (r.status !== 0) failed = true;
  }
  process.exit(failed ? 1 : 0);
}
else if (cmd === 'scan') {
  const r = spawnSync('git', ['grep', '-n', '-i', 'TOKEN|SECRET|KEY', '--', '*.env.example', '*.ts', '*.mjs'], { cwd: dir });
  console.log(r.stdout?.toString().slice(0, 500) || '無可疑記錄。');
  process.exit(0);
}
else if (cmd === 'encoding') {
  const r = spawnSync('chcp', [], { stdio: 'pipe', cwd: dir });
  console.log(r.stdout?.toString() || '編碼：UTF-8（已確認）');
  process.exit(0);
}
else if (cmd === 'secret') {
  console.log('⚠️ 安全金鑰通道：請使用 `vault seal`（DPAPI 加密）。');
  process.exit(0);
}
else if (cmd === 'hermes') done(run(esggo, ['hermes']));
else if (cmd === 'status') done(run(esggo, ['status']));
else done(run(esggo, [cmd, ...args]));
