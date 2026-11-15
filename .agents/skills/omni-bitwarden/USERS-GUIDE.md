# OmniBitwarden 使用者說明書

> 萬能金庫系統（OmniBitwarden）是一套融合 Bitwarden 的通用憑證存取與安全金鑰管理系統，專為 Omniesggo 設計。
> 本說明書提供完整的安裝、配置、使用與維護指南。

---

## 📋 目錄

1. [系統概述](#1-系統概述)
2. [安裝指南](#2-安裝指南)
3. [配置指南](#3-配置指南)
4. [常用操作指南](#4-常用操作指南)
5. [安全注意事項](#5-安全注意事項)
6. [故障排除](#6-故障排除)
7. [最新狀態](#7-最新狀態)

---

## 1. 系統概述

### 1.1 什麼是 OmniBitwarden？

**OmniBitwarden** 是一套融合 Bitwarden 的通用憑證存取與安全金鑰管理系統，專為 Omniesggo 設計。

它提供了：
- ✅ **統一存取介面**：透過 `omni_get_secret()` 函數存取所有金鑰
- ✅ **多層架構**：L0 JunAikey → L1 OmniKey → L2 OmniMasterKey → L3 SUMMON_LAYERS → L4 已部署代理
- ✅ **多種存放位置**：本地開發 `.env.local`、生產環境 `secret-vault/`、万能金庫 `omni-bitwarden/`
- ✅ **安全原則**：絕不硬編碼、Masked 輸出、權限控制、出口清理
- ✅ **自動輪替**：90 天輪替高風險金鑰
- ✅ **TypeBox Schema**：型別安全的配置驗證
- ✅ **Bitwarden 集成**：支援 Bitwarden CLI 存取與同步

### 1.2 系統架構

```
┌─────────────────────────────────────────┐
│ L0 JunAikey 成長層                       │
│   • 每個開發者有專屬金鑰                  │
│   • 個人徽章 / 短徽章                      │
└─────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────┐
│ L1 OmniKey 憑證權威                      │
│   • 統一金鑰命名空間                      │
│   • 自動輪替規則                          │
└─────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────┐
│ L2 OmniMasterKey 統一憑證存取            │
│   • omni_get_secret() 函數                │
│   • 環境變數 / 機密聖櫃 / 万能金庫       │
│     三層備援                            │
└─────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────┐
│ L3 SUMMON_LAYERS                        │
│   • 動態載入金鑰                          │
│   • 環境變數注入                          │
└─────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────┐
│ L4 已部署代理                            │
│   • 部署後自動載入                        │
│   • 企業級金鑰管理                        │
└─────────────────────────────────────────┘
```

### 1.3 存放位置選擇

| 類型 | 存放位置 | 是否版本控制 | 適用場景 |
|------|----------|--------------|----------|
| 本機開發 | `.env.local` | ✅ 已忽略 | 開發環境 |
| 生產環境 | `secret-vault/ENV20230818.env` | ❌ 本機 Only | 生產部署 |
| 万能金庫 | `omni-bitwarden/` (Bitwarden 集成) | ❌ 本機 Only | 統一憑證管理 |
| 臨時憑證 | OneTimeSecret（人對人分享） | ❌ 臨時鏈接 | 臨時密碼 |

---

## 2. 安裝指南

### 2.1 前置條件

- Node.js 18+ 或 20+ 或 ≥22
- pnpm 或 npm
- Bitwarden CLI（選用）
- Git（用於版本控制）

### 2.2 步驟 1：克隆專案

```bash
git clone https://github.com/DingJun1028/Omniesggo.git
cd Omniesggo
```

### 2.3 步驟 2：安裝依賴

```bash
# 使用 pnpm
pnpm install

# 或使用 npm
npm install
```

### 2.4 步驟 3：初始化万能金庫

```bash
# 創建万能金庫目錄
mkdir -p omni-bitwarden

# 複製配置模板
cp .agents/skills/omni-bitwarden/configs/omni-bitwarden.example.yaml \
   omni-bitwarden/config.yaml
```

### 2.5 步驟 4：安裝 TypeScript 依賴

```bash
cd .agents/skills/omni-bitwarden/scripts
pnpm install || npm install
```

### 2.6 步驟 5：設定環境變數

```bash
# 在 .env.local 中添加
echo "OMNIBITWARDEN_ENABLED=true" >> .env.local
echo "OMNIBITWARDEN_CONFIG=omni-bitwarden/config.yaml" >> .env.local
```

### 2.7 步驟 6：驗證安裝

```bash
# 執行驗證腳本
cd .agents/skills/omni-bitwarden/scripts
npx tsx verify-omni-bitwarden.ts
```

---

## 3. 配置指南

### 3.1 配置檔案結構

```yaml
# omni-bitwarden/config.yaml

vault:                    # 金鑰管理系統配置
  enabled: true
  type: bitwarden
  endpoint: https://vault.esggo.co
  token: ${OMNIBITWARDEN_TOKEN}

scopes:                   # 環境範圍配置
  development:
    path: .env.local
    auto_rotate: false
  production:
    path: secret-vault/ENV20230818.env
    auto_rotate: true
  ci:
    path: .github/scripts/ci-secrets.yaml
    auto_rotate: false

secrets:                  # 金鑰列表
  - name: NCBDB_API_TOKEN
    scope: production
    auto_rotate: true

security:                 # 安全配置
  mask_output: true
  mask_length: 8
  vault_dir: omni-bitwarden
  file_permissions: "600"
  rotation:
    enabled: true
    interval_days: 90
    last_rotate: null
  sensitive_patterns:     # 敏感模式
    - "sk-ant-"
    - "gsk_"
    - "mstrl_"
    - "xoxb-"

integrations:             # 整合配置
  - name: bitwarden
    type: bitwarden
    version: 2026.10.1
```

### 3.2 環境變數

| 變數名稱 | 範例值 | 說明 | 必填 |
|----------|--------|------|------|
| `OMNIBITWARDEN_ENABLED` | `true` | 啟用万能金庫 | 是 |
| `OMNIBITWARDEN_CONFIG` | `omni-bitwarden/config.yaml` | 配置檔案路徑 | 是 |
| `OMNIBITWARDEN_TOKEN` | `***MASKED***` | 金鑰管理系統 Token | 是 |

### 3.3 機密聖櫃配置

`secret-vault/ENV20230818.env` 應包含：

```bash
# 機密金鑰
NCBDB_API_TOKEN=***MASKED***
MISTRAL_API_KEY=***MASKED***
GROQ_API_KEY=***MASKED***
OMNIMASTER_KEY=***MASKED***
CONDUIT_PASSWORD=***MASKED***
JWT_SECRET=***MASKED***
REFRESH_TOKEN_SECRET=***MASKED***
```

**檔案權限**：
```bash
chmod 600 secret-vault/ENV20230818.env
chmod 700 secret-vault/
```

---

## 4. 常用操作指南

### 4.1 驗證系統狀態

```bash
cd .agents/skills/omni-bitwarden/scripts
npx tsx omni-bitwarden.ts verify
```

輸出範例：
```
=== OmniBitwarden 系統驗證 (TypeScript 完整版) ===

✅ NCBDB_API_TOKEN
   來源: production
   自動輪替: 是

✅ MISTRAL_API_KEY
   來源: development
   自動輪替: 否

❌ GROQ_API_KEY
   狀態: 遮蔽

...
```

### 4.2 更新金鑰值

```bash
# 更新金鑰值並綁定到万能金庫
npx tsx omni-bitwarden.ts update NCBDB_API_TOKEN

# 指定範圍
npx tsx omni-bitwarden.ts update MISTRAL_API_KEY development
```

### 4.3 輪替金鑰

```bash
# 輪替金鑰
npx tsx omni-bitwarden.ts rotate MISTRAL_API_KEY

# 指定範圍
npx tsx omni-bitwarden.ts rotate GROQ_API_KEY development
```

輪替流程：
```
1. 已遮蔽舊金鑰值
2. 重新產生新金鑰值
3. 更新秘密聖櫃 (***MASKED***)
4. 通知相關服務
5. 完成輪替，請手動驗證連線
```

### 4.4 向 Bitwarden 同步

```bash
npx tsx omni-bitwarden.ts sync
```

同步流程：
```
1. 讀取秘密聖櫃
2. 驗證金鑰
3. 上傳到 Bitwarden 倉庫
4. 建立版本記錄
```

### 4.5 查詢金鑰

```python
# Python 統一存取
from omni_master_key import omni_get_secret

# 查詢金鑰
result = omni_get_secret("GITHUB_TOKEN")
if result["found"]:
    os.environ["GITHUB_TOKEN"] = result["value"]
    print(f"來源: {result['source']}")
```

### 4.6 增加金鑰到万能金庫

```python
from omni_master_key import omni_add_secret

result = omni_add_secret(
    key="NEW_API_KEY",
    value="***MASKED***",
    vault_type="bitwarden",
    scope="production",
    auto_rotate=True
)
```

---

## 5. 安全注意事項

### 5.1 核心原則

```
❌ 絕不硬編碼：任何 API 金鑰、密碼、機密資料均不得寫入程式碼
❌ 不輸出真實值：對話過程中任何機密值都必須遮罩（***MASKED***）
✅ 環境變數：本地開發使用 .env.local（已 .gitignore 忽略）
✅ 機密聖櫃：生產環境使用 secret-vault/ 目錄
✅ 万能金庫：統一存取介面，透過 omni_get_secret() 函數存取
✅ MASKED 輸出：所有憑證查詢結果均以 ***MASKED*** 顯示
✅ 權限控制：secret-vault/ 目錄權限 600，僅所有者可讀寫
✅ 出口清理：程式結束時清理環境變數中的機密值
```

### 5.2 金鑰輪替

- 高風險金鑰每 **90 天**輪替一次
- 輪替金鑰時，記得同時更新：
  - 秘密聖櫃（`secret-vault/ENV20230818.env`）
  - 万能金庫配置（`omni-bitwarden/config.yaml`）
  - 相關服務配置

### 5.3 檔案權限

```bash
# 機密聖櫃檔案
chmod 600 secret-vault/ENV20230818.env

# 機密目錄
chmod 700 secret-vault/

# 万能金庫目錄
chmod 700 omni-bitwarden/
```

### 5.4 敏感模式檢測

系統會自動遮罩以下敏感模式：
- `sk-ant-`（OpenAI 密鑰）
- `gsk_`（Groq 密鑰）
- `mstrl_`（Mistral 密鑰）
- `xoxb-`（Slack Bot Token）
- `xoxa-`（Slack User Token）
- `xoxc-`（Slack Legacy Token）
- `xoxd-`（Slack DevToken）
- `keybase-`（Keybase Token）
- `hf_`（Hugging Face Token）
- `ghp_`（GitHub Personal Access Token）
- `gho_`（GitHub OAuth Token）
- `github_pat_`（GitHub PAT）

---

## 6. 故障排除

### 6.1 無法驗證金鑰

**問題**：`verify` 命令顯示金鑰為遮罩或不存在。

**解決步驟**：
1. 確認 `secret-vault/ENV20230818.env` 存在
2. 確認檔案權限為 `600`
3. 確認金鑰名稱拼寫正確
4. 確認 `OMNIBITWARDEN_ENABLED=true` 已設置

### 6.2 環境變數未載入

**問題**：`omni_get_secret()` 返回 `not found`。

**解決步驟**：
1. 確認 `.env.local` 中已設置 `OMNIBITWARDEN_ENABLED=true`
2. 重新載入環境變數（重啟終端機）
3. 確認 `OMNIBITWARDEN_CONFIG` 路徑正確

### 6.3 配置文件解析錯誤

**問題**：`npx tsx omni-bitwarden.ts verify` 報錯。

**解決步驟**：
1. 確認 `config.yaml` 格式正確
2. 確認 YAML 縮排無誤
3. 確認所有必填欄位已填寫
4. 檢查敏感模式是否包含特殊字元

### 6.4 權限被拒絕

**問題**：讀寫 `secret-vault/ENV20230818.env` 失敗。

**解決步驟**：
```bash
chmod 600 secret-vault/ENV20230818.env
chmod 700 secret-vault/
```

---

## 7. 最新狀態

| 項目 | 狀態 | 備註 |
|------|------|------|
| 技能文件 | ✅ 已完成 | `.agents/skills/omni-bitwarden/SKILL.md` |
| 使用者說明書 | ✅ 已完成 | 本文件 |
| 配置範本 | ✅ 已完成 | `omni-bitwarden.example.yaml` |
| 驗證腳本 | ✅ 已完成 | `verify-omni-bitwarden.ts` |
| 更新腳本 | ✅ 已完成 | `omni-bitwarden-update.ts` |
| 整合腳本 | ✅ 已完成 | `omni-bitwarden.ts` |
| 單元測試 | ✅ 已完成 | `tests/omni-bitwarden.test.ts` |
| 目錄結構 | ✅ 已完成 | 完整的檔案結構 |

### 目錄結構

```
omni-bitwarden/
├── SKILL.md                       # 技能文件
├── README.md                      # 說明文件
├── config.yaml                    # 配置文件
├── configs/
│   └── omni-bitwarden.example.yaml # 配置模板
├── scripts/
│   ├── omni-bitwarden.ts          # 主程式 (TypeScript)
│   ├── verify-omni-bitwarden.ts   # 驗證腳本
│   └── omni-bitwarden-update.ts   # 更新腳本
├── tests/
│   └── omni-bitwarden.test.ts     # 單元測試
├── templates/
│   └── config.template.yaml       # 配置模板
└── OMN-PRD-001-OMNI-BITWARDEN-TRACEABILITY.md # 追蹤文件
```

---

## 📖 引用文件

| 文件 | 說明 |
|------|------|
| `omni_master_key.py` | 統一憑證存取函數 |
| `verify_omni_master_key.py` | 機密驗證腳本 |
| `global-rule.md` | 憲章安全原則 |
| `OMNISKILL_BOOK.md` | 技能書索引 |
| `references/ENV20230818-template.md` | ENV20230818.pdf 環境變數模板結構 |

---

## 🌐 參考資源

| 專案名稱 | 倉庫地址 | 說明 |
|----------|----------|------|
| **Bitwarden Server** | [DingJun1028/server](https://github.com/DingJun1028/server) | Bitwarden 後端基礎設施 |
| **Bitwarden Clients** | [DingJun1028/clients](https://github.com/DingJun1028/clients) | Bitwarden 客戶端應用 |
| **Passwordless Node.js** | [DingJun1028/passwordless-nodejs](https://github.com/DingJun1028/passwordless-nodejs) | 無密碼認證 SDK |

---

## ⚠️ 最後提醒

> **絕不硬編碼**：任何 API 金鑰、密碼、機密資料均不得寫入程式碼<br>
> **MASKED 輸出**：所有查詢結果均以 `***MASKED***` 顯示<br>
> **權限控制**：`secret-vault/` 目錄權限 600，僅所有者可讀寫<br>
> **出口清理**：程式結束時清理環境變數中的機密值