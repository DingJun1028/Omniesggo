# @esggo/mcp-gateway — tzin 試點

依 2026-10-28 評估決議導入的 tzin（contract-first TypeScript framework）試點服務。
目的：以最小範圍驗證契約式開發與 AI 原生（MCP）整合的實際效益，試點通過後再決定是否擴大採用。
2026-10-29（issue #91 第 5 項）：加入預設拒絕認證骨架與最小權限 Supabase 金鑰路徑。

## 範圍與邊界（評估結論）

| 項目 | 決議 |
| --- | --- |
| Next.js 主應用 | 不動，`app/api/**` 維持現狀 |
| 資料層 | 不使用 `@carlos-tzin/tzin/db`；以 Supabase REST 唯讀存取（fetch） |
| 即時功能 | 不使用 tzin channels/presence；即時需求一律走 Supabase Realtime |
| 部署 | 僅限私有網路（VPC / 內網）；認證骨架已落地（default-deny），對外暴露前仍須完成防火牆規劃 |
| 依賴 | 僅 `@carlos-tzin/tzin`（MIT、無 Google 相依，符合 De-Google 政策） |

## 認證骨架（default-deny）

| 情況 | 行為 |
| --- | --- |
| `GET /health` | 唯一免認證端點（liveness probe），回 200 |
| 其餘一切路徑（`/mcp`、`/openapi.json`、`/regulations`、未來契約路由） | 須帶 token，否則 401；`WWW-Authenticate: Bearer` |
| `MCP_GATEWAY_TOKEN` 未設定 | fail-closed：受保護路徑一律 503，絕不放行 |

token 傳遞方式（擇一）：`Authorization: Bearer <token>` 或 `X-Omni-Token: <token>`（對齊既有 gateway-client.ts 慣例）。
比對採 `node:crypto timingSafeEqual`（等長 padding；長度洩漏僅及 token 長度，可接受）。

實作位置：`src/auth.ts`（純函式 `authorize` / `extractToken` / `tokensEqual` + 邊界包裝 `withAuth`）。
包裝層刻意只轉發 `fetch`：tzin createApp 的 middleware 不涵蓋 `/mcp`、`/openapi.json` 等 framework 內建路徑，故認證必須在 App 邊界實作才能涵蓋全部端點。

## 環境變數

| 變數 | 必要 | 用途 |
| --- | --- | --- |
| `MCP_GATEWAY_TOKEN` | 對外服務時必要 | 閘道 token；未設定 = fail-closed。建議 `openssl rand -hex 32` |
| `SUPABASE_URL` | 選配 | Supabase 專案 URL |
| `SUPABASE_ANON_KEY` | 選配（優先） | 最小權限唯讀金鑰路徑（anon + RLS） |
| `SUPABASE_SERVICE_ROLE_KEY` | 選配（回退） | 僅私有網路可用；anon 未設時回退，並於程式中如實標示 scope |
| `PORT` | 選配 | 監聽埠（預設 8787） |

## Weaviate Query Agent 唯讀代理（v0.4.0）

`src/query-agent.ts` 以零新依賴之最小 MCP Streamable HTTP 客戶端（JSON-RPC：initialize → tools/call），將 Weaviate 官方遠端 MCP 伺服器之兩個唯讀工具接入本閘道：

| 端點 | 對應工具 | 說明 |
| --- | --- | --- |
| `POST /agent/ask` | `query_agent_ask` | 自然語言問答（Ask Mode）；`resultEvaluation: "llm"` 時附 isPartialAnswer / missingInformation / sources |
| `POST /agent/search` | `query_agent_search` | 語意搜尋（Search Mode）；支援 limit / offset / effort / filtering / diversityWeight |

| 環境變數 | 必要 | 用途 |
| --- | --- | --- |
| `WEAVIATE_API_KEY` | 必要 | Weaviate Cloud 叢集 API 金鑰（與 rag_search 共用；密文永不入 repo） |
| `WEAVIATE_URL` | 必要 | 叢集 URL（映射為 X-Weaviate-Cluster-Url 標頭） |
| `QUERY_AGENT_MCP_URL` | 選配 | 覆寫 MCP 端點（預設 `https://api.agents.weaviate.io/mcp`） |
| `QUERY_AGENT_TIMEOUT_MS` | 選配 | 單一請求逾時（預設 30000，代理工具屬雲端 AI 服務，較 rag 檢索為長） |

如實揭露（與 rag_search 之關鍵差異）：

1. `rag_search` 強制 ownerId 過濾（where Equal），絕不回傳跨 owner 資料；Query Agent 以叢集層級運作，無法強制 ownerId 過濾。資料可見範圍完全由 `WEAVIATE_API_KEY` 之角色權限界定，呼叫端應使用受角色限制之金鑰。
2. 需於 Weaviate Cloud 控制台啟用 Agents 功能，且 MCP 伺服器與 client libraries 共用 Query Agent 配額；WCD 免費沙箱之每日 2000 嵌入請求等額度限制同樣適用。
3. 不支援 multi-tenant 集合與多 named vector 集合（官方 MCP 限制）。
4. 缺 `WEAVIATE_API_KEY` 或 `WEAVIATE_URL` 時端點回 503 優雅降級（與 rag_search 同模式）。
5. 端到端真實叢集驗證待 WCD 憑證交付後執行（`scripts/verify-weaviate-cloud.mjs` 為資料層驗收；本代理工具層驗收待憑證解鎖）。

## 執行

```bash
pnpm install
pnpm -F @esggo/mcp-gateway dev          # 開發伺服器（hot reload）
pnpm -F @esggo/mcp-gateway typecheck    # 嚴格 tsc
bash apps/mcp-gateway/scripts/start-intranet.sh   # 內網啟動（fail-fast 檢查 token）
pnpm vitest run apps/mcp-gateway         # 契約測試（auth + Supabase 金鑰路徑）
```

## 契約測試

`src/auth.test.ts`（根 vitest 自動抓取；套件 tsconfig 排除測試檔）：
- 純函式：pathname 解析、token 擷取（Bearer / X-Omni-Token / 空值拒絕）、恆定時間比對、authorize 判定（401/503/放行）。
- 契約層（`app.fetch`，不起伺服器）：/health 免認證 200；/regulations、/openapi.json、POST /mcp 未帶 token 401；正確 token 放行（/openapi.json 200、/mcp 進入 MCP 層回 400 而非 401）；fail-closed 503。
- resolveSupabaseKey：anon 優先、service-role 回退如實標示、皆未設 503 路徑。

## Build / Start 驗收清單（issue #91 第 5 項）

- [x] `pnpm -F @esggo/mcp-gateway typecheck` 通過（NodeNext 嚴格 tsc）
- [x] 根 vitest 抓取本套件契約測試全綠（CI test job）
- [x] fail-closed 行為有測試保證（未設 token → 503，不靜默放行）
- [x] `scripts/start-intranet.sh` fail-fast 檢查 token，僅供內網
- [ ] Dockerfile 映像建置（CI 不建置本映像；首次部署前須手動 `docker build -f apps/mcp-gateway/Dockerfile .` 驗證）
- [ ] 真實 Supabase RLS/anon 權限實測（需專案金鑰，CI 無法驗證）
- [ ] Ollama agent 對 /mcp 端到端整合（阻塞：M3 Groq key，見 soul.md §7.3 解鎖矩陣）

## 回退方式

單一 commit revert 即回復至無認證骨架版本（0.1.0）；資料層無 schema 變更、無新依賴（僅使用 node:crypto 內建）。營運中若需緊急關閉：解除 MCP_GATEWAY_TOKEN 設定即自動 fail-closed（受保護路徑 503），無需停程序式碼回退。

## 試點驗收標準

1. 契約同步產生之 OpenAPI 3.1 文件與 MCP 端點可被 Ollama agent 消費。
2. 新套件不影響根 workspace 建置（pnpm frozen-lockfile、Docker Build Test）。
3. 型別成本隨端點數線性增長（TS Matrix 量測）。
4. 維運負擔可接受（Security Scan 無新增警示）。
