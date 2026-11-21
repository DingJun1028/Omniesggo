#!/usr/bin/env node
/**
 * SonarQube 整合本地煙測（免費算立版，不需 SONAR_TOKEN）
 * 驗證：sonar-project.properties 格式正確 + package.json 含 3 個 sonar:* scripts
 * 實際 agentic 分析需 SONAR_TOKEN + SonarCloud org（vars.SONAR_ENABLED=true）。
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

let ok = true;
const fail = (m) => { console.error('✗ ' + m); ok = false; };
const pass = (m) => console.log('✓ ' + m);

// 1. sonar-project.properties 存在且含必要欄位
const propsPath = resolve(root, 'sonar-project.properties');
if (!existsSync(propsPath)) fail('sonar-project.properties 缺失');
else {
  const props = readFileSync(propsPath, 'utf8');
  const required = ['sonar.projectKey', 'sonar.organization', 'sonar.sources'];
  for (const k of required) {
    if (!props.includes(k + '=')) fail(`sonar-project.properties 缺 ${k}`);
    else pass(`sonar-project.properties 含 ${k}`);
  }
}

// 2. package.json 含 3 個 sonar scripts（UT 子專案，即本目錄）
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const need = ['sonar:analyze', 'sonar:issues', 'sonar:remediate'];
for (const s of need) {
  if (!pkg.scripts?.[s]) fail(`package.json 缺 scripts.${s}`);
  else pass(`package.json scripts.${s} = ${pkg.scripts[s]}`);
}

// 3. SONAR_AGENTIC.md 文件存在
if (existsSync(resolve(root, 'SONAR_AGENTIC.md'))) pass('SONAR_AGENTIC.md 存在');
else fail('SONAR_AGENTIC.md 缺失');

console.log(ok ? '\n✅ SonarQube 整合工件驗收通過（本地免費版）' : '\n❌ SonarQube 整合工件有缺漏');
process.exit(ok ? 0 : 1);
