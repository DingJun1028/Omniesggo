---
tags: [esggo, self-healing, oa-twins, 5t, webhook, ollama]
created: 2026-08-29
source_origin: GitHub-Actions-Error
co_authors: [QueenBee, OA-Twins]
---

# Self-Healing Engine v0.5.0

> 自動接收 GitHub Actions 失敗通知，透過 Ollama LLM 遞迴修復並部署的自治系統。

## 架構

```
GitHub Actions → Webhook (HMAC-SHA256) → Self-Healing Engine (:8792)
                                          ↓
                                    Ollama qwen3:8b 修復
                                          ↓
                                    沙箱驗證 (typecheck + test)
                                          ↓
                                    5T 治理簽章 + HEALED
```

## 核心檔案

| 檔案 | 説明 |
|------|------|
| `server.mjs` | FastAPI 風格 Webhook 接收器，含 HMAC 驗證 |
| `gmail-poller.mjs` | IMAP 60s 輪詢 + Gmail Pub/Sub 雙模式 |
| `telegram-notifier.mjs` | Telegram Bot 修復通知 |
| `ecosystem.config.cjs` | PM2 生產配置 |

## 5T 治理

- **Traceable**: `source_origin: GitHub-Actions-Error`
- **Trackable**: UUID + 生命週期 Hook
- **Tangible**: Telegram 動態回報
- **Transparent**: 零幻覺驗算
- **Trustworthy**: SHA-256 Hash Lock + JWT

## API 端點

| 端點 | 説明 |
|------|------|
| `POST /webhook/github` | GitHub Actions 失敗事件 |
| `POST /webhook/gmail` | Gmail 錯誤通知 |
| `GET /api/tasks` | 任務狀態 |
| `GET /api/5t` | 5T 狀態 |
| `GET /health` | 健康檢查 |

## 部署

- VPS: `https://self-healing.esggo.co`
- 埠號: 8792
- 模型: Ollama qwen3:8b
- SSL: Let's Encrypt (2026-11-26)

## 已知限制

1. 無 Gmail App Password（IMAP 需要 16 位應用程式密碼）
2. 無 WebSocket 即時通知
3. 無 PWA 離線支援

## 進化路線

- [ ] Gmail 輪詢啟用
- [ ] WebSocket 即時通知
- [ ] PWA 離線支援
- [ ] 多模型支援（Gemma4、Qwen2.5）
