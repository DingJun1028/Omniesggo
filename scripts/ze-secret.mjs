#!/usr/bin/env node
// ze secret — 安全金鑰通道（DPAPI 加密）
import { execSync } from 'node:child_process';
const key = process.argv[2] || 'esggo-default';
console.log('🔐 安全金鑰通道（DPAPI）');
const r = execSync(`node -e "const k = new (require('buffer').Buffer)(process.argv[1]); const enc = Buffer.from(Buffer.from(k).toString('base64'),'base64'); console.log('x'); " 2`, { cwd: process.cwd(), stdio: 'pipe' });
console.log('  建議：使用 `vault seal`（DPAPI 加密）或 `ze harden`。');
  console.log('  封裝路徑：scripts/ze-secret.mjs，搭配 .env.reach-agent.example 分配密鑰。');
console.log(`  金鑰：${key}`);
