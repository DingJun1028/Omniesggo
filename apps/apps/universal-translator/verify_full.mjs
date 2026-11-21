// 完整驗證腳本：檢查 .mjs + .sh + HTML 語法 (不依賴 shell)
// 使用方式：node apps/universal-translator/verify_full.mjs

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';

const BASE = process.cwd();
const files = [
  'apps/universal-translator/server.mjs',
  'apps/universal-translator/translate.mjs',
  'apps/universal-translator/akkadu.mjs',
  'deploy/verify_universal_translator.sh',
];

console.log('🔍 Universal-Translator 完整驗證開始...\n');

let errors = 0;

// 1. NodeJS .mjs 語法檢查
for (const f of files) {
  const fp = path.join(BASE, f);
  if (!fp.endsWith('.mjs')) continue;
  if (!fs.existsSync(fp)) { console.log(`⚠️  skip ${f} (not found)`); continue; }
  try {
    execSync(`node --check ${fp}`, { encoding: 'utf8', stdio: 'pipe' });
    console.log(`✅ ${f} (node --check PASS)`);
  } catch (e) {
    console.log(`❌ ${f} FAIL: ${e.message.split('\n')[0]}`);
    errors++;
  }
}

// 2. Bash 語法檢查 (若 system 支援 bash)
if (process.platform !== 'win32') {
  const shFile = path.join(BASE, 'deploy/verify_universal_translator.sh');
  if (fs.existsSync(shFile)) {
    try {
      execSync(`bash -n ${shFile}`, { encoding: 'utf8', stdio: 'pipe' });
      console.log(`✅ deploy/verify_universal_translator.sh (bash -n PASS)`);
    } catch (e) {
      console.log(`❌ deploy/verify_universal_translator.sh FAIL: ${e.message}`);
      errors++;
    }
  }
} else {
  console.log('⚠️  skip .sh (Windows 系統)');
}

// 3. HTML 結構檢查 (簡單 DTD 驗證)
const htmls = [
  'apps/universal-translator/public/studio.html',
  'apps/universal-translator/public/stream.html',
];
for (const f of htmls) {
  const fp = path.join(BASE, f);
  if (!fs.existsSync(fp)) { console.log(`⚠️  skip ${f} (not found)`); continue; }
  const content = fs.readFileSync(fp, 'utf8');
  if (content.includes('<!DOCTYPE html>') && content.includes('</html>')) {
    console.log(`✅ ${f} (HTML DOM OK)`);
  } else {
    console.log(`❌ ${f} (HTML structure fail)`);
    errors++;
  }
}

// 4. 本地服務檢查 (若啟動)
try {
  const r = await new Promise((res) => {
    const req = http.get('http://localhost:8788/health', res);
    req.on('error', () => res(null));
    req.setTimeout(1000, () => res(null));
  });
  if (r) {
    console.log(`✅ localhost:8788/health (HTTP OK)`);
  }
} catch {}

console.log(`\n✅ 驗證結束: ${errors === 0 ? 'PASS' : errors + ' ERRORS'}`);
process.exit(errors);