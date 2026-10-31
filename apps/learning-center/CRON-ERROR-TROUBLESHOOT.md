# Cron Error Job 排查清單（本機正常 session 用）

> 產出日期：2026-08-01
> 背景：本 session 無 terminal，無法實跑排查。下列兩個 cron job 已 `pause` 止住噪音，待你在本機有 terminal 權限的 Hermes session 執行。

---

## 已暫停的 Error Job

| job_id | name | 頻率 | deliver | 類型 |
|---|---|---|---|---|
| `64699af8dccf` | Queue consumer health check | 每 5 分 | telegram | AI-agent（prompt 驅動） |
| `2b78d08e31e7` | opencode-db-sync | 每 15 分 | local | no_agent（script: `opencode-db-sync.py`） |

恢復指令：`cronjob action=resume job_id=<id>`

---

## A. `64699af8dccf` Queue consumer health check

**作用**：檢查 `esggo-auto-repair` Worker 的 queue consumer 於 VPS `161.118.248.180` 的健康狀態。

**常見失敗原因 & 排查步驟**（本機 terminal 執行）：

1. **VPS 連線性**
   ```bash
   ssh esggo-vps "echo OK"            # 確認 SSH alias 可用
   curl -sf http://161.118.248.180:3000/health && echo "core OK" || echo "core FAIL"
   curl -sf http://161.118.248.180:8642/status && echo "gw OK" || echo "gw FAIL"
   ```
   → 若連不上，查 VPS 是否開機 / 安全群組 / IP 是否變更（memory 有 IP 衝突紀錄 161.118.248.180 vs 161.118.252.147）。

2. **Worker queue consumer 是否運作**
   ```bash
   ssh esggo-vps "pm2 list"          # 看 esggo-auto-repair / worker 是否在跑
   ssh esggo-vps "journalctl -u esggo-auto-repair --no-pager -n 50"  # 若有 systemd
   ```
   → consumer 若 crash，先 `pm2 restart <id>` 或查 DLQ（`esggo-repair-dlq` 已接）。

3. **健康端點路徑**
   - 確認腳本/agent 呼叫的 URL 正確（如 `/queue/health` 或 worker 暴露的 port）。
   - 若端點已改，需同步更新 job 的 prompt 中的 URL。

4. **Telegram 推播本身是否成功**
   - `last_delivery_error: null` 表示投遞成功，問題在 job 內部邏輯報 error（即「檢查失敗」而非「推播失敗」）。
   - 若想先看 agent 實際回報，可 `cronjob action=run job_id=64699af8dccf` 手動觸發一次看完整輸出。

**恢復條件**：VPS core/gateway 健康 + queue consumer 在跑 → `resume`。

---

## B. `2b78d08e31e7` opencode-db-sync

**作用**：執行本機 script `opencode-db-sync.py`，同步 OpenCode 的 session DB（OpenCode 跑在 `127.0.0.1:4096`）。

**常見失敗原因 & 排查步驟**：

1. **script 是否存在 / 路徑**
   ```bash
   # 在 Hermes 腳本目錄找
   ls -la ~/AppData/Local/hermes/scripts/opencode-db-sync.py
   # 或在專案目錄
   find C:\Project -name opencode-db-sync.py 2>/dev/null
   ```
   → 若檔案缺失，job 會直接 error。需補回 script 或改 job 指向正確路徑。

2. **Python 依賴**
   ```bash
   python -c "import requests; print('ok')"   # 指令碼可能用 requests 呼叫 OpenCode API
   pip show requests
   ```
   → 缺一併 `pip install`。

3. **OpenCode 服務可達性**
   ```bash
   curl -sf http://127.0.0.1:4096/health && echo "opencode OK" || echo "opencode DOWN"
   ```
   → OpenCode 未啟動則 sync 失敗。先確認 OpenCode 在本機跑起來（memory: OpenCode @ 127.0.0.1:4096 與 Hindsight Cloud 整合中）。

4. **權限 / 寫入目標**
   - 腳本可能寫入某 DB 檔或上傳 Hindsight；確認目標路徑可寫、token 有效。

5. **看實際錯誤**
   - 手動跑一次看 stderr：
     ```bash
     python ~/AppData/Local/hermes/scripts/opencode-db-sync.py
     ```
   - 或 `cronjob action=run job_id=2b78d08e31e7` 後用 `cronjob action=log` 看完整輸出。

**恢復條件**：script 存在 + 依賴齊 + OpenCode 在跑 + 手動跑無 error → `resume`。

---

## 操作小抄（正常 session）

```bash
# 看全部 job 狀態
cronjob action=list

# 手動觸發單個看真實錯誤
cronjob action=run job_id=64699af8dccf
cronjob action=run job_id=2b78d08e31e7

# 查某 job 的完整輸出
cronjob action=log job_id=2b78d08e31e7

# 修復後恢復
cronjob action=resume job_id=64699af8dccf
cronjob action=resume job_id=2b78d08e31e7
```

---

## 覺結界備註
- 兩 job 已 `pause`（非刪除），保留可恢復，符合「不帶病上線」——error 狀態不靜默空轉、也不丟失設定。
- 恢復前務必確認根因已除，否則會再次 error 並（64699）重新推播 Telegram 噪音。
