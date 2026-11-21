# 🐝 萬能語種橋樑 — 快速開始 (Quick Start)

> OA-Team 雙蜂隊共享翻譯服務。LibreTranslate → MyMemory → 原文兜底，零費用。

## 1. 安裝

```bash
cd apps/universal-translator
npm install
cp .env.example .env  # 可留空，用 MyMemory 免費引擎
```

## 2. 啟動服務

```bash
node server.mjs
# 或 PM2 常駐
pm2 start server.mjs --name universal-translator
```

## 3. 測試 API

```bash
# 健康檢查
curl http://localhost:8788/health
# => {"status":"ok","version":"1.1.0","stats":{...}}

# 單語翻譯
curl -X POST http://localhost:8788/translate \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello, world","from":"en","to":"zh"}'
# => {"text":"你好世界","engine":"mymemory","cached":false}

# 多語平行翻譯
curl -X POST http://localhost:8788/translate \
  -H "Content-Type: application/json" \
  -d '{"text":"Thank you","from":"en","targets":["zh","ja","es","fr"]}'
# => {"translations":{"zh":"謝謝","ja":"ありがとう","es":"Gracias","fr":"Merci"},...}
```

## 4. 前端使用

### 講者端 (studio.html)

1. 開 `public/studio.html`
2. 選擇來源語言 → 按「開始收音」
3. 說英文 → 瀏覽器列出轉錄 + 多語翻譯

### 觀眾端 (stream.html)

1. **VPS 部署後**：用 `https://translate.esggo.co` 觀眾
2. **本機測試**：開 `public/stream.html` → 自動連到 `/stream` SSE 端點

### 手動測試端點

```bash
# 觀眾端 (SSE)
curl -N http://localhost:8788/stream
```

## 5. 生產部署 (VPS)

```bash
bash deploy.sh
# 會：rsync → npm install → pm2 重啟 → 健康檢查
```

## API 一覽

| 端點 | 方法 | 參數 | 用途 |
|------|------|------|------|
| `/health` | GET | - | 健康檢查 |
| `/translate` | POST | `{text,from?,to?,targets?}` | 單語 / 多語翻譯 |
| `/ws` | WS | `{text,from?,to?}` | WebSocket 即時通話 (若 ws 套件可用) |

---
*透過 TencentCloud TencentDB Agent Memory 共享記憶，完整集成於 OA-Team 雙蜂隊。*