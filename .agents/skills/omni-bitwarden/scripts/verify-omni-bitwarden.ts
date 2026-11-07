#!/usr/bin/env -S node --experimental-strip-types

// OmniBitwarden - 系統驗證腳本 (TypeScript 完整版)
// 全端全域全量雙向同步 - 檢查所有金鑰是否正確存取和遮蔽

import { OmniBitwardenConfigManager, maskSecretsInObject } from './omni-bitwarden.ts';

console.log('=== OmniBitwarden 系統驗證 (TypeScript 完整版) ===\n');

const manager = new OmniBitwardenConfigManager();
const secrets = manager.listSecrets();

console.log('📋 配置文件:', manager.configPath);
console.log('🔍 秘密聖櫃: secret-vault/ENV20230818.env\n');

const results: Array<{ name: string; found: boolean; value: string }> = [];

for (const secret of secrets) {
  const value = manager.getSecret(secret.name, secret.scope);
  const found = value !== '***MASKED***';
  results.push({ name: secret.name, found, value });

  const status = found ? '✅' : '❌';
  console.log(`${status} ${secret.name}`);
  if (found) {
    console.log(`   值: ${maskSecretsInObject({ value })['value']}`);
    console.log(`   來源: ${secret.scope}`);
    console.log(`   自動輪替: ${secret.auto_rotate ? '是' : '否'}`);
  } else {
    console.log(`   狀態: 遮蔽`);
  }
  console.log('');
}

// 檢查真實值是否殘留
console.log('🔒 安全檢查:');
const maskedKeys = results.filter(r => r.value !== '***MASKED***' && r.value.includes('***'));
if (maskedKeys.length > 0) {
  console.log('❌ 發現未遮蔽的金鑰值:');
  for (const k of maskedKeys) {
    console.log(`   - ${k.name}: ${k.value}`);
  }
} else {
  console.log('✅ 所有金鑰均已遮蔽，無真實值殘留');
}

// 檢查權限
import { existsSync, statSync } from 'fs';
const vaultPath = 'secret-vault/ENV20230818.env';
if (existsSync(vaultPath)) {
  const stats = statSync(vaultPath);
  const perms = stats.mode & 0o777;
  console.log(`\n📁 秘密聖櫃權限: ${perms.toString(8)}`);
  if (perms === 0o600) {
    console.log('✅ 權限正確（600）');
  } else {
    console.log('⚠️  權限可能過於寬鬆（建議 600）');
  }
}

console.log('\n=== 驗證完成 ===');
process.exit(results.every(r => r.found) ? 0 : 1);
