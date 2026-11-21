# 🐝 TencentDB Agent Memory — 快速開始 (Quick Start)

> OA-Team 雙蜂隊共享記憶後端。本指南讓你在 5 分鐘內於本機或 VPS 跑起 MemoryCore + MemoryHub + Proxy 三件套。

## 前置需求

- Docker 24+ 與 Docker Compose v2（或 `docker compose`）
- 一個 OpenAI 相容的 LLM API Key（本指南以 **Groq** 免費端點為例）
- bash 4+

## 1. 取得程式碼

```bash
git clone https://github.com/DingJun1028/esggo.git
cd esggo/apps/tencentdb-memory
```

## 2. 填入環境變數

```bash
cp .env.example .env
# 編輯 .env，把 REPLACE_ME 換成你的 LLM 參數
# 最小可用範例 (Groq):
#   MEMORY_LLM_BASE_URL=https://api.groq.com/openai/v1
#   MEMORY_LLM_API_KEY=gsk_xxxxx
#   MEMORY_LLM_MODEL=openai/gpt-oss-20b
#   PROXY_UPSTREAM_URL=https://api.groq.com/openai/v1
#   PROXY_UPSTREAM_API_KEY=gsk_xxxxx
#   PROXY_UPSTREAM_MODEL=openai/gpt-oss-20b
```

> ⚠️ Windows 使用者注意：`.env` 必須是 **LF 換行**。若在 Windows 編輯後出現
> `$'\r': command not found`，執行 `sed -i 's/\r$//' .env` 修復。

## 3. 一鍵啟動

```bash
chmod +x start-*.sh _lib.sh
./start-all.sh          # 本機已有鏡像直接用
# 或拉取最新鏡像：
PULL=1 ./start-all.sh
```

啟動順序：memory-core (8420) → memory-hub (8125/8424) → proxy (8096)。

## 4. 驗證

```bash
curl http://localhost:8420/health     # {"status":"ok",...}
curl http://localhost:8125/           # Panel HTML
```

容器狀態：`docker ps --format '{{.Names}} {{.Status}}'` 應見三個 `tdai-*` healthy。

### 經 nginx / Cloudflare Tunnel 層驗證

本地直接打容器埠（上一步）與經 nginx `:80` 是兩條路徑。nginx 依 `server_name memory.esggo.co` 匹配虛擬主機，
**本地驗證 nginx 層時必須帶 `Host` 標頭**，否則會落到 default server 而得到 404/500（非部署故障，純測試方法問題）：

```bash
# 必須帶 Host header 才會匹配 memory.esggo.co 的 server block
curl -H "Host: memory.esggo.co" http://localhost:80/gateway/health   # {"status":"ok",...}
curl -H "Host: memory.esggo.co" http://localhost:80/                 # Panel HTML

# 線上 (經 Cloudflare Tunnel, Host 由 Tunnel 自動帶入, 無須手動):
curl https://memory.esggo.co/gateway/health     # {"status":"ok",...}
curl https://memory.esggo.co/                   # Panel HTML
```

## 5. 生產部署 (VPS + Cloudflare Tunnel)

專案已內建最佳實踐部署（不裸開端口，經 Tunnel 終止 TLS）：

```bash
# 在 VPS 上
export GROQ_API_KEY=gsk_xxxxx        # 或從 Secret 注入
bash deploy.sh
```

這會：
1. 同步腳本到 `/opt/esggo/apps/tencentdb-memory/`
2. 用 Groq key 產生 `.env`（不進 git）
3. `./start-all.sh` 啟三件套
4. 經 `memory.esggo.co`（Cloudflare Tunnel + nginx :80）暴露：
   - Panel: `https://memory.esggo.co/`
   - Gateway API: `https://memory.esggo.co/gateway/health`

## 架構

```
OA-Team 蜂群 → https://memory.esggo.co/gateway/ → nginx :80 → { :8420 core | :8125 panel }
Docker: tdai-memory-core + tdai-memory-hub + tdai-proxy
```

## 常用指令

| 指令 | 用途 |
|------|------|
| `./start-all.sh` | 啟動三件套 |
| `./stop-all.sh` | 停止並移除容器 |
| `./verify.sh` | 端到端健康檢查 |
| `cat .admin-key` | 查看 admin key（首次啟動生成） |

## 疑難排解

- **Permission denied (VPS)** → `sudo chown -R ubuntu:ubuntu /opt/esggo`
- **腳本無法執行** → `chmod +x start-*.sh _lib.sh`
- **`$'\r': command not found`** → `sed -i 's/\r$//' .env`
- **鏡像拉取慢/超時** → `nohup PULL=1 ./start-all.sh &` 背景跑，再 `docker ps` 輪詢
- **本地 `curl localhost:80/gateway/health` 得 404 / `localhost:80/` 得 500** → 這不是故障。nginx 依 `server_name memory.esggo.co` 選虛擬主機，用 `localhost` 當 Host 會落到 default server。改帶 `Host` 標頭：`curl -H "Host: memory.esggo.co" http://localhost:80/gateway/health` 即回 200。線上經 Cloudflare Tunnel 會自動帶正確 Host，不受影響。

---
*源自 TencentCloud/TencentDB-Agent-Memory，由 ESG-GO OA-Team 整合至 esggo 聖櫃。*
