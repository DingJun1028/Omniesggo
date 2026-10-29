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
- [x] fail-closed 行為有測試保證（未設 token → 503，不静默放行）
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
