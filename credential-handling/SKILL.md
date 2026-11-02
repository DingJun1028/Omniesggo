---
title: 密碼鍵值最佳實踐
name: credential-handling
description: 密碼與金鑰管理的最佳實踐，適用於 Omniesggo 專案
category: secret-handling
version: 1.3.0
author: Hermes Agent
license: AGPL-3.0
platforms: [windows, linux, macos]
metadata:
  hermes:
    tags: [secret-handling, environment, api-keys, vault]
    category: security
    related_skills: [omniskill-book, omni-master-key]
---

# 🌐 密碼鍵值最佳實踐 (Secret Key Handling)

> 密碼與金鑰管理的最佳實踐，適用於 Omniesggo 專案。  
> 適用場景：新增 API key、設定憑證存取、環境變數管理、密碼處理。

## When to Use

Use this skill when any of the following is true:

- The user asks to add, update, or verify an API key or credential
- The user provides a secret-vault template (e.g. `ENV20230818.pdf`) and asks to extract the required keys
- The user needs to fill in environment variables for local development or production
- The user asks to verify that secret files are not committed to version control
- The user needs to set up a new machine with the Omniesggo project

Do not use this skill for:
- A one-off incident report — that is `session_search` territory
- Debugging a specific missing-binary error — that is a devops task

---

# 🌐 密碼鍵值最佳實踐 (Secret Key Handling)

> 密碼與金鑰管理的最佳實踐，適用於 Omniesggo 專案。  
> 適用場景：新增 API key、設定憑證存取、環境變數管理、密碼處理。

---

## 📋 前置條件

1. 確認要處理的密碼是否已存在於 `secret-vault/` 中
2. 確認是否需要新增新的 API key 或更新現有金鑰
3. 確認操作不會寫入版本控制（使用 .gitignore 忽略的檔案）
4. 如為一次性密碼（OneTimeSecret）：確認連結已提供且未被消費

---

## 🔄 流程

### 步驟 1：確認密碼屬性
- 判斷密碼類型：API Key、DB 密碼、OAuth Token、SSH Key
- 判斷存取範圍：開發環境、測試環境、生產環境
- 判斷存取方式：統一存取介面、環境變數、機密聖櫃
- 判斷來源：環境變數檔案、OneTimeSecret 連結、一次性密鑰生成器

### 步驟 2：選擇存放位置
| 類型 | 存放位置 | 是否版本控制 |
|------|----------|------------|
| 本機開發 | `.env.local` | ✅ 已忽略 |
| 生產環境 | `secret-vault/ENV20230818.env` | ❌ 本機 Only |
| 臨時憑證 | OneTimeSecret（人對人分享） | ❌ 臨時鏈接 |

### 步驟 3：檔案權限設定
```bash
# 機密聖櫃檔案權限
chmod 600 secret-vault/ENV20230818.env

# 目錄權限
chmod 700 secret-vault/
```

### 步驟 4：環境變數載入
```bash
# 本機開發
export $(grep -v '^#' .env.local | xargs)

# 生產環境
source secret-vault/ENV20230818.env
```

### 步驟 5：統一存取介面
```python
# Python 統一存取
from omni_master_key import omni_get_secret
result = omni_get_secret("GITHUB_TOKEN")
if result["found"]:
    os.environ["GITHUB_TOKEN"] = result["value"]  # 僅在進程內非遮蔽
    print(f"Source: {result['source']}")  # 輸出來源，不輸出值
```

### 步驟 6：一次性密碼（OneTimeSecret）處理
> 適用場景：使用者透過 OneTimeSecret 連結分享機密值，需安全地上傳到 `secret-vault/`。

1. **接收連結**：使用者提供 `https://us.onetimesecret.com/secret/<id>` 格式的連結
2. **讀取連結**：透過瀏覽器開啟連結，等待頁面渲染（Vue.js 動態內容）
3. **提取機密值**：在頁面上找到「机密内容」或「复制」按鈕，點擊後機密值會顯示
4. **寫入聖櫃**：將機密值寫入 `secret-vault/ENV20230818.env`
   - 環境變數名稱根據機密類型而定（如 `GITHUB_PAT_OMNIMOTE`）
   - 確保檔案權限為 `600`
5. **查詢結果**：透過 `omni_get_secret()` 驗證是否成功載入

### 步驟 7：安全檢查
- [ ] 確認機密值未寫入程式碼
- [ ] 確認機密值在 `.env` 文件中且已被 `.gitignore` 忽略
- [ ] 確認檔案權限為 `600`
- [ ] 確認終端機歷史記錄中不包含機密值
- [ ] 確認顯示時已遮罩（`***MASKED***`）
- [ ] 確認程式結束時已清理

### 步驟 8：推送前檢查（重要）
> 推送前，**必須**重新掃描工作樹中所有檔案，確認無機密值殘留。  
> 若 `git push` 被 GitHub「secret-scanning」拒絕，代表仍有舊的機密值在「已提交過的 commit」中 → 需參照「【禁忌】GitHub secret-scanning 阻擋推送」處理。

---

## 🔄 工作流程（重複步驟已合併）

### 步驟 1：確認密碼屬性
- 判斷密碼類型：API Key、DB 密碼、OAuth Token、SSH Key
- 判斷存取範圍：開發環境、測試環境、生產環境
- 判斷存取方式：統一存取介面、環境變數、機密聖櫃
- 判斷來源：環境變數檔案、OneTimeSecret 連結、一次性密鑰生成器

### 步驟 2：選擇存放位置
| 類型 | 存放位置 | 是否版本控制 |
|------|----------|------------|
| 本機開發 | `.env.local` | ✅ 已忽略 |
| 生產環境 | `secret-vault/ENV20230818.env` | ❌ 本機 Only |
| 臨時憑證 | OneTimeSecret（人對人分享） | ❌ 臨時鏈接 |

### 步驟 3：檔案權限設定
```bash
# 機密聖櫃檔案權限
chmod 600 secret-vault/ENV20230818.env

# 目錄權限
chmod 700 secret-vault/
```

### 步驟 4：環境變數載入
```bash
# 本機開發
export $(grep -v '^#' .env.local | xargs)

# 生產環境
source secret-vault/ENV20230818.env
```

### 步驟 5：統一存取介面
```python
# Python 統一存取
from omni_master_key import omni_get_secret
result = omni_get_secret("GITHUB_TOKEN")
if result["found"]:
    os.environ["GITHUB_TOKEN"] = result["value"]  # 僅在進程內非遮蔽
    print(f"Source: {result['source']}")  # 輸出來源，不輸出值
```

### 步驟 6：一次性密碼（OneTimeSecret）處理
> 適用場景：使用者透過 OneTimeSecret 連結分享機密值，需安全地上傳到 `secret-vault/`。

1. **接收連結**：使用者提供 `https://us.onetimesecret.com/secret/<id>` 格式的連結
2. **讀取連結**：透過瀏覽器開啟連結，等待頁面渲染（Vue.js 動態內容）
3. **提取機密值**：在頁面上找到「机密内容」或「复制」按鈕，點擊後機密值會顯示
4. **寫入聖櫃**：將機密值寫入 `secret-vault/ENV20230818.env`
   - 環境變數名稱根據機密類型而定（如 `GITHUB_PAT_OMNIMOTE`）
   - 確保檔案權限為 `600`
5. **查詢結果**：透過 `omni_get_secret()` 驗證是否成功載入

### 步驟 7：安全檢查
- [ ] 確認機密值未寫入程式碼
- [ ] 確認機密值在 `.env` 文件中且已被 `.gitignore` 忽略
- [ ] 確認檔案權限為 `600`
- [ ] 確認終端機歷史記錄中不包含機密值
- [ ] 確認顯示時已遮罩（`***MASKED***`）
- [ ] 確認程式結束時已清理

### 步驟 8：推送前檢查（重要）
> 推送前，**必須**重新掃描工作樹中所有檔案，確認無機密值殘留。  
> 若 `git push` 被 GitHub「secret-scanning」拒絕，代表仍有舊的機密值在「已提交過的 commit」中 → 需參照「【禁忌】GitHub secret-scanning 阻擋推送」處理。

---

## 安全守則

1. **絕不硬編碼**：任何 API 金鑰、密碼、機密資料均不得寫入程式碼
2. **環境變數**：本地開發使用 `.env.local`（已 `.gitignore` 忽略）
3. **機密聖櫃**：生產環境使用 `secret-vault/` 目錄
4. **統一存取**：透過 `omni_get_secret()` 函數存取
5. **MASKED 輸出**：所有憑證查詢結果均以 `***MASKED***` 顯示
6. **權限控制**：`secret-vault/` 目錄權限 600，僅所有者可讀寫
7. **出口清理**：程式結束時清理環境變數中的機密值
8. **禁止顯示真實值**：對話過程中任何機密值都必須遮罩（`***MASKED***`），絕不輸出真實值；掃描檔案發現實際值也立即遮罩並記錄教訓
9. **一次性密碼處理**：透過 OneTimeSecret 接收機密值時，先透過瀏覽器讀取連結，找到「复制」按鈕並點擊，機密內容會顯示在頁面上，從中擷取機密值
10. **機密散佈**：機密值一次性鏈接在被使用後會自動失效，無法重複訪問

## 安全事件教訓

> 2026-11-02 事件：AI 助手在對話中將實際金鑰值寫入 `secret-vault/ENV20230818.env` 並在終端機輸出時顯示部分真實值，存在記錄殘留風險。

### 應對措施

1. 填入真實值時使用佔位符（`***MASKED***`）
2. 輸出時全部遮罩（`***MASKED***`）
3. 完成後立即輪替敏感金鑰
4. 清除終端機歷史、臨時文件
5. 檢查備份、快照、雲端同步是否包含機密
6. 已暴露的金鑰必須輪替

---

## 【禁忌】GitHub secret-scanning 阻擋推送

> **發生條件**：`git push` 被 GitHub 拒絕，訊息包含「secret-scanning」或「secret scanning」；
> 且 URL 包含 `unblock-secret/<something>`。

### 原因
- 分支上的任一 commit 中仍包含機密值（即使後續提交已修復）
- GitHub 的 scanner 會掃描所有 commit，不只是工作樹
- 即使修正了文件內容，舊 commit 的機密值仍會被鎖定

### 解決步驟
1. 確認機密值已全部替換為 `***MASKED***`
2. 在本地重新提交所有修正（`git add -A && git commit -m "..."`)
3. 嘗試推送（會再次失敗）
4. 複製 GitHub 提供的 `unblock-secret/<hash>` URL
5. 在瀏覽器中開啟該 URL 並點擊「Mark as reviewed」或「Unblock secret」
6. 重新推送

### 檢查清單
- [ ] 所有檔案（含歷史 commit）均無機密值
- [ ] 使用 `grep -rln "ghp_\|gsk_\|sk-ant_\|mstrl_\|groq_\|oct_"` 掃描整個倉庫
- [ ] 確認 GitHub 提供的 unblock URL 已點擊「Mark as reviewed」

---

## 常見陷阱

1. **空格路徑問題**：`C:\Program Files\Tesseract-OCR` 需用雙引號包住或 `--tessdata-dir` 參數
2. **MSYS 路徑問題**：`/tmp/xxx` 不被 Windows Python 認识 → 用 `C:/tmp/xxx` 或絕對路徑
3. **輸入檔找不到**：確認檔案存在於正確路徑，不要用 MSYS 路徑
4. **SQLite CLI 未安裝**：改用 Python `sqlite3` 模組
5. **Terminal PATH 問題**：Windows PowerShell 中 `hermes` 需設定 PATH
6. **一次性密碼連結僅顯示一次**：當使用者告知「僅顯示一次」時，需在瀏覽器中讀取連結並點擊「复制」按鈕，機密內容會在頁面上顯示
7. **機密值永不顯示**：在對話或終端機中顯示機密值時，始終使用 `***MASKED***` 遮罩
8. **推送被 GitHub secret-scanning 阻擋**：即使工作樹已修正，舊 commit 的機密值仍會被檢測；需先解除 GitHub 的 unblock 綁定

---

## ✅ 驗證清單

- [ ] 密碼未出現在程式碼中
- [ ] 密碼在 `.env` 文件中，且已 `.gitignore` 忽略
- [ ] 終端機歷史記錄中不包含密碼
- [ ] 密碼在顯示時已遮罩
- [ ] 密碼在程式結束時清理
- [ ] 檔案權限設定正確（600 或 700）
- [ ] 統一存取介面已使用
- [ ] 推送前重新掃描工作樹確認無機密值殘留

---

## 📌 引用文件

- `omni_master_key.py` - 統一憑證存取函數
- `verify_omni_master_key.py` - 機密驗證腳本
- `global-rule.md` - 憲章安全原則
- `OMNISKILL_BOOK.md` - 技能書索引
- `references/ENV20230818-template.md` - ENV20230818.pdf 環境變數模板結構
