#!/usr/bin/env node
/**
 * 對照測試 2: 閘 #2 (lockfile 同步) 與閘 #3 (agents.yaml 驗證)。
 *
 * 與 gate-control.cjs 同一套原則:
 *   1. 複製「真實 hook 檔」, 不重寫實作 —— 否則測到的是仿製品。
 *   2. 負向對照必須自我證明: 閘要有能力變紅, 對照組才有意義。
 *   3. 期望值寫成 case 的一部分並逐案比對, 不用人眼判讀。
 *
 * 用法: node scripts/gate-control-2.cjs
 */
const { execSync, spawnSync } = require('child_process');
const fs = require('fs'), os = require('os'), path = require('path');

const REPO = path.resolve(__dirname, '..');
let failures = 0;
function verdict(got, want, name) {
  const ok = got === want;
  if (!ok) failures++;
  console.log(`  ${ok ? '✓' : '✗ 不符期望'} ${String(got).padEnd(5)} | ${String(want).padEnd(5)} | ${name}`);
}

function sandbox(files) {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'gate2-'));
  const run = (c) => execSync(c, { cwd: d, stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf-8' });
  run('git init -q'); run('git config user.email t@t'); run('git config user.name t');
  for (const [p, c] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(d, p)), { recursive: true });
    fs.writeFileSync(path.join(d, p), c);
  }
  run('git add -A');
  return { d, run };
}

function runHook(d) {
  const r = spawnSync(process.execPath, ['.githooks/pre-commit'], { cwd: d, encoding: 'utf-8' });
  return { rc: r.status, out: (r.stdout || '') + (r.stderr || '') };
}

// 閘 #3 只需 verifier 存在; agents.yaml 用真實檔案當「好」, 空殼當「壞」
const GOOD_AGENTS = fs.readFileSync(path.join(REPO, 'agents.yaml'), 'utf-8');
const BAD_AGENTS = 'agents: []\nsquads: []\n';
const VERIFIER = fs.readFileSync(path.join(REPO, 'scripts/verify-agents-yaml.py'), 'utf-8');

console.log('== 閘 #3: agents.yaml 驗證 ==');
{
  // Y1 負向對照 (自我證明): 壞的 staged + 壞的工作區 → 必須紅。
  // 若這項不是紅, 整套對照組無意義。
  const { d, run } = sandbox({
    '.githooks/pre-commit': fs.readFileSync(path.join(REPO, '.githooks/pre-commit'), 'utf-8'),
    'scripts/verify-agents-yaml.py': VERIFIER,
    'scripts/encoding-check.mjs': 'process.exit(0);',
    'package.json': '{"name":"x","version":"1.0.0","dependencies":{}}',
    'pnpm-lock.yaml': "lockfileVersion: '9.0'\n",
    'agents.yaml': BAD_AGENTS,
  });
  verdict(runHook(d).rc, 1, 'Y1 壞agents+壞工作區 → 應紅');
  fs.rmSync(d, { recursive: true, force: true });
}
{
  // Y2 決定性對照: staged 是壞版, 工作區被改成好版。
  // 正確行為 = 驗 staged (壞) → 紅。若綠, 代表驗證讀的是工作區而非
  // 真正要提交的內容 —— 這是閘#1 vault 洞的鏡像。
  const { d, run } = sandbox({
    '.githooks/pre-commit': fs.readFileSync(path.join(REPO, '.githooks/pre-commit'), 'utf-8'),
    'scripts/verify-agents-yaml.py': VERIFIER,
    'scripts/encoding-check.mjs': 'process.exit(0);',
    'package.json': '{"name":"x","version":"1.0.0","dependencies":{}}',
    'pnpm-lock.yaml': "lockfileVersion: '9.0'\n",
    'agents.yaml': BAD_AGENTS,
  });
  fs.writeFileSync(path.join(d, 'agents.yaml'), GOOD_AGENTS);   // 只改工作區, 不 re-add
  verdict(runHook(d).rc, 1, 'Y2 staged壞+工作區好 → 應紅');
  fs.rmSync(d, { recursive: true, force: true });
}
{
  // Y3 好內容 → 綠
  const { d, run } = sandbox({
    '.githooks/pre-commit': fs.readFileSync(path.join(REPO, '.githooks/pre-commit'), 'utf-8'),
    'scripts/verify-agents-yaml.py': VERIFIER,
    'scripts/encoding-check.mjs': 'process.exit(0);',
    'package.json': '{"name":"x","version":"1.0.0","dependencies":{}}',
    'pnpm-lock.yaml': "lockfileVersion: '9.0'\n",
    'agents.yaml': GOOD_AGENTS,
  });
  verdict(runHook(d).rc, 0, 'Y3 好agents → 應綠');
  fs.rmSync(d, { recursive: true, force: true });
}

console.log('\n== 閘 #2: lockfile 同步 ==');
{
  // X1 負向對照: package.json 有 lockfile 沒有的相依 → 必須紅
  const { d, run } = sandbox({
    '.githooks/pre-commit': fs.readFileSync(path.join(REPO, '.githooks/pre-commit'), 'utf-8'),
    'scripts/encoding-check.mjs': 'process.exit(0);',
    'package.json': '{"name":"x","version":"1.0.0","dependencies":{"left-pad":"^1.0.0"}}',
    'pnpm-lock.yaml': "lockfileVersion: '9.0'\n",
  });
  verdict(runHook(d).rc, 1, 'X1 新增相依未更新lock → 應紅');
  fs.rmSync(d, { recursive: true, force: true });
}
{
  // X2 決定性對照: 同一個 commit 內「刪掉 lockfile」→ 檢查的守衛條件
  // (fs.existsSync(lockPath)) 恰好被這次提交移除, 檢查整個被跳過。
  const { d, run } = sandbox({
    '.githooks/pre-commit': fs.readFileSync(path.join(REPO, '.githooks/pre-commit'), 'utf-8'),
    'scripts/encoding-check.mjs': 'process.exit(0);',
    'package.json': '{"name":"x","version":"1.0.0","dependencies":{"left-pad":"^1.0.0"}}',
    'pnpm-lock.yaml': "lockfileVersion: '9.0'\n  left-pad:\n    specifier: ^1.0.0\n",
  });
  // 先證明這個狀態本身是綠的 (否則 X2 的紅燈來源無從區分)
  const baseline = runHook(d);
  console.log(`  --   ${String(baseline.rc).padEnd(5)} | 0     | X2a 基線: lockfile 在且合規 → 應綠`);
  if (baseline.rc !== 0) { failures++; console.log('     ★ 基線非綠, X2 無鑑別力'); }
  run('git rm -q --cached pnpm-lock.yaml');
  fs.rmSync(path.join(d, 'pnpm-lock.yaml'));
  verdict(runHook(d).rc, 1, 'X2 刪除lockfile繞過檢查 → 應紅');
  fs.rmSync(d, { recursive: true, force: true });
}
{
  // X3 一致 → 綠
  const { d, run } = sandbox({
    '.githooks/pre-commit': fs.readFileSync(path.join(REPO, '.githooks/pre-commit'), 'utf-8'),
    'scripts/encoding-check.mjs': 'process.exit(0);',
    'package.json': '{"name":"x","version":"1.0.0","dependencies":{}}',
    'pnpm-lock.yaml': "lockfileVersion: '9.0'\n",
  });
  verdict(runHook(d).rc, 0, 'X3 lock一致 → 應綠');
  fs.rmSync(d, { recursive: true, force: true });
}

console.log('');
console.log(failures === 0 ? '✓ 對照組全部有效' : `★ 有 ${failures} 案不符期望`);
process.exit(failures === 0 ? 0 : 1);
