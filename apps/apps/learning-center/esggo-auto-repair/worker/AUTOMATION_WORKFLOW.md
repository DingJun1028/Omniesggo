# esggo-auto-repair 自動化完整流程

## 1. GitHub Webhook 設定
- Webhook URL: `https://esggo-auto-repair.dingjunhong1028.workers.dev/github/webhook`
- 事件: `pull_request`
- Secret: 已設定於 GitHub Secrets

## 2. Secrets 設定
- `WEBHOOK_SECRET`: 用于驗證 webhook 簽名
- `REPAIR_PAT`: GitHub Personal Access Token
- `AUTO_MERGE`: 是否自動合併 (true/false)

## 3. Queue 配置
- Queue 名稱: `esggo-repair-queue`
- Producer: esggo-auto-repair Worker
- Consumer: esggo-auto-repair Worker
- DLQ: `esggo-repair-dlq`

## 4. 監控流程
- 每 5 分鐘檢查 queue consumer 狀態
- DLQ 訊息時發送警報
- 自動重部署腳本

## 5. 故障排除
如果 queue consumer 無回應：
1. 確認 Secrets 已設定
2. 重新部署 Worker
3. 檢查 Cloudflare Dashboard
4. 手動發送測試訊息

## 6. 測試流程
發送測試 PR 事件：
```bash
curl -X POST https://esggo-auto-repair.dingjunhong1028.workers.dev/github/webhook \
  -H "Content-Type: application/json" \
  -d '{"repository":{"full_name":"DingJun1028/esggo"},"action":"opened","pull_request":{"number":999}}'
```