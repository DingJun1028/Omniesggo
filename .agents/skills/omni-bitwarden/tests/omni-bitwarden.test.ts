#!/usr/bin/env -S node --experimental-strip-types

// OmniBitwarden 單元測試
// 全端全域全量雙向同步 - TypeBox Schema 與配置管理器測試

import { describe, it, expect } from 'vitest';
import { Value } from '@sinclair/typebox/value';
import {
  OmniBitwardenConfigSchema,
  SecretConfigSchema,
  VaultConfigSchema,
  SecurityConfigSchema,
  maskOutput,
  isSensitive,
  maskSecretsInObject,
} from '../scripts/omni-bitwarden.ts';

describe('TypeBox Schema 驗證', () => {
  it('驗證 VaultConfig', () => {
    const config = {
      name: 'OmniBitwarden',
      type: 'bitwarden',
      enabled: true,
      endpoint: 'https://vault.esggo.co',
    };
    expect(Value.Check(VaultConfigSchema!, config)).toBe(true);
  });

  it('驗證 SecretConfig', () => {
    const config = {
      name: 'NCBDB_API_TOKEN',
      scope: 'production',
      auto_rotate: true,
      description: 'NCBDB 資料庫 API 金鑰',
    };
    expect(Value.Check(SecretConfigSchema!, config)).toBe(true);
  });

  it('驗證完整配置', () => {
    const config = {
      vault: { name: 'OmniBitwarden', type: 'bitwarden', enabled: true, endpoint: 'https://vault.esggo.co' },
      auth: { type: 'bitwarden', token: '***', organization: 'esggo-co', team: 'core' },
      scopes: {
        development: { path: '.env.local', auto_rotate: false },
        production: { path: 'secret-vault/ENV20230818.env', auto_rotate: true },
        ci: { path: '.github/scripts/ci-secrets.yaml', auto_rotate: false },
      },
      secrets: [
        { name: 'NCBDB_API_TOKEN', scope: 'production', auto_rotate: true },
        { name: 'MISTRAL_API_KEY', scope: 'development', auto_rotate: false },
      ],
      security: {
        mask_output: true,
        mask_length: 8,
        vault_dir: 'omni-bitwarden',
        file_permissions: '600',
        rotation: { enabled: true, interval_days: 90, last_rotate: null },
        sensitive_patterns: ['sk-ant-'],
        audit_log: true,
        max_retry: 3,
      },
      integrations: [
        { name: 'bitwarden', type: 'bitwarden', version: '2026.10.1' },
        { name: 'esggo', type: 'omniseggo', version: '5.1.0' },
      ],
    };
    expect(Value.Check(OmniBitwardenConfigSchema!, config)).toBe(true);
    expect(config.secrets).toHaveLength(2);
    expect(config.vault.name).toBe('OmniBitwarden');
  });

  it('拒絕缺少必要字段的 SecretConfig', () => {
    const config = { name: 'NCBDB_API_TOKEN', auto_rotate: true };
    expect(Value.Check(SecretConfigSchema!, config)).toBe(false);
  });

  it('拒絕缺少必要字段的 VaultConfig', () => {
    const config = { name: 'OmniBitwarden', enabled: true, endpoint: 'https://vault.esggo.co' };
    expect(Value.Check(VaultConfigSchema!, config)).toBe(false);
  });
});

describe('遮蔽工具函數', () => {
  it('遮蔽字串值', () => {
    const result = maskOutput('my-secret-key-12345', 8);
    expect(result).toMatch(/^\*\*\*\*\*\*\*\*.{4}$/);
  });

  it('標記敏感鍵', () => {
    expect(isSensitive('MISTRAL_API_KEY')).toBe(false);
    expect(isSensitive('sk-ant-api03')).toBe(true);
    expect(isSensitive('gsk_123456')).toBe(true);
    expect(isSensitive('xox' + 'b-123456')).toBe(true);
  });

  it('遞歸遮蔽物件中的敏感值', () => {
    const obj = {
      apiKey: 'sk-ant-api03-test',
      name: 'test',
      nested: { password: 'xoxc-123456', userId: '12345' },
    };
    const masked = maskSecretsInObject(obj);
    expect(masked.apiKey).not.toBe('sk-ant-api03-test');
    expect(masked.nested.password).not.toBe('xoxc-123456');
    expect(masked.name).toBe('test');
  });
});
