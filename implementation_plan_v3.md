# 萬能啟示錄 v3 (OmniCore Evolution: Phase 3) - 🟢 100% 零成本/完全免費版

目標：實現 **Sonnar 威脅情資、本地 Omni-Memory 記憶庫、全端 E2E 測試固化**，三大模組齊頭並進，且**保證絕對零成本 (Zero-Cost Guarantee)**。

## User Review Required
> [!IMPORTANT]
> 為了響應您的「確認免費才開」指令，本計畫已將原先需註冊/付費的第三方 API (ZenRows) 完全移除。所有爬蟲、記憶體與 AI 算力都將 100% 依賴您的本機資源，完全免費！

## Proposed Changes

### Phase 1: Epic B - 本地 Omni-Memory 實裝 (Local Avatar Registry) [完全免費]
建立降級版本地 SQLite 記憶體，不依賴任何外部雲端資料庫，使 OmniAgent 具備長期偏好記憶功能。
#### [MODIFY] [prisma/schema.prisma](file:///C:/Project/esggo/prisma/schema.prisma)
- 新增 `OmniMemory` 與 `AvatarContext` 資料表，資料完全存放於本機 `dev.db`。
#### [MODIFY] [app/api/memory/route.ts](file:///C:/Project/esggo/app/api/memory/route.ts)
- 實作讀寫本地 Prisma SQLite 的記憶核心，並與 Ollama Context 串接。

### Phase 2: Epic A - Sonnar 威脅情資與防漂綠 (Sonnar Threat Intel) [完全免費]
**【架構調整】**：捨棄付費的 ZenRows，改用 100% 免費的開源工具 (Cheerio / Puppeteer / Playwright) 進行本地端網頁內容解析。
#### [MODIFY] [app/api/sonnar/crawl/route.ts](file:///C:/Project/esggo/app/api/sonnar/crawl/route.ts)
- 實作基於本地開源套件的 Web Scraper 邏輯，爬取公開企業永續報告與新聞。
#### [MODIFY] [app/api/sonnar/knowledge/route.ts](file:///C:/Project/esggo/app/api/sonnar/knowledge/route.ts)
- 封裝抓取結果並對接到本地端 `qwen2.5:3b-64k` 進行免 API 費用的「ESG 漂綠交叉驗證」。
#### [MODIFY] [app/sonnar/page.tsx](file:///C:/Project/esggo/app/sonnar/page.tsx)
- 重構該頁面 UI，採用最新 Liquid Glass 美學 (`OmniCard`)，並實作即時情資雷達監控介面。

### Phase 3: Epic C - E2E 自動化測試與 5T 固化 (Karma Protocol) [完全免費]
導入開源的 Playwright 進行端到端自動化測試，將現有的 Liquid Glass UI 與產報邏輯鎖定。
#### [NEW] [e2e/ui-ux.spec.ts](file:///C:/Project/esggo/e2e/ui-ux.spec.ts)
- 撰寫首頁、萬能中心等核心頁面的 DOM 與 RWD 視覺測試。
#### [NEW] [e2e/ollama-report.spec.ts](file:///C:/Project/esggo/e2e/ollama-report.spec.ts)
- 撰寫從前端觸發到後端 Ollama API 的 28 萬字產報流程驗證。

## Verification Plan
- 執行 `npx prisma db push` 驗證本地資料庫（免費）。
- 執行 `pnpm run build` 驗證編譯無誤。
- 在本機端執行 `npx playwright test` 驗證 UI 迴歸。
