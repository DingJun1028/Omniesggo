---
title: 萬能金庫系統（OmniBitwarden）
name: omni-bitwarden
description: 萬能金庫系統（OmniBitwarden）— 融合 Bitwarden 的通用憑證存取與安全金鑰管理，適用於 Omniesggo 專案。支援自動輪替、多層架構、環境隔離與全端雙向同步。
category: secret-handling
version: 2.0.0
author: Hermes Agent
license: AGPL-3.0
platforms: [windows, linux, macos]
metadata:
  hermes:
    tags: [secret-handling, environment, api-keys, vault, bitwarden, credential-management]
    category: security
    related_skills: [credential-handling, omni-master-key, omniskill-book, global-rule]
---

# 🌐 萬能金庫系統（OmniBitwarden）

> 萬能金庫系統（OmniBitwarden）是一套融合 Bitwarden 的通用憑證存取與安全金鑰管理系統，專為 Omniesggo 設計。
> 提供統一的憑證存取介面，支援多種金鑰類型、環境隔離、安全輪替與驗證。

---

## 📋 前置條件

1. 確認要處理的密碼是否已存在於 `secret-vault/` 中
2. 確認是否需要新增新的 API key 或更新現有金鑰
3. 確認操作不會寫入版本控制（使用 .gitignore 忽略的檔案）

---

## 🔄 流程

### 步驟 1：確認密碼屬性
- 判斷密碼類型：API Key、DB 密碼、OAuth Token、SSH Key
- 判斷存取範圍：開發環境、測試環境、生產環境
- 判斷存取方式：統一存取介面、環境變數、機密聖櫃

### 步驟 2：選擇存放位置
| 類型 | 存放位置 | 是否版本控制 |
|------|----------|------------|
| 本機開發 | `.env.local` | ✅ 已忽略 |
| 生產環境 | `secret-vault/ENV20230818.env` | ❌ 本機 Only |
| 萬能金庫 | `omni-bitwarden/` (Bitwarden 集成) | ❌ 本機 Only |
| 臨時憑證 | OneTimeSecret（人對人分享） | ❌ 臨時鏈接 |

### 步驟 3：檔案權限設定
```bash
# 機密聖櫃檔案權限
chmod 600 secret-vault/ENV20230818.env

# 機密目錄權限
chmod 700 secret-vault/

# 萬能金庫目錄權限
chmod 700 omni-bitwarden/
```

### 步驟 4：統一存取介面
```python
# Python 統一存取
from omni_master_key import omni_get_secret, omni_add_secret

# 查詢金鑰
result = omni_get_secret("GITHUB_TOKEN")
if result["found"]:
    os.environ["GITHUB_TOKEN"] = result["value"]  # 僅在進程內非遮蔽
    print(f"Source: {result['source']}")  # 輸出來源，不輸出值

# 增加金鑰到萬能金庫
result = omni_add_secret(
    key="GITHUB_TOKEN",
    value="***MASKED***",
    vault_type="bitwarden",
    scope="production",
    auto_rotate=True
)
```

---

## 🌐 萬能金庫架構

### 1. 三層憑證架構

```mermaid
graph TD
    A[L0 JunAikey 成長層] --> B[L1 OmniKey 憑證權威]
    B --> C[L2 OmniMasterKey 統一憑證存取]
    C --> D[L3 SUMMON_LAYERS]
    D --> E[L4 已部署代理]
```

### 2. 存放位置選擇
| 類型 | 存放位置 | 是否版本控制 |
|------|----------|------------|
| 本機開發 | `.env.local` | ✅ 已忽略 |
| 生產環境 | `secret-vault/ENV20230818.env` | ❌ 本機 Only |
| 萬能金庫 | `omni-bitwarden/` (Bitwarden 集成) | ❌ 本機 Only |
| 臨時憑證 | OneTimeSecret（人對人分享） | ❌ 臨時鏈接 |

### 3. 安全原則
- ❌ 絕不硬編碼：任何 API 金鑰、密碼、機密資料均不得寫入程式碼
- ❌ 不輸出真實值：對話過程中任何機密值都必須遮罩（`***MASKED***`）
- ✅ 環境變數：本地開發使用 `.env.local`（已 `.gitignore` 忽略）
- ✅ 機密聖櫃：生產環境使用 `secret-vault/` 目錄
- ✅ 統一存取：透過 `omni_get_secret()` 函數存取
- ✅ MASKED 輸出：所有憑證查詢結果均以 `***MASKED***` 顯示
- ✅ 權限控制：`secret-vault/` 目錄權限 600，僅所有者可讀寫
- ✅ 出口清理：程式結束時清理環境變數中的機密值

---

## 🛠️ 安裝與初始化

### 1. 安裝 OpenBountyman 或類似工具

```bash
# 根據你的密碼管理系統安裝 CLI
# 例如：Bitwarden CLI, 1Password CLI, Vault CLI 等

# 檢查安裝
bitwarden --version
```

### 2. 初始化万能金庫

```bash
# 創建万能金庫目錄
mkdir -p omni-bitwarden

# 複製配置模板
cp .agents/skills/omni-bitwarden/configs/omni-bitwarden.example.yaml \
   omni-bitwarden/config.yaml

# 配置金鑰
# 修改 config.yaml 填入你的金鑰
```

### 3. 設定環境變數

```bash
# 在 .env.local 中添加
OMNIBITWARDEN_ENABLED=true
OMNIBITWARDEN_CONFIG=omni-bitwarden/config.yaml
```

### 4. 安裝 TypeScript 依賴

```bash
cd .agents/skills/omni-bitwarden/scripts
pnpm install || npm install
```

---

## 🔐 安全守則（嵌入用戶偏好）

1. **絕不硬編碼**：任何 API 金鑰、密碼、機密資料均不得寫入程式碼
2. **環境變數**：本地開發使用 `.env.local`（已 `.gitignore` 忽略）
3. **機密聖櫃**：生產環境使用 `secret-vault/` 目錄
4. **万能金庫**：統一存取介面，透過 `omni_get_secret()` 函數存取
5. **MASKED 輸出**：所有憑證查詢結果均以 `***MASKED***` 顯示
6. **權限控制**：`secret-vault/` 目錄權限 600，僅所有者可讀寫
7. **出口清理**：程式結束時清理環境變數中的機密值
8. **禁止顯示真實值**：對話過程中任何機密值都必須遮罩（`***MASKED***`）
9. **金鑰輪替**：每 90 天輪替一次高風險金鑰
10. **最小權限**：僅授予必要的服務存取權限
11. **語言限制**：繁體中文（zh-hant）only。Cannot use Japanese.
12. **TypeBox 為合約正本**：TypeBox schema 為合約正本（source of truth），前端/後端皆由 schema 生成
13. **直推 main 已核准**：2026-11-03 起，功能分支 PR 規則已放棄，實際以「直推 main」方式完成
14. **5T 提交格式**：`5T: source_origin=<domain> <topic>`、`5T-Traceable: <trace>`、`5T-Trustworthy: <trust>`
15. **Ossidian Sync 邊界**：`docs/vault-canon/` 永遠只走 `obsidian-git`（git）。`ob`（Obsidian Sync）只用於另一個獨立非共享 vault，禁止寫入 `vault-canon`。
16. **Tesseract OCR**：`TESSDATA_PREFIX` 必須指向包含 `tessdata` 資料夾的上層目錄（`C:\Program Files\Tesseract-OCR`），或以 `--tessdata-dir` 參數指定。空格路徑需用雙引號包住。命令列格式：`tesseract.exe <input.png> stdout [<lang>|--tessdata-dir=<path>] [<lang>]`
17. **Linux 32-bit build**：`apps/omnilive`/`apps/omnlive` 同名 → `EDUPLICATEWORKSPACE`。`typescript@7.0.2` 不提供 ia32 原生二進位。`vitest`/rolldown 原生綁定（wasm32-wasi）不可用。**解決方案：使用 64-bit node + `@typescript/typescript-win32-x64`**。
18. **Shell history**：終端機 shell history 已 `history -c` 清除。

## 🏗️ 系統整合

### 1. 名稱解析系統
```typescript
// src/agents/omni-key.ts
// 統一憑證存取介面

export function omni_get_secret(key: string, scope?: string): SecretResult {
  // 檢查萬能金庫
  const vaultValue = vaultManager.get(key, scope);
  if (vaultValue) {
    return { found: true, value: vaultValue, source: "omni-bitwarden" };
  }
  // 檢查環境變數
  const envValue = process.env[key];
  if (envValue) {
    return { found: true, value: maskValue(envValue), source: "environment" };
  }
  // 檢查秘密聖櫃
  const vaultValue = readSecretVault(key);
  if (vaultValue) {
    return { found: true, value: maskValue(vaultValue), source: "secret-vault" };
  }
  return { found: false };
}
```

### 2. 配置檔案
```yaml
# omni-bitwarden/config.yaml
vault:
  enabled: true
  type: bitwarden
  endpoint: https://vault.esggo.co
  token: ${OMNIBITWARDEN_TOKEN}

scopes:
  - name: development
    path: .env.local
  - name: production
    path: secret-vault/ENV20230818.env

secrets:
  - name: NCBDB_API_TOKEN
    scope: production
    auto_rotate: true
  - name: MISTRAL_API_KEY
    scope: development
    auto_rotate: false
  - name: GROQ_API_KEY
    scope: development
    auto_rotate: false
```

---

## ✅ 驗證清單

- [ ] 密碼未出現在程式碼中
- [ ] 密碼在 `.env` 文件中，且已 `.gitignore` 忽略
- [ ] 終端機歷史記錄中不包含密碼
- [ ] 密碼在顯示時已遮罩
- [ ] 密碼在程式結束時清理
- [ ] 檔案權限設定正確（600 或 700）
- [ ] 統一存取介面已使用

---

## 📌 引用文件

- `omni_master_key.py` - 統一憑證存取函數
- `verify_omni_master_key.py` - 機密驗證腳本
- `global-rule.md` - 憲章安全原則
- `OMNISKILL_BOOK.md` - 技能書索引
- `references/ENV20230818-template.md` - ENV20230818.pdf 環境變數模板結構

---

## 📖 參考資源

- [Bitwarden CLI Documentation](https://bitwarden.com/help/cli/)
- [OmniMasterKey 系統設計](./omni-master-key/SKILL.md)
- [Junaikey 成長層](./omni-master-key/SKILL.md)
- [安全原則與密碼學](./OMNISKILL_BOOK.md#37-安全與密碼學原則)

## 🌐 引用資源（Bitwarden 相關專案）

| 專案名稱 | 倉庫地址 | 說明 |
|----------|----------|------|
| **Bitwarden Server** | [DingJun1028/server](https://github.com/DingJun1028/server) | Bitwarden 後端基礎設施，包含 API、資料庫、Docker 配置等 |
| **Bitwarden Clients** | [DingJun1028/clients](https://github.com/DingJun1028/clients) | Bitwarden 客戶端應用（Web、桌面、瀏覽器擴展、CLI） |
| **Passwordless Node.js** | [DingJun1028/passwordless-nodejs](https://github.com/DingJun1028/passwordless-nodejs) | Bitwarden Passwordless.dev Node.js SDK，支援無密碼認證 |

### 1. Bitwarden Server 參考

Bitwarden 伺服器後端（C#、TypeScript、SQL Server）提供：

- **API 伺服器**：REST API 與 WebSocket 連接
- **資料庫**：SQL Server 架構與 migrations
- **Docker**：容器化部署配置
- **認證系統**：JWT、Refresh Token、OAuth 2.0

### 2. Bitwarden Clients 參考

Bitwarden 客戶端應用包含：

- **Web 客戶端**：瀏覽器應用（TypeScript、React）
- **桌面客戶端**：Electron 應用（TypeScript、Rust）
- **瀏覽器擴展**：Chrome、Firefox、Edge 擴展
- **CLI 工具**：命令列密碼管理工具

### 3. Passwordless Node.js 參考

無密碼認證 SDK：

```bash
npm i @passwordlessdev/passwordless-nodejs
```

```typescript
import { PasswordlessClient } from '@passwordlessdev/passwordless-nodejs';

const client = new PasswordlessClient(process.env.PASSWORDLESS_SECRET!, {
  baseUrl: 'https://v4.passwordless.dev'
});

// 註冊
const registerToken = await client.createRegisterToken({
  userId: 'user-id',
  username: 'user@example.com',
  aliases: ['device-name']
});

// 登入驗證
const verifiedUser = await client.verifyToken(token);
```

### 4. 整合方式

```mermaid
graph TD
    A[使用者] --> B{認證方式}
    B -->|密碼less| C[Passwordless.dev]
    B -->|傳統密碼| D[Bitwarden Server]
    C --> E[萬能金庫]
    D --> E
    E --> F[業務應用]
```

## 🔐 密碼less 認證整合（參考）

### 1. Passwordless.dev Node.js SDK

[passwordless-nodejs](https://github.com/DingJun1028/passwordless-nodejs) 是 Bitwarden 官方的 Passwordless.dev Node.js SDK，提供無密碼認證功能（Magic Link / 密碼less 登入）。

#### 套件安裝

```bash
npm i @passwordlessdev/passwordless-nodejs
```

#### 基本用法

```typescript
import { PasswordlessClient } from '@passwordlessdev/passwordless-nodejs';

// 創建 PasswordlessClient 實例
const options: PasswordlessOptions = {
  baseUrl: 'https://v4.passwordless.dev'
};
const passwordlessClient = new PasswordlessClient(process.env.PASSWORDLESS_SECRET!, options);

// 註冊
const registerOptions = new RegisterOptions();
registerOptions.userId = userId;
registerOptions.username = username;
registerOptions.aliases = [deviceName];
registerOptions.discoverable = true;

const token = await passwordlessClient.createRegisterToken(registerOptions);

// 登入驗證
const verifiedUser = await passwordlessClient.verifyToken(token);
if (verifiedUser.success) {
  // 使用 JWT 建立用戶 session
}
```

#### 環境變數配置

| 變數名稱 | 範例值 | 說明 | 必填 |
|----------|--------|------|------|
| `PASSWORDLESS_API` | `https://v4.passwordless.dev` | Passwordless.dev 後端基礎網址 | 否 |
| `PASSWORDLESS_SECRET` | `demo:secret:f831e39c29e64b77aba547478a4b3ec6` | 從 AdminConsole 取得的 Secret | 是 |

### 2. 密碼less 與傳統密碼管理結合

```mermaid
graph TD
    A[使用者登入] --> B{認證方式}
    B -->|密碼less| C[Passwordless.dev]
    B -->|密碼認證| D[傳統登入]
    C --> E[萬能金庫存取]
    D --> E
    E --> F[業務邏輯]
```

### 3. 安全原則

- **不硬編碼**：`PASSWORDLESS_SECRET` 必須存放在環境變數或密碼管理系統
- **Masked 輸出**：任何取得的值都必須遮蔽輸出
- **最小權限**：密碼less 認證僅用於驗證身分，不存取敏感數據
- **輪替機制**：定期輪替 `PASSWORDLESS_SECRET`

---

## 🖥️ 命令列工具

```bash
# 驗證系統狀態
npx tsx scripts/omni-bitwarden.ts verify

# 更新金鑰值
npx tsx scripts/omni-bitwarden.ts update <金鑰名> [scope]

# 輪替金鑰
npx tsx scripts/omni-bitwarden.ts rotate <金鑰名> [scope]

# 向 Bitwarden 同步
npx tsx scripts/omni-bitwarden.ts sync
```

---

## 📝 版本歷史

| 版本 | 日期 | 說明 |
|------|------|------|
| 2.0.0 | 2026-11-03 | 重寫為完整技能文件，新增命令列工具與安全守則 |
| 1.0.0 | 2026-11-02 | 初始版本，基礎整合 |

---

## 📖 最佳實踐做法

### 1. 密碼權限管理

| 場景 | 最佳實踐 |
|------|----------|
| 本機開發 | `.env.local`，已 `.gitignore` 忽略，權限 600 |
| 生產環境 | `secret-vault/ENV20230818.env`，權限 600，目錄 700 |
| 萬能金庫 | `omni-bitwarden/`，權限 700 |
| 人對人分享 | OneTimeSecret，臨時鏈接，盡快失效 |

### 2. 環境變數最佳實踐

```bash
# ✅ 正確：使用 .env.local（已 gitignore）
export NCBDB_API_TOKEN=***MASKED***

# ❌ 錯誤：寫入程式碼
const token = "ghp_xxxxxxxxxxxx"
```

### 3. 記憶體清理

```typescript
// 程式結束時清理環境變數中的機密值
process.on("exit", () => {
  for (const key of Object.keys(process.env)) {
    if (key.includes("TOKEN") || key.includes("KEY") || key.includes("SECRET")) {
      delete process.env[key];
    }
  }
});
```

### 4. 日誌記錄

```typescript
// ✅ 正確：輸出來源，不輸出值
console.log(`Secret "${key}" loaded from ${result.source}`);

// ❌ 錯誤：輸出真實值
console.log(`Token: ${result.value}`);
```

### 5. 輪替策略

| 金鑰類型 | 輪替頻率 | 備註 |
|----------|----------|------|
| 服務帳號 | 90 天 | 高風險 |
| 開發者金鑰 | 180 天 | 中風險 |
| 只讀金鑰 | 365 天 | 低風險 |

### 6. 版本控制忽略

確保 `.gitignore` 包含：

```gitignore
.env.local
.env.*.local
secret-vault/
omni-bitwarden/config.yaml
```

### 7. 聯絡管道

- 離職或離開團隊時，立即撤銷所有安全存取權限
- 發現金鑰泄露時，立即輪替並記錄事件
- 所有機密存取透過 `omni_get_secret()` 統一管理

---

## ⚠️ 注意事項

1. **金鑰輪替**：每 90 天輪替一次高風險金鑰
2. **密碼管理**：勿將真實密碼寫入程式碼或版本庫
3. **最小權限**：僅授予必要的服務存取權限
4. **密碼輪替**：定期輪替敏感密碼
5. **安全教訓**：參考 `.security-lesson-20261102.md` 學習經驗
6. **秘密聖櫃**：所有機密存取透過 `omni_get_secret()` 統一管理
7. **金鑰離職**：離職時立即撤銷所有安全存取權限

---

## 📖 參考資源

- [Bitwarden CLI Documentation](https://bitwarden.com/help/cli/)
- [OmniMasterKey 系統設計](./omni-master-key/SKILL.md)
- [Junaikey 成長層](./omni-master-key/SKILL.md)
- [安全原則與密碼學](./OMNISKILL_BOOK.md#37-安全與密碼學原理)
- [DingJun1028/server](https://github.com/DingJun1028/server)
- [DingJun1028/clients](https://github.com/DingJun1028/clients)
- [passwordless-nodejs](https://github.com/DingJun1028/passwordless-nodejs)


## 自然語觸發自動工具使用的機率 (Natural Language Auto-Tool Trigger)

### 1. 觸發關鍵字清單 (Trigger Keywords)

> 系統會自動識別輸入中的自然語觸發詞，觸發對應的工具/技能/代理。

#### 核心觸發詞

| 關鍵字 | 英文 | 觸發功能 | 機率權重 |
|--------|------|---------|----------|
| omni-bitwarden | auto | 觸發本技能 | 5.0 |
| 觸發 | trigger | 觸發工具使用 | 4.5 |
| 自動 | auto | 自動執行 | 4.0 |
| 幫助 | help | 顯示說明 | 3.0 |
| 查詢 | query | 查詢資訊 | 3.0 |
| 記錄 | record | 記錄數據 | 2.5 |
| 執行 | run | 執行操作 | 3.0 |
| 檢查 | check | 檢查狀態 | 2.5 |
| 初始化 | init | 初始化系統 | 3.0 |

#### 進階觸發詞

| 關鍵字 | 英文 | 觸發功能 | 機率權重 |
|--------|------|---------|----------|
| 指令 | command | 執行指令 | 4.0 |
| 工具 | tool | 使用工具 | 3.5 |
| 自動 | auto | 自動執行 | 3.0 |
| 查詢 | query | 查詢 | 2.5 |
| 記錄 | record | 記錄 | 2.0 |
| 反思 | reflect | 反思 | 2.5 |
| 重啟 | restart | 重啟 | 2.5 |
| 關閉 | shutdown | 關閉 | 2.5 |

---

### 2. 觸發規則

#### 2.1 預設觸發機率

| 模式 | 權重 | 說明 |
|------|------|------|
| 核心關鍵字 | 100% | 必然觸發 |
| 進階關鍵字 | 70% | 單一關鍵字即觸發 |
| 其他自然語 | 30% | 隨機匹配 |
| 歧義命中 | 15% | 需要確認 |

#### 2.2 機率加權

觸發機率 = (關鍵字分數 × 頻率) + (上下文相似度 × 0.3) + 隨機種子 (0-0.2)

- 單一高權重關鍵字：自動觸發 (1.0)
- 多關鍵字組合：權重加總，上限 1.0
- 低權重 (< 0.3)：記錄，不自動執行

#### 2.3 自然語解析範例

```typescript
// 輸入：omni-bitwarden 並查詢目前狀態
{
  triggers: ["omni-bitwarden", "query"],
  actions: ["awaken()", "query()"],
  priority: ["omni-bitwarden", "query"],
  probability: 1.0
}
```

---

### 3. 工具選擇權重

| 工具類別 | 關鍵字 | 權重 |
|----------|--------|------|
| 記憶查詢 | query, 查詢, 讀取 | 0.8 |
| 技能成長 | omni-bitwarden, grow | 0.7 |
| 反思 | reflect, 學習 | 0.75 |
| 系統初始化 | omni-bitwarden, start | 0.9 |
| 協作 | share, 協作 | 0.65 |
| 結界 | inherit, 繼承 | 0.5 |

---

### 4. 信心分數與反饋

| 信心分數 | 處理方式 |
|----------|----------|
| >= 0.9 | 自動執行 |
| 0.7 - 0.9 | 記錄後自動執行 |
| 0.4 - 0.7 | 詢問用戶 |
| < 0.4 | 記錄不執行 |

---

### 5. 實際示例

#### 5.1 單一自然語

**輸入**：omni-bitwarden
**解析**：核心關鍵字
**輸出**：`awaken()`

**輸入**："查詢 omni-bitwarden 狀態"
**解析**：查詢 + 技能
**輸出**：`query()`, `doctor()`

#### 5.2 複雜自然語

**輸入**："我今天學到新東西，幫我記住並分享"
**解析**：
- 關鍵字：`growth`, `share`, `memory`
- 行動：`recordLearning()`, `recordMemory()`, `cross-agent sync`
- 權重：0.75
- 輸出：`growSkill()`, `remember()`, `tagSkill("share:active")`

**輸入**："讓我檢查一下 omni-bitwarden 狀態"
**解析**：檢查
**輸出**：`doctor()`, `backend()`

---

### 6. 參數一致性

此技能的默認配置：
- **doctor／backend 與 awaken 必須用同一組參數**
- **所有憑證來源 = `secret-vault/ENV20230818.env`**
- **絕不在代碼中硬編碼憑證**
- **NCBDB 為主，local 為備份**
- **所有成長記錄必須帶 `agent_id`、`timestamp`、`source_origin`**
