#!/usr/bin/env -S node --experimental-strip-types

// OmniBitwarden - 更新腳本 (TypeScript 完整版)
// 全端全域全量雙向同步 - 更新金鑰值並同步到萬能金庫

import { OmniBitwardenConfigManager } from './omni-bitwarden.ts';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== OmniBitwarden 更新系統 (TypeScript 完整版) ===\n');

const args = process.argv.slice(2);
const command = args[0];
const keyName = args[2];
const scope = args[4] || 'production';

switch (command) {
  case 'update':
    if (!keyName) {
      console.log('用法: ts omni-bitwarden-update.ts update <金鑰名> [scope]');
      console.log('示例: ts omni-bitwarden-update.ts update NCBDB_API_TOKEN');
      process.exit(1);
    }

    const manager = new OmniBitwardenConfigManager();
    manager.updateSecret(keyName, '***MASKED***', scope);
    break;

  case 'rotate':
    if (!keyName) {
      console.log('用法: ts omni-bitwarden-update.ts rotate <金鑰名> [scope]');
      process.log('示例: ts omni-bitwarden-update.ts rotate NCBDB_API_TOKEN');
      process.exit(1);
    }

    const rotManager = new OmniBitwardenConfigManager();
    rotManager.rotateKey(keyName, scope);
    break;

  case 'sync':
    const syncManager = new OmniBitwardenConfigManager();
    syncManager.syncWithBitwarden();
    break;

  default:
    console.log('命令：');
    console.log('  update <key>    - 更新金鑰值');
    console.log('  rotate <key>    - 輪替金鑰');
    console.log('  sync            - 同步到 Bitwarden');
    console.log('');
    console.log('示例:');
    console.log('  ts omni-bitwarden-update.ts update NCBDB_API_TOKEN');
    console.log('  ts omni-bitwarden-update.ts rotate MISTRAL_API_KEY');
    process.exit(1);
}
