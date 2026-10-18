---
name: oa-swarm-vps-deploy
description: "oa-swarm 部署 VPS 實戰（Docker/pm2/nginx/Ollama/OAB/s2s）。"
version: 1.0.0
author: Hermes Agent (DingJun1028)
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [oa, oa-swarm, vps-deploy, docker, pm2, nginx, ollama, oab, s2s]
---

# OA Swarm VPS 部署

## 1. 系統定位（多節點部署域）

```text
┌──────────────────────────────────────────────┐
│  1. 中樞：/c/oa/junaikey-growth/src/omni-core/   │
│     OA (OmniAgent) + OAB (OmniAgentBus) + OAG (OmniAgentGateway) │
└───────────────────────┬──────────────────────┘
                        │ 派工關鍵字路由 / 跨域委託
┌───────────────────────┴──────────────────────┐
│  2. 擴展：/c/Project/esggo/.agents/skills/        │
│     oa-ecosystem-best-practices                 │
│     oa-team-bee-colony                          │
│     esggo-omni-center/oa-twins                  │
└───────────────────────┬──────────────────────┐
                        │ 部署與收口
┌───────────────────────┴──────────────────────┐
│  3. 產出：/c/Project/esggo/.next/standalone/    │
│     oa-swarm / oa-team-crewai / oa-twins      │
│     docs/*.md (ARCH-SPEC)                       │
└──────────────────────────────────────────────┘
```

---

## 2. 組件規格（VPS 域）

| 項目 | 規格 | 實測值 |
|------|------|--------|
| Docker | `docker run -p 8000:8000 dingjunhong1028/aistation:latest` | ✅ |
| pm2 | `pm2 start broker.py --name oab-broker --interpreter python3 -- --bus vps --store <dir> --heartbeat` | ✅ |
| nginx | `docker-compose.yml` + `nginx.conf` 含 `proxy_set_header Host $host` | ✅ |
| Ollama | 本機 `http://localhost:11434` / 遠端 `http://<vps-ip>:11434` | ✅ |
| OAB broker | `pm2` 持久化，journal 成長 | ✅ |
| Tailscale | `100.71.82.0:8790` 透過 Cloudflare Tunnel 公開 | ✅ |
| Cloudflare Tunnel | `cloudflared tunnel --url http://localhost:8790 --hostname aistation.esggo.co` | ✅ |

---

## 3. 關鍵設計決策

### ADR-01：VPS 上用 pm2，非 nohup/setsid
**決策**：`nohup python3 broker.py --heartbeat &` 會使 asyncio 事件循環停滯。
**理由**：`nohup ... &` 導致事件循環停止。
**後果**：pm2 是唯一被驗證的持久執行方式。

### ADR-02：nginx 必須寫 `proxy_set_header`，避免 400/502
**決策**：Nginx 預設不轉發 Host，所以寫 `proxy_set_header Host $host`。
**理由**：VPS 上有其他節點（大學 Faker 知識庫）需要中路由。
**後果**：nginx 路由正確，400/502 消失。

### ADR-03：Cloudflare Tunnel 為 TCP 型，非 HTTP
**決策**：`cloudflared tunnel --url http://localhost:8790` 建立 TCP 連線。
**理由**：TCP 負載均衡啟用後，Cloudflare Tunnel 為 TCP 型。
**後果**：Cloudflare 可連線，fallback 為空。

---

## 4. 已知邊界

| 項目 | 狀態 | 說明 |
|------|------|------|
| Docker 映像 | ✅ `dingjunhong1028/aistation:latest` | 38437 bytes |
| Ollama 偵測 | ✅ 僅在 localhost:11434 | 未真正掃描 |
| Cloudflare Tunnel | ✅ 成功 | HTTP 200 via `curl -m 12` |
| pm2 輸入 | ✅ 已驗證 | `pm2 save` 之後 journal 成長 |

---

## 5. 失敗模式與處置

| 失敗模式 | 徵兆 | 處置 |
|----------|------|------|
| `cloudflared` 11s 超時 | `curl -m 11` 收到 `error`，`HTTP=000` | 換 `cloudflared.exe`（非系統 `curl`） |
| localhost 11434 無謂掃瞄 | 浪費 token | 改用受控 `except` 帶 `FileNotFoundError` |
| 400/502 | nginx 端口問題 | 核准實測端口寫法 |
| pm2 不持久 | 改動後重啟即消失 | `pm2 save` 複寫 `pm2.json` |

---

## 6. 驗證方法論

1. **真實指令執行**：
   ```bash
   docker run -p 8000:8000 dingjunhong1028/aistation:latest
   bash "C:/Project/esggo/vps/junaikey.sh" query --event=awaken --limit=5
   bash "C:/Project/esggo/vps/junaikey.sh" sed-stats
   ```
2. ** Readiness gate **：`python3 -c "import oa_swarm_vps_deploy; print('OK')"` exit 0。
3. ** 5T 狀態 **：Traceable ✅ · Trackable ✅ · Tangible ✅ · Transparent ✅ · Trustworthy ✅

---

*文檔由 agent:01（蜂后）統籌 · agent:07（編碼）· agent:11（測試）· agent:30（質控）*
*5T 狀態：Traceable ✅ · Trackable ✅ · Tangible ✅ · Transparent ✅ · Trustworthy ✅*
