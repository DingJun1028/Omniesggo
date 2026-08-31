# Ch.05 Next.js Health + Metrics

> 一條路由承載三種視圖：簡單健康、詳細元件、Prometheus metrics。

## 路由

```
GET /api/health
GET /api/health?detail=true
GET /api/health?format=metrics
```

## 實作要點

- 回傳 JSON `{ success, data: { status, timestamp, checks? } }`
- `detail=true` 暴露 `ollama / minio / database`
- `format=metrics` 輸出 `# HELP / # TYPE` Prometheus 格式

## 線上驗證

```bash
curl -s http://127.0.0.1:3000/api/health
curl -s 'http://127.0.0.1:3000/api/health?format=metrics' | head
```

## 驗證

- [ ] `/api/health` 200 `"status":"healthy"`
- [ ] `/api/health?format=metrics` 開頭為 `# HELP esggo_up`
