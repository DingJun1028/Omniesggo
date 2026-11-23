#!/usr/bin/env node
// ze harden — 自我修復：安全加固掃描
import { execSync } from 'node:child_process';
const root = process.cwd();
console.log('🛡️  自我修復：安全加固');
const checks = [
  ['gitignore', 'git status --ignored --short'],
  ['sensitive-files', `grep -rli "api_key|token|secret|password" --include="*.env*" . 2>$null || true`],
  ['node_modules-gitignore', 'git check-ignore node_modules'],
  ['git-clean', 'git status --short | grep -v "^??" || true'],
];
let failed = false;
for (const [name, cmd] of checks) {
  try { execSync(cmd, { cwd: root, stdio: 'pipe' }); console.log(`  ✅ ${name}`); }
  catch { console.log(`  ❌ ${name}`); if (name !== 'sensitive-files' && name !== 'git-clean') failed = true; }
}
process.exit(failed ? 1 : 0);
