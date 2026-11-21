# 部署 Oracle Proxy（選用）

## 環境需求

- VPS / Render / Fly.io / Railway 任一環境
- Python 3.10+（或 Node.js 18+）
- 對應的 Oracle DB 網路權限

## 快速啟動（Python / FastAPI）

```bash
# 1. 複製 proxy 腳本上傳到 VPS
scp scripts/deploy_oracle_proxy.py user@vps:/opt/esggo-oracle-proxy/

# 2. 安裝依賴並啟動
pip install fastapi uvicorn python-cors
cd /opt/esggo-oracle-proxy
export FRONTEND_ORIGIN="https://esg-sunshine.web.app"
uvicorn deploy_oracle_proxy:app --host 0.0.0.0 --port 8080
```

## 快速啟動（Node.js）

```js
// server.js
import express from 'express';
const app = express();
app.use(cors({ origin: process.env.FRONTEND_ORIGIN }));
app.get('/health', (_, res) => res.json({ status: 'ok' }));
app.post('/exports', async (req, res) => {
  // TODO: 實作 Oracle 匯出
  res.json({ exported: req.body?.records?.length || 0, status: 'queued' });
});
app.listen(8080);
```

## 環境變數

| 變數 | 說明 | 範例 |
|------|------|------|
| `VITE_USE_ORACLE` | 前端是否啟用 Oracle 分流 | `true` |
| `VITE_ORACLE_API_BASE` | proxy URL | `https://proxy.example.com` |
| `FRONTEND_ORIGIN` | CORS 允許的前端來源 | `https://esg-sunshine.web.app` |

## 後端實作建議

1. `/health` — 回傳 `{ status: 'ok' }`，前端用於健康檢查
2. `/exports` — POST body 為 submissions/submissions 的 JSON，回傳 `{ exported, status }`
3. 如需 connector，建議用 `oracledb`（thin mode，無需 Oracle Client）
