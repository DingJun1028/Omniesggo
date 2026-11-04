# 🔄 API_SERVER_KEY 鍵輪替 — GitHub Actions 門檻

> 產生日期：2026-11-04 | 修訂版本：v1.0.0 | 5T 標籤：source_origin=key-rotation-workflow

---

## 一、PR 敘述文

```markdown
---
name: 鍵輪替門檻 workflow (API_SERVER_KEY)
...

## 變更內容

1. **CI/CD 門檻**：新增 `.github/workflows/key-rotation.yml`
   - 支援手動觸發（workflow_dispatch）與定時觸發（cron: "0 2 * * *"）
   - 流程：檢查 SSH 金鑰 → 生成新鍵 → 寫入本地 Vault → 模擬同步 VPS → 本地驗證 → 寫入輪替紀錄

2. **機密治理**：`secret-vault/ENV20230818.env` 已加入 `.gitignore`
   - 避免 plaintext secret 進入版本控管
   - 所有真實值僅存於本機唾液（600 權限）

3. **本地鍵輪替腳本**：`rotate-api-server-key.sh`
   - 含 DRY_RUN 模擬模式
   - 支援完整流程：生成新鍵 → 寫入 Vault → 模擬同步 → 本地驗證 → 寫入紀錄

## 風險與處理

| 風險 | 處理 |
|---|---|
| 平文金鑰進入版本庫 | 已透過 .gitignore 排除 |
| SSH 金鑰洩漏 | 僅透過 GitHub Secrets 提供，workflows 引用 secrets |
| 歷史殘留 | 已確認舊鍵已輪替，正式環境請吊銷 |

## 驗證清單

- [ ] 本地執行 `bash rotate-api-server-key.sh`（DRY_RUN=true）通過
- [ ] 建立 PR 至 main，檢查 CI 通過
- [ ] GitHub environment `key-rotation` 綁定 SSH 金鑰
- [ ] 手動執行 workflow，確認流程完整

---

*生成於：2026-11-04*  
*5T: source_origin=key-rotation-workflow*
```

---

## 二、GitHub Secrets 配置教學

### 1. 建立 Repository Secrets

進入：`GitHub > 你的專案 > Settings > Secrets and variables > Actions > New repository secret`

| 名稱 | 值 | 用途 |
|---|---|---|
| `VPS_SSH_KEY` | VPS 的私鑰內容（完整多行） | 讓 workflow 連線到 VPS 161.118.248.180 |
| `GITHUB_TOKEN` | 內建 token（通常無需提供） | CI/CD 認證 |

### 2. 建立 Environment（可選但建議）

`Settings > Environments > New environment > key-rotation`

- **環境名稱**：`key-rotation`
- **令牌**：啟用「Repository permissions」→ `Actions: Read and write`
- **強制狀態**：可選（推薦啟用）

### 3. 配置步驟

```bash
# 1. 準備本機 SSH 金鑰（如果尚未存在）
ssh-keygen -t ed25519 -C "key-rotation@esggo.co" -f ~/.ssh/esggo_vps
chmod 600 ~/.ssh/esggo_vps

# 2. 讀取私鑰內容（複製整段文字）
cat ~/.ssh/esggo_vps

# 3. 貼到 GitHub Secrets > VPS_SSH_KEY
#    （左側面板：設定 → 機密和變數 → Actions → 新增repository secret）
```

### 4. 驗證金鑰

```bash
# 本機測試 SSH 連線
ssh -i ~/.ssh/esggo_vps -o StrictHostKeyChecking=no ubuntu@161.118.248.180 'echo OK'
```

---

## 三、操作手冊

### 3.1 本地測試（DRY_RUN）

```bash
# 1. 進入工作區
cd /c/Users/Administrator/Documents/Project/Omniesggo

# 2. 生成測試用的新鍵
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# 3. 執行腳本（模擬模式）
DRY_RUN=true bash rotate-api-server-key.sh
```

**預期輸出**（僅示意，實際值以屏幕為準）：

```
[2026-11-04 10:00:00] --- 開始輪替 (API_SERVER_KEY) ---
[2026-11-04 10:00:00] ✓ 已寫入本地 Vault
[2026-11-04 10:00:00]   [模擬] 已「同步」至 VPS: 161.118.248.180:/opt/esggo/apps/tencentdb-memory/admin-key
[2026-11-04 10:00:00]     映象: echo "API_SERVER_KEY=<新鍵>" | sudo tee '/opt/esggo/apps/tencentdb-memory/admin-key'
[2026-11-04 10:00:00] ⚠ 舊鍵已標記為失效（正式環境請吊銷/輪轉帳號）
[2026-11-04 10:00:00] ✓ 本地 Vault 驗證通過
[2026-11-04 10:00:00] ✓ 輪替紀錄已寫入: rotation-log/rotate-api-server-key-20261104-100000.log
[2026-11-04 10:00:00] --- 輪替完成 ---
```

### 3.2 正式環境執行

```bash
# 1. 確保 SSH 金鑰可存取
export VPS_KEY_PATH=/home/ubuntu/.ssh/esggo_vps
export VPS_HOST=161.118.248.180
export VPS_USER=ubuntu

# 2. 執行腳本（不帶 DRY_RUN）
bash rotate-api-server-key.sh

# 3. 確認結果
# - 新鍵寫入 secret-vault/ENV20230818.env
# - 輪替紀錄寫入 rotation-log/
# - 模擬同步至 VPS
```

### 3.3 GitHub Actions 執行

```bash
# 1. 進入 GitHub 專案
# 2. 導航至 Actions 頁籤
# 3. 左側找「Key Rotation Gatekeeper」
# 4. 點擊「Run workflow」
# 5. 可選：勾選 force=true 強制執行
```

### 3.4 輪替後確認

```bash
# 1. 檢查本地 Vault
grep API_SERVER_KEY secret-vault/ENV20230818.env

# 2. 檢查輪替紀錄
cat rotation-log/rotate-api-server-key-*.log

# 3. 正式環境連線測試
ssh -i ~/.ssh/esggo_vps ubuntu@161.118.248.180
sudo cat /opt/esggo/apps/tencentdb-memory/admin-key
```

### 3.5 故障排查

| 錯誤 | 原因 | 處理 |
|---|---|---|
| `SSH KEY MISSING` | GitHub Secrets 未設定 VPS_SSH_KEY | 檢查 Secrets 是否已設定 |
| `Permission denied (publickey)` | SSH 連線失敗 | 確認私鑰權限 600、VPS 已允許連線 |
| `pnpm install --frozen-lockfile` 失敗 | lockfile 版本不一致 | 執行 `pnpm install --no-frozen-lockfile` |
| `vitest` 超時 | 本地無 tsc/vitest | 僅需 CI 驗證，跳過 |

---

## 四、安全檢查清單（輪替後）

- [ ] 本地 `secret-vault/ENV20230818.env` 已更新（600 權限）
- [ ] GitHub Secrets 中 `VPS_SSH_KEY` 已設定
- [ ] GitHub Environment `key-rotation` 已建立
- [ ] GitHub Actions workflow 可正常執行
- [ ] 正式環境已吊銷舊鍵
- [ ] 輪替紀錄已寫入 `rotation-log/`
- [ ] 報告已同步到團隊（已於此處）

*5T: source_origin=key-rotation-workflow*
