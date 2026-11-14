# 📚 神器登錄冊 (Artifact Registry)

> **「萬能神器的完整目錄與狀態追蹤」**

---

## ⚔️ 神器清單

|| 編號 | 神器名稱 | 類型 | 路徑 | 狀態 |
||------|----------|------|------|------|
|| 001 | 自動修復核心 | 機制 | `esggo-auto-repair/worker/`（修復機制另見 008） | 源碼可見（2026-11-12 核實） |
|| 002 | 核心配置 | 設定 | 待釐清（原登錄路徑從未存在，倉內未見對應實作） | 待釐清 |
|| 003 | NVIDIA AI 模組 | 整合 | `src/impl/core.ts`＋`scripts/predictAndPreFetch.js`＋smart-ai-router `nvidia.ts` | 源碼可見（需 `NVAPI_KEY`，運行未驗證） |
|| 004 | Langfuse 追蹤器 | 觀察 | 倉內零實作（僅 `.env.example` 註解佔位） | 未實作 |
|| 005 | Google ADK | 整合 | `packages/oa-framework/src/adapters/adk.ts`＋`lib/services/adk/` | 源碼可見（optional peerDependency，未裝時 scaffold） |
|| 006 | LangChain 引擎 | 套件 | `oa-twins/hyper/fabric.ts`（三態探測層） | 僅探測層引用（非直接依賴） |
|| 007 | 萬能即時翻譯 | 服務 | `apps/universal-translator/` + `https://translate.esggo.co` | ✅ 實例運行 |
|| 008 | Auto-Repair Workflow | GitHub Actions | `.github/workflows/auto-repair.yml` | ✅ 啟用 |
|| 009 | TencentDB Agent Memory | 記憶後端 | `apps/tencentdb-memory/` + `https://memory.esggo.co` | ✅ 實例運行 |

> **2026-11-12 核實修訂**：001 至 006 之原登錄路徑（`Artifacts/auto-repair.json`、`Artifacts/config.json`、`Artifacts/integrations/{nvidia,langfuse,adk,langchain}.json`）經 GitHub commits API 路徑歷史查證，於 main 全程歷史從未存在；上表路徑與狀態欄已依倉內實際實作修訂，007 至 009 維持原登錄不變。逐項核實紀錄與證據層級見《Omniesggo 解說聖典》第 10 章（§10.2、§10.3）。

## 📖 聖典清單

|| 編號 | 聖典名稱 | 版本 | 路徑 | 狀態 |
||------|----------|------|------|------|
|| 001 | soul.md | v4.0 FAIR | `Codex/soul.md` | ✅ 最新 |
|| 002 | protocols.md | v4.0 | `Codex/protocols.md` | ✅ 同步 |
|| 003 | 歷史版本 | - | `Codex/archive/` | 📦 存檔 |
|| 004 | 果證印可 | 契約憑證 | `Codex/archive/fruition-certificate.md` | ✅ 54項通過 |
|| 005 | 萬能藍圖中心聖典 | 定義 | `Codex/omni-blueprint-hub-canon.md` | ✅ 已鑄造 |
|| 006 | TencentDB Memory 集成聖典 | M1 Canon | `Codex/tencentdb-memory-canon.md` | ✅ 已鑄造 |
|| 007 | OA-Team 雙蜂隊 60 畫像 | 角色聖典 | `Codex/oa-team-60-portrait.md` | ✅ 已鑄造 |

---

## ⚙️ 萬能藍圖產品 (Omni-Blueprint Products)

|| 編號 | 產品名稱 | 藍圖類型 | 路徑 | 狀態 |
||------|----------|---------|------|------|
|| P01 | 核心型別 IComponentCore | 基礎 | `apps/omni-blueprint-hub/core-types.ts` | ✅ 實作 |
|| P02 | Hub 引擎 OmniBlueprintHub | 引擎 | `apps/omni-blueprint-hub/hub-engine.ts` | ✅ 實作 |
|| P03 | 執行驗證 Demo | 驗證 | `apps/omni-blueprint-hub/hub-demo.ts` | ✅ 通過 |
|| P04 | TencentDB MemoryCore | 記憶核心 | `apps/tencentdb-memory/start-memory-core.sh` | ✅ 運行 (8420) |
|| P05 | TencentDB MemoryHub Panel | 管理 UI | `apps/tencentdb-memory/start-memory-hub.sh` | ✅ 運行 (8125) |
|| P06 | TencentDB Proxy | LLM 轉發 | `apps/tencentdb-memory/start-proxy.sh` | ✅ 運行 (8096) |
|| P07 | 萬能即時翻譯服務 | 翻譯引擎 | `apps/universal-translator/server.mjs` | ✅ 實作 |
|| P08 | Live esggo 即時轉播中心 | 直播中樞 | `apps/omni-blueprint-hub/{studio,stream,live-sync}.html` + `https://live.esggo.co` | ✅ 實例運行 |
|| P09 | 萬能語種橋樑服務 | 翻譯 API + UI | `apps/universal-translator/` + `https://translate.esggo.co` | ✅ 代碼完成 |
|| P10 | Universal-Translator 雙螢幕平台 | 直播 + 翻譯 | `apps/universal-translator/` + `deploy/`腳本 | ✅ 測試+部署完成 |

---

*最後更新: 2026-11-12 | Hash Lock 已啟用*