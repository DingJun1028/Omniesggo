# OmniAgent Gateway v3.0 — Connection Guide

VPS 上跑的 OmniAgent 閘道(`apps/gateway/omni-server.mjs`, pm2 `omniagent-gateway`),
負責讓其他 VPS / 裝置 / agent 經 OmniAgentBus 網狀網路互聯。

## 接入方式（兩種）

### A. HTTPS + WSS（推薦，唯一對外公開路徑）
Cloudflare 邊緣 TLS 終結 → VPS:80 (nginx `omniagent-sub`) → `127.0.0.1:8642`。

- REST base: `https://omniagent.esggo.co`
- WebSocket: `wss://omniagent.esggo.co/ws`  (OmniAgentBus Bridge 廣播頻道)

### B. 本機（VPS 內部）
- `http://127.0.0.1:8642` / `ws://127.0.0.1:8642`
- 用途：VPS 上其他服務（esggo-core / Next.js）呼叫 gateway。

> ⚠️ 公網裸 `http://161.118.248.180:8642` 已收斂為只聽 localhost（2026-07-11, PR #232）。
> 直接連 IP:8642 會被拒（MITM 風險 + 繞過 Cloudflare WAF）。請一律走子域 TLS。

## 認證
- 需 API key：`X-Omni-Token` / `X-Api-Key` / `Authorization: Bearer <key>` header。
- key 存於 VPS `apps/gateway/.env` 的 `GATEWAY_API_KEY`，由 pm2 啟動時讀入。
- 免認證端點（僅資訊揭露，不執行、不花錢）：`/health` `/status` `/models` `/skills` `/sonnar/status`
- 需認證端點（會調 LLM / 執行）：`/execute` `/stream` `/omni-jules` `/evolve` `/esg/skills/:taskType`

### WebSocket 認證（`WS_AUTH_TOKEN`）
| 情況 | 行為 |
|------|------|
| `WS_AUTH_TOKEN` **未設定** | 不認證，任何 client 皆可連線（既有行為，向後相容）。啟動時 console 會印 `WS AUTH: ⚠️ 未啟用` 警告。 |
| `WS_AUTH_TOKEN` **有設定** | 必須帶 token，否則 handshake 收到 `HTTP/1.1 401 Unauthorized` 且 socket 直接 destroy。 |

token 來源（依序）：query `?token=` / `?access_token=` → header `X-Omni-Token` / `X-Api-Key` / `Authorization: Bearer` → `Sec-WebSocket-Protocol`（支援 `['bearer', TOKEN]`、`['auth.TOKEN']`、`['token.TOKEN]`、`[TOKEN]`）。
比對用 `crypto.timingSafeEqual`（長度先比，避免 timing leak）。

```bash
# 啟用（建議值 ≥32 bytes 亂數）
# 注意：必須寫進 .env 或 export，單純賦值只是 shell 變數，
# 不會傳進 gateway 子行程 —— 照抄舊寫法會看似啟用、實際仍未認證。
printf 'WS_AUTH_TOKEN=%s\n' "$(openssl rand -hex 32)" >> apps/gateway/.env
# 套用並重啟（PM2 需 --update-env 才會帶入新變數）
pm2 reload ecosystem.config.js --update-env
```

`apps/gateway/.env` 不可進版控（已在 `.gitignore`）。確認生效：啟動日誌應出現
`WS AUTH: ✅ 已啟用`；若顯示 `⚠️ 未啟用` 代表變數沒進到行程。

### 瀏覽器 WebSocket 認證

瀏覽器 WS **無法自訂 header**，因此有兩種可行方式（任選其一）：

```js
// 方式 1：query token（URL 會進 access log / history，務必只用 wss://）
new WebSocket('wss://gateway.example.com/?token=XXX');

// 方式 2：subprotocol（token 不出現在 URL，推薦）
new WebSocket('wss://gateway.example.com/', ['bearer', 'XXX']);
```

## 端點速查
| Method | Path | Auth | 說明 |
|--------|------|------|------|
| GET  | `/health`        | 否 | 健康（clients / errors） |
| GET  | `/skills`        | 否 | 技能註冊表（8 absorbed/transcended） |
| GET  | `/models`        | 否 | 免費模型清單 |
| POST | `/execute`       | 是 | 標準 AI 任務 |
| POST | `/stream`        | 是 | SSE 串流輸出 |
| POST | `/omni-jules`    | 是 | OmniJules 自癒 |
| POST | `/evolve`        | 是 | OmniAgent→OmniAgent 演化 pull |
| POST | `/swarm/broadcast` | 是 | 蜂羣任務事件中繼（廣播所有 WS client） |
| POST | `/sync` (AgentBus) | 是 | 狀態同步廣播 |

## 連線範例（裝置端）
```js
// WebSocket 加入 OmniAgentBus
const ws = new WebSocket('wss://omniagent.esggo.co/ws', {
  headers: { 'X-Omni-Token': process.env.GATEWAY_API_KEY }
});
ws.on('message', (m) => {
  const evt = JSON.parse(m);
  if (evt.type === 'CONNECTED') console.log('OmniAgentBus bridged');
  // SWARM / SYNC / 心跳 廣播事件
});

// REST 執行任務
fetch('https://omniagent.esggo.co/execute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-Omni-Token': process.env.GATEWAY_API_KEY },
  body: JSON.stringify({ task: 'draft GRI report', skillId: 'gri_report_draft' })
});
```

## 架構
```
[其他裝置/agent] ──TLS──> Cloudflare (omniagent.esggo.co)
                              │ 邊緣 SSL
                              ▼
                         VPS :80 (nginx omniagent-sub)
                              │ proxy_pass 127.0.0.1:8642
                              ▼
                   omni-server.mjs (pm2 omniagent-gateway, 只聽 127.0.0.1)
                              │ OmniAgentBus WebSocket broadcast
                              ▼
                  esggo-core / 其他已連線 WS client
```

## 運維
- 重啟：`pm2 restart omniagent-gateway`
- 日誌：`pm2 logs omniagent-gateway`
- 輪換 key：改 `apps/gateway/.env` 的 `GATEWAY_API_KEY` → `pm2 restart omniagent-gateway`
  （舊 key 立即失效；所有裝置端需同步新 key）
- 部署：改 `apps/gateway/*` 經合規 PR 合併 main → GitHub Actions CD 自動部署。
