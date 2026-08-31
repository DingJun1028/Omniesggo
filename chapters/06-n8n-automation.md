# Ch.06 n8n 自動化排程

> 用 n8n 把蜂群每週報告、HTTPS 強制、資料 pipeline 串起來；金鑰失效自動回落免費路徑。

## 關鍵節點

| 節點 | 角色 |
|---|---|
| Cron | 每週觸發 |
| HTTP Request | 呼叫 ESGGO `/api/cron` |
| Telegram/Slack | 分發結果 |
| Error Trigger | 失敗回報 |

## 優雅回落規則

- Runway / OpenAI / ElevenLabs 金鑰失效 → 自動回 `edge-tts` + `Pillow`
- 任一節點失敗 → 進入 retry queue，最終寫入 `failed` + 錯誤紀錄

## 驗證

- [ ] n8n workflow JSON 可匯入無誤
- [ ] Cron 觸發 `/api/cron` 401/200 分際正確
- [ ] 失敗時 `failed` 紀錄可查
