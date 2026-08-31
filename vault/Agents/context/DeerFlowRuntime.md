---
source_origin: esggo-omni-center/vps-deploy/deploy-deerflow.sh
created: 2026-08-13
modified: 2026-08-13
sync: mirror
co_authors: []
lifecycle: active
tags: [deerflow, langgraph, research-engine, external-runtime]
access: public-research
---

# DeerFlow 2.0 · 外部深度研究運行時

> OA-Team 30 蜂群的「技術陣列深度執行後援」，非替代。

## 定位
DeerFlow = 基於 **LangGraph** 的 AI Agent 平台，編排子代理執行：
- 深度研究（Serper / Tavily / Jina / InfoQuest 搜尋 API）
- 代碼執行（sandboxed code node）
- 網頁瀏覽（web browsing）
- 多通道通訊（Redis 串流橋接 → Telegram/Slack）

## VPS 部署拓撲（已實證 2026-08-13）
| 容器 | Port | 角色 |
|---|---|---|
| deer-flow-nginx | 2026→443 | 反向代理 + SSL |
| deer-flow-gateway | 8001 | LangGraph agent runtime + REST |
| deer-flow-frontend | 3000 | Web UI |
| deer-flow-redis | 6379 | 串流橋接 / 通道狀態 |

網域 `deerflow.esggo.co`，管理員 `dingjunhong1028@gmail.com`。

## 與 OA-Team 的關係
- **OA-Team 蜂群**：決策編排 + 5T 治理（Hermes 驅動）
- **DeerFlow**：重勞動型深度研究與代碼執行（LangGraph 驅動）
- 兩者平行互補，當前**尚未程式碼級集成**

## 集成路徑（規劃）
1. `DeerFlowAdapter`：以 `DEERFLOW_GATEWAY_URL` 為 backend，讓蜂后委派「深度研究」任務
2. 5T 標記：回傳貼 `source_origin` / `X-OA-Trace`
3. Redis 橋接：研究結果自動流回 OA 頻道

## 實證狀態
- [x] VPS 容器全 Up（healthy）
- [x] `/api/health` 回 `not_authenticated`（服務活著 + 受保護）
- [x] CSRF + Auth 防護健全（生產級）
- [ ] 實際研究任務呼叫（需憑證，待補）

## 相關
- [[05TProtocol]] · [[30Matrix]] · [[AStationSevenModules]]
