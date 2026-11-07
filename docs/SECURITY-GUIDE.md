# 🛡️ 安全指南（Security Guide）

> 適用於 Omniesggo 專案的安全最佳實踐指南。
> 涵蓋：金鑰管理、環境變數、檔案安全、版本控制、CI/CD、密鑰輪替、開發流程、術語協同。

---

## 📖 目錄

1. [核心原則](#1-核心原則)
2. [金鑰管理](#2-金鑰管理)
3. [環境變數配置](#3-環境變數配置)
4. [檔案安全](#4-檔案安全)
5. [版本控制安全](#5-版本控制安全)
6. [CI/CD 安全](#6-cicd-安全)
7. [密鑰輪替](#7-密鑰輪替)
8. [開發流程安全](#8-開發流程安全)
9. [術語協同安全](#9-術語協同安全)
10. [安全事故應對](#10-安全事故應對)

---

## 1. 核心原則

### 1.1 不硬編碼
> ❌ 任何 API 金鑰、密碼、機密資料均不得寫入程式碼。

```typescript
// ❌ 錯誤
const API_KEY = "sk-abc123...";

// ✅ 正確
const API_KEY = process.env.API_KEY;
```

### 1.2 環境變數
> ✅ 本機開發使用 `.env.local`（已 `.gitignore` 忽略）。

### 1.3 機密聖櫃
> ✅ 生產環境使用 `secret-vault/` 目錄。

### 1.4 統一存取
> ✅ 所有機密存取透過 `omni_get_secret()` 統一管理。

### 1.5 MASKED 輸出
> ✅ 所有機密查詢結果均以 `*** MASKED ***` 顯示。

### 1.6 權限控制
> ✅ `secret-vault/` 目錄權限 600，僅所有者可讀寫。

### 1.7 出口清理
> ✅ 程式結束時清理環境變數中的機密值。

---

## 2. 金鑰管理

### 2.1 檔案結構
```
secret-vault/
├── ENV20230818.env    ← 主要金鑰配置（權限 600）
├── ENV20230818.pdf    ← 環境變數模板（16 頁）
└── README.md          ← 說明文件
```

### 2.2 伺服器快速載入（Hermes）
```bash
# 原生 Windows
$env:Path += ";C:\Users\Administrator\AppData\Local\hermes\bin"
& 'C:\Users\Administrator\AppData\Local\hermes\bin\hermes.exe' --version

# PowerShell 設定
Set-Alias -Name hermes -Value 'C:\Users\Administrator\AppData\Local\hermes\bin\hermes.exe'
```

### 2.3 Shell 快速載入（Git-Bash / cmd）
```bash
# 加入到 PATH
export PATH=$PATH:/c/Users/Administrator/AppData/Local/hermes/bin
```

---

## 3. 環境變數配置

### 3.1 環境變數表

| 變數名稱 | 用途 | 適用環境 |
|---|---|---|
| `SUPABASE_URL` | 主連線 Supabase | 全部 |
| `SUPABASE_SERVICE_ROLE_KEY` | 服務角色鍵 | 全部 |
| `SUPABASE_OMNI_URL` | 次要連線 | 全部 |
| `SUPABASE_OMNI_SERVICE_ROLE_KEY` | 次要服務角色鍵 | 全部 |
| `DATABASE_URL` | Raw SQL 連線 | 全部 |
| `NCBDB_API_TOKEN` | 機密存取 | 生產 |
| `OMNIMASTER_KEY` | 萬能金庫 | 生產 |
| `MISTRAL_API_KEY` | LLM API | 開發 |
| `MISTRAL_ADMIN_KEY` | 管理 API | 開發 |
| `MISTRAL_WORKFLOW_KEY` | 工作流程 API | 開發 |
| `CONDUIT_PASSWORD` | 管道密碼 | 開發 |
| `GROQ_API_KEY` | Groq API | 開發 |
| `TESSDATA_PREFIX` | Tesseract 語言包 | 開發 |

### 3.2 參考模板
- `.env.example`（已清理為占位符）
- `.env.omni.example`
- `.env.production.example`
- `.env.unified.example`

---

## 4. 檔案安全

### 4.1 權限設定
```bash
# 機密聖櫃目錄（推薦 700）
chmod 700 secret-vault/

# 機密檔案（推薦 600）
chmod 600 secret-vault/ENV20230818.env
chmod 600 .env.local

# 替代：使用 icacls（Windows）
icacls secret-vault/ENV20230818.env /grant "PC7ED6FB\Administrator:(OI)(CI)(F)" /inheritance:r /setowner "PC7ED6FB\Administrator" /grant "PC7ED6FB\Administrator:F"
```

### 4.2 掃描腳本
```bash
chmod +x scripts/verify-secrets.sh
./scripts/verify-secrets.sh
```

---

## 5. 版本控制安全

### 5.1 應忽略的檔案
```
.env
.env.local
.env.*.local
secret-vault/*.env
secret-vault/*.pdf
*.pem
*.key
*.pfx
credential
*.log
```

### 5.2 檢查
```bash
# 掃描真實金鑰
grep -r "your_actual_" .

# 掃描特定機密
grep -r "sk-ant-" .
grep -r "gsk_" .
grep -r "mstrl_" .
grep -r "NCBDB_API_TOKEN=your_actual" .
```

---

## 6. CI/CD 安全

### 6.1 工作流程
- 所有金鑰通過 GitHub Secrets 管理
- 不硬編碼任何機密
- 使用最小權限原則

### 6.2 安全掃描
- 每日掃描：`scripts/daily-security-scan.ps1`
- 由 `schtasks` 每日 08:00 執行

---

## 7. 密鑰輪替

### 7.1 輪替頻率
- API 鍵（NCBDB、Mistral、Groq）：每 90 天
- 管道密碼：每 30 天
- 服務角色鍵：每 180 天

### 7.2 輪替流程
1. 生成新金鑰（`openssl rand -hex 32`）
2. 更新 `secret-vault/ENV20230818.env`
3. 更新 `.env.local`（必要時）
4. 更新 `.env.example`
5. 更新 `.env.production.example`
6. 掃描確認無殘留
7. 通知相關開發者

---

## 8. 開發流程安全

### 8.1 Hermes 開發環境
```bash
# 設定環境變數
export PATH=$PATH:/c/Users/Administrator/AppData/Local/hermes/bin
export HERMES_PATH=/c/Users/Administrator/AppData/Local/hermes

# 設定 Profile
Set-Alias -Name hermes -Value 'C:\Users\Administrator\AppData\Local\hermes\bin\hermes.exe'
```

### 8.2 技能 helmet
每個技能 `SKILL.md` 頭部標籤應包含：
```yaml
metadata:
  hermes:
    tags: [secret-handling, environment, api-keys, vault, bitwarden]
```

---

## 9. 術語協同安全

### 9.1 安全教訓
> 2026-11-02 事件：在對話中寫入/顯示真實金鑰。
> 處理：檔案回退、終端機歷史清除、`OMNISKILL_BOOK.md` §3.7 教訓、`.security-lesson-20261102.md` 記錄、記憶保存。

### 9.2 常見錯誤
| 錯誤 | 影響 | 預防 |
|---|---|---|
| 在對話中輸出真實金鑰 | 紀錄殘留 | 輸出全部遮罩 |
| 在版控中提交金鑰 | 公開曝光 | 掃描 `.gitignore` |
| 終端機歷史記錄金鑰 | 恢復風險 | `history -c` 清除 |
| 檔案權限過寬 | 洩漏 | `chmod 600` |
| 硬編碼金鑰 | 版本控制 | 環境變數 |

---

## 10. 安全事故應對

### 10.1 事故分類
| 等級 | 描述 | 處理 |
|---|---|---|
| L1 | 輕微顯示錯誤 | 關閉後續輸出 |
| L2 | 歷史記錄暴露 | 清除歷史 |
| L3 | 版本庫暴露 | 輪替所有金鑰 |
| L4 | 實際洩漏 | 全部密碼輪替 |

### 10.2 應急流程
1. 停止相關操作
2. 掃描 `secret-vault/`、`.env*`、`.github/` 目錄
3. 執行 `history -c`
4. 清除 `~/.bash_history`
5. 檔案回退為占位符
6. 輪替金鑰
7. 寫入教訓記錄
8. 通知使用者

---

## ✅ 驗證清單

- [ ] 機密檔案權限 = 600
- [ ] `secret-vault/` 目錄 = 700
- [ ] 所有金鑰輸出遮罩
- [ ] 終端機歷史已清除
- [ ] 無真實金鑰寫入程式碼
- [ ] 安全教訓已寫入
- [ ] 掃描腳本已執行

---

*Last updated: 2026-11-02*
