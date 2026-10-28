# @esggo/mcp-gateway — tzin 試點

依 2026-10-28 評估決議導入的 tzin（contract-first TypeScript framework）試點服務。
目的：以最小範圍驗證契約式開發與 AI 原生（MCP）整合的實際效益，試點通過後再決定是否擴大採用。

## 範圍與邊界（評估結論）

| 項目 | 決議 |
| --- | --- |
| Next.js 主應用 | 不動，`app/api/**` 維持現狀 |
| 資料層 | 不使用 `@carlos-tzin/tzin/db`；以 Supabase REST 唯讀存取（fetch） |
| 即時功能 | 不使用 tzin channels/presence；即時需求一律走 Supabase Realtime |
| 部署 | 僅限私有網路（VPC / 內網）；對外暴露前必須先加認證層 |
| 依賴 | 僅 `@carlos-tzin/tzin`（MIT、無 Google 相依，符合 De-Google 政策） |

## 執行

```bash
pnpm install
pnpm -F @esggo/mcp-gateway dev          # 開發伺服器（hot reload）
pnpm -F @esggo/mcp-gateway typecheck    # 嚴格 tsc
```

環境變數（皆為選配；未設定時 /regulations 回 503，/health 正常）：

| 變數 | 用途 |
| --- | --- |
| `SUPABASE_URL` | Supabase 專案 URL |
| `SUPABASE_SERVICE_ROLE_KEY` | service role 金鑰（僅私有網路可用） |
| `PORT` | 監聽埠（預設 8787） |

## 試點驗收標準

1. 契約同步產生之 OpenAPI 3.1 文件與 MCP 端點可被 Ollama agent 消費。
2. 新套件不影響根 workspace 建置（pnpm frozen-lockfile、Docker Build Test）。
3. 型別成本隨端點數線性增長（TS Matrix 量測）。
4. 維運負擔可接受（Security Scan 無新增警示）。
