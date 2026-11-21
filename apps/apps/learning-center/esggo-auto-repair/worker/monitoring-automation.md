# Queue Consumer 監控自動化藍圖

## 用途
監控 esggo-auto-repair Worker 的 queue consumer 狀態，確保自動修復流程正常運作。

## 觸發方式
- 定時檢查：每 5 分鐘
- 事件驅動：DLQ 有新訊息時觸發

## 執行步驟

### 1. 檢查 queue consumer 狀態
```bash
npx wrangler queues info esggo-repair-queue
```

### 2. 檢查 DLQ 訊息數量
```bash
npx wrangler queues info esggo-repair-dlq
```

### 3. 如果 DLQ 非空，發送警報
- 發送至 Telegram/Discord
- 包含 DLQ 訊息數量

### 4. 如果 consumer 為 0，嘗試重新部署
```bash
npx wrangler deploy
```

## 推遲目標
- telegram:自動化監控頻道
- discord:自動化監控頻道