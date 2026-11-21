"""
scripts/deploy_oracle_proxy.py

Oracle proxy 部署腳本（Python 最小實作）。部署到 VPS/Vercel/Render：
  1. 建立一個接 /health 和 /exports 的 HTTP 服務
  2. 設定 CORS：只允許你的前端域名
  3. 設定 VITE_ORACLE_API_BASE 指向這個 proxy

範例：
  python scripts/deploy_oracle_proxy.py --port 8080
  # 或用 uvicorn / gunicorn 啟動後讓 reverse proxy 轉發

需求：
  pip install fastapi uvicorn python-cors
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import os

FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "*")
app = FastAPI(title="Oracle Proxy")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok", "oracle": "ready"}

@app.post("/exports")
async def exports(request: Request):
    records = await request.json()
    # TODO: 在此呼叫實際的 Oracle DB 匯出邏輯
    # 1. 處理 records（base64 附件解碼、轉換格式）
    # 2. 寫入 Oracle / ETL pipeline
    # 3. 回傳匯出結果
    return {"exported": len(records), "status": "queued"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8080"))
    uvicorn.run(app, host="0.0.0.0", port=port)
