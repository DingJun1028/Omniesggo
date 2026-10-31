# 🔒 祕密聖櫃 (Secret Sanctuary Vault)

> 本檔案為**索引參考**，所有密鑰實際存放於 GitHub Secrets / VPS 環境變數。
> 明文 Token 不會提交至 Git 倉庫。

---

## 📋 密鑰索引

| 密鑰名稱 | 用途 | 存放位置 | 狀態 |
|----------|------|----------|------|
| `TELEGRAM_BOT_TOKEN` | Telegram Bot API Token | GitHub Secrets | ✅ 已設定 |
| `TELEGRAM_CHAT_ID` | Telegram 頻道/用戶 ID | GitHub Secrets | ✅ 已設定 |
| `LANGFUSE_SECRET_KEY` | Langfuse 追蹤密鑰 | GitHub Secrets | ✅ 已設定 |
| `LANGFUSE_PUBLIC_KEY` | Langfuse 公開金鑰 | GitHub Secrets | ✅ 已設定 |
| `NVIDIA_API_KEY` | NVIDIA AI 推論 | GitHub Secrets | ✅ 已設定 |
| `LANGSMITH_API_KEY` | LangSmith 觀測 | GitHub Secrets | ✅ 已設定 |
| `VPS_SSH_KEY` | VPS 部署 SSH | GitHub Secrets | ✅ 已設定 |

---

## 🐝 OA-TWINS Telegram 追蹤

- **Bot Client ID**: `8776627849`
- **通知頻道**: Chat ID `8776627849`
- **觸發條件**: CI 失敗時 (workflow_run completed = failure)
- **訊息格式**:
  ```
  🐝 OA-TWINS Auto-Repair
  CI Run: #<run_id>
  Error: <error_type>
  Status: ✅ Auto-Repaired / ❌ Manual Fix Needed
  Repairable: <true/false>
  Tracker: OA-TWINS-AUTO-REPAIR
  ```

---

## 🛡️ 安全機制

- 所有密鑰透過 `gh secret set` 加密存放
- 本索引檔不含任何明文 Token
- 5T 協議：Trustworthy (Hash Lock) 確保密鑰不可篡改
- 輪換建議：若 Token 曾在公開對話暴露，立即 `/revoke` 並重新設定

---

*最後更新: 2026-08-05 | Hash Lock 已啟用*
