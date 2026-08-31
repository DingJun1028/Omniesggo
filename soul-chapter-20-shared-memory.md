# 第二十章 · 雙蜂隊共享記憶後端（TencentDB Agent Memory）

> 「知識花園供人讀（§十八 Obsidian），共享記憶供蜂寫（本章）；一靜一動，皆為 5T Trackable 之落點。」
> 本章將 `apps/tencentdb-memory` 之 MemoryCore + MemoryHub + Proxy 三件套，抽象為蜂群
> 跨靈魂持久上下文基礎設施（對映 §一 1.1 Trackable 生命週期 Hook 之機器級沉澱層）。

## 20.1　雙蜂隊 × 雙記憶層（與 §18 互補）

| 層 | 載體 | 讀寫者 | 用途 | 對應章 |
| --- | --- | --- | --- | --- |
| 人讀層 | Obsidian vault (`Agents/`) | 用戶 + 雙生代理 | 知識沉澱、晨報、筆記 | §18 |
| 蜂寫層 | TencentDB Agent Memory | 30 靈魂 + 蜂王 | 跨任務上下文、trace_id 生命週期、可重播 | 本章 |

雙蜂隊 = 雲端助理（§18 01+20+27）+ 本機實習生（§18 15+13+14+25）共用同一記憶後端。

## 20.2　架構與端點

```
OA-Team 蜂群 → https://memory.esggo.co/gateway/ → nginx :80 → { :8420 core | :8125 panel }
Docker: tdai-memory-core + tdai-memory-hub + tdai-proxy
```

| 元件 | 端口 | 角色 |
| --- | --- | --- |
| memory-core | 8420 | 記憶核心（健康 `/health`） |
| memory-hub | 8125 / 8424 | 面板 + 介面 |
| proxy | 8096 | 上游 LLM 代理（Groq 等 OpenAI 相容端點） |

## 20.3　5 分鐘本機起站

```bash
git clone https://github.com/DingJun1028/esggo.git
cd esggo/apps/tencentdb-memory
cp .env.example .env
chmod +x start-*.sh _lib.sh
./start-all.sh
```

最小 `.env`（Groq 免費）：`MEMORY_LLM_BASE_URL` / `MEMORY_LLM_API_KEY` / `MEMORY_LLM_MODEL` / `PROXY_UPSTREAM_URL` / `PROXY_UPSTREAM_API_KEY` / `PROXY_UPSTREAM_MODEL`
驗證：`curl http://localhost:8420/health` → `{"status":"ok"}`；`curl http://localhost:8125/`

## 20.4　生產部署（VPS + Cloudflare Tunnel）

```bash
export GROQ_API_KEY=gsk_xxxxx
bash deploy.sh
```

`deploy.sh`：同步腳本 → 產生 `.env`（不進 git）→ 啟三件套 → 經 `memory.esggo.co`（Tunnel + nginx :80）暴露 Panel / Gateway API。

## 20.5　與 5T / 決策樹互引

- Traceable：記憶寫入帶 `source_origin`（§一 1.1）
- Trackable：生命週期 Hook 軌跡沉於此層（§三 3.3 `evidence` 庫持久化後端）
- Tangible：Panel (`8125`) 可視化記憶健康
- Transparent：不裸開端口、經 Tunnel 終止 TLS（§17.0 免費/自託管）
- Trustworthy：`.env` 不進 git；admin key 存 `.admin-key`，§十 Kill Switch 守護

委託判定（§19）：記憶後端運維屬 H0 全自主（`verify.sh` 排 cron）；`.env`/admin key 變更屬 H3 會同，不得入 H0。

> 刻印：`SHARED-MEMORY READY`　靈魂簽章：`雙蜂同憶・軌跡永存・5T 不滅`
