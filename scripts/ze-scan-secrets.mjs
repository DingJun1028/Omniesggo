#!/usr/bin/env node
// ze scan-secrets — 金鑰掃描
import { execSync } from 'node:child_process';
const root = process.cwd();
console.log('🔐 金鑰掃描');
const patterns = ['TOKEN', 'SECRET', 'PASSWORD', 'API_KEY', 'PRIVATE_KEY'];
let found = false;
for (const p of patterns) {
  try {
    const out = execSync(`grep -ri "${p}" --include="*.ts" --include="*.mjs" --include="*.tsx" --include="*.env*" -l . 2>$null`, { cwd: root, stdio: 'pipe' }).toString();
    const files = out.split('\n').filter((l) => l.trim() && !l.includes('node_modules') && !l.includes('.next'));
    if (files.length) { found = true; console.log(`  ⚠️  ${p}: ${files.join(', ')}`); }
  } catch {}
}
if (!found) console.log('  ✅ 未發現疑似金鑰洩漏');
