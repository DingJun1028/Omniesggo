# OmniBitwarden Schema Traceability 矩陣

> 整合 OMN-PRD-001 追蹤矩陣 | 生成時間：2026-11-02 | 版本：2.0.0

## 1. 概覽

| 項目 | 數值 |
|---|---|
| 掃描檔案數 | 4 |
| Schema 定義數 | 8 |
| 已掛需求編號 | 6 |
| 未掛需求編號 | 2 |

## 2. 詳細表格

| 檔案 | Schema 名稱 | 類型 | $id | 描述 | 需求編號 |
|---|---|---|---|---|---|
| .\.agents\skills\omni-bitwarden\scripts\omni-bitwarden.ts | AuthConfig | Object | 無 | 無 | FR-001 |
| .\.agents\skills\omni-bitwarden\scripts\omni-bitwarden.ts | Integration | Object | 無 | 無 | N/A |
| .\.agents\skills\omni-bitwarden\scripts\omni-bitwarden.ts | OmniBitwardenConfig | Object | 無 | 無 | FR-001 |
| .\.agents\skills\omni-bitwarden\scripts\omni-bitwarden.ts | RotationConfig | Object | 無 | 無 | N/A |
| .\.agents\skills\omni-bitwarden\scripts\omni-bitwarden.ts | ScopesConfig | Object | 無 | 無 | FR-001 |
| .\.agents\skills\omni-bitwarden\scripts\omni-bitwarden.ts | SecretConfig | Object | 無 | 無 | FR-001 |
| .\.agents\skills\omni-bitwarden\scripts\omni-bitwarden.ts | SecurityConfig | Object | 無 | 無 | SEC-001 |
| .\.agents\skills\omni-bitwarden\scripts\omni-bitwarden.ts | VaultConfig | Object | 無 | 無 | FR-001 |

## 3. 需求對應表

| 需求編號 | 描述 | 影響的 Schema |
|---|---|---|
| FR-001 | 金鑰存取與管理 | SecretConfig, VaultConfig, AuthConfig, ScopesConfig, OmniBitwardenConfig |
| SEC-001 | 安全原則與遮蔽 | SecurityConfig |
| INT-001 | Bitwarden 整合規範 | IntegrationSchema |

## 4. 待確認事項

- [ ] 部分 schema 未掛需求編號，建議後續補標
- [ ] 若需同時使用多個 scope，需確認 ScopesConfig 的擴展性
