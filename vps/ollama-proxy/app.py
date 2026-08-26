"""
Ollama Proxy (方式 B) — FastAPI 自管代理, 帶 API Key 驗證
自行部署, 不依賴 NemoClaw 的 ollama-proxy。

功能:
  - 擋在 Ollama (127.0.0.1:11434) 前面
  - 所有請求需帶 X-API-Key header (值從環境變數 OLLAMA_PROXY_KEY 讀, 該變數存於秘密聖櫃 ENV20230818.env)
  - 轉發所有路徑到 Ollama, 支援流式 (SSE)

部署 (VPS):
  pip install fastapi uvicorn httpx
  export OLLAMA_PROXY_KEY="$(grep OLLAMA_PROXY_KEY ~/secret-vault/ENV20230818.env | cut -d= -f2)"
  export OLLAMA_BACKEND=http://127.0.0.1:11434
  uvicorn app:app --host 0.0.0.0 --port 11435   # 監聽 11435, 不衝突 Ollama 11434

呼叫端:
  curl -H "X-API-Key: 你的key" http://vps:11435/api/generate -d '{...}'
"""

import os
import httpx
from fastapi import FastAPI, Request, Header, HTTPException
from fastapi.responses import StreamingResponse

app = FastAPI(title="Ollama Self-Proxy")

BACKEND = os.environ.get("OLLAMA_BACKEND", "http://127.0.0.1:11434")
EXPECTED_KEY = os.environ.get("OLLAMA_PROXY_KEY", "")

if not EXPECTED_KEY:
    # 啟動時警告, 但不阻擋 (讓你知道沒設 key)
    print("[WARN] OLLAMA_PROXY_KEY 未設定 — 代理將拒絕所有請求")


async def verify_key(x_api_key: str = Header(None)):
    if not EXPECTED_KEY:
        raise HTTPException(500, "proxy key 未配置 (聖櫃 ENV20230818.env 缺 OLLAMA_PROXY_KEY)")
    if x_api_key != EXPECTED_KEY:
        raise HTTPException(401, "Invalid API Key")
    return True


@app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
async def proxy(path: str, request: Request, _auth: bool = Header(None)):
    # 手動驗證 (Header 參數無法直接用 Depends 於萬用路由時)
    if not EXPECTED_KEY or request.headers.get("X-API-Key") != EXPECTED_KEY:
        raise HTTPException(401, "Invalid or missing X-API-Key")

    target = f"{BACKEND}/{path}"
    # 複製 query string
    if request.url.query:
        target += f"?{request.url.query}"

    body = await request.body()

    async def stream_resp():
        async with httpx.AsyncClient(timeout=httpx.Timeout(3600)) as client:
            async with client.stream(
                request.method, target,
                headers={k: v for k, v in request.headers.items() if k.lower() not in ("host", "x-api-key")},
                content=body,
            ) as resp:
                async for chunk in resp.aiter_raw():
                    yield chunk

    async with httpx.AsyncClient(timeout=httpx.Timeout(3600)) as client:
        # 先偵測是否流式
        async with client.stream(
            request.method, target,
            headers={k: v for k, v in request.headers.items() if k.lower() not in ("host", "x-api-key")},
            content=body,
        ) as resp:
            if "text/event-stream" in resp.headers.get("content-type", ""):
                return StreamingResponse(
                    stream_resp(),
                    status_code=resp.status_code,
                    headers={"content-type": resp.headers.get("content-type", "text/event-stream")},
                )
            data = await resp.aread()
            return StreamingResponse(
                iter([data]),
                status_code=resp.status_code,
                headers={"content-type": resp.headers.get("content-type", "application/json")},
            )


@app.get("/health")
async def health():
    return {"status": "ok", "backend": BACKEND, "key_configured": bool(EXPECTED_KEY)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=11435)
