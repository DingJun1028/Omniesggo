---
name: genkit-mcp-integration
description: 整合與操作 Genkit MCP Server 的核心技能，提供探索、執行、追蹤與文件查詢的最佳實踐。
uuid: "65ae9bef-a9f6-419f-a306-0c273fa9f82c"
version: "1.0.0"
timestamp: 1780748189000
evidence:
  protocol: "ISO-14064-1-compliant-emulation"
  verification: "Zero-Hallucination-Validated"
  source_origin: "infoone://skills/genkit-mcp-integration"
---

# 🚀 Genkit MCP Server Integration Skill

本技能旨在指導 Agent 如何透過 **Model Context Protocol (MCP)** 整合與操作 Genkit 專案，讓 AI 助手能有效探索 Flow、執行 Flow、查詢追蹤數據 (Traces) 以及管理 Genkit Runtime。

## 🎯 何時使用此技能 (When to use)
當使用者要求以下事項時，請**務必**優先考慮使用 Genkit MCP 提供的工具：
1. **Flow 管理與測試**：需要列出、執行或除錯專案內的 Genkit Flows。
2. **Runtime 控制**：需要啟動、重啟或關閉背景的 Genkit 伺服器 (Runtime)。
3. **Genkit 知識查詢**：需要查詢最新的 Genkit 開發指南或官方文件。

---

## 🛠️ MCP Tools (可用工具對照表)

若您具備 `genkit-mcp-server` 節點連線，請優先使用以下原生 MCP Tool：

| 分類 | 工具名稱 (Tool) | 描述 (Description) |
| :--- | :--- | :--- |
| **文件與知識** | `get_usage_guide` | 獲取特定語言 (如 js, go) 的 Genkit AI 框架使用指南。 |
| | `list_genkit_docs` | 探索並列出所有可用的 Genkit 官方文件。 |
| | `search_genkit_docs` | 透過關鍵字搜尋 Genkit 文件。 |
| | `read_genkit_docs` | 讀取指定的 Genkit 文件詳細內容。 |
| **Flow 操作** | `list_flows` | 探索並列出所有已定義的 Genkit Flows 及其輸入 Schema (非常適合在執行前確認格式)。 |
| | `run_flow` | 執行指定的 Genkit Flow。必須提供 `flowName` 與符合 Schema 的 JSON 字串 `input`。 |
| | `get_trace` | 透過 `traceId` 獲取 Flow 的詳細執行追蹤紀錄 (用於效能分析與 Debug)。 |
| **執行環境控制** | `start_runtime` | 啟動 Genkit Runtime 程序 (例如：`npm run dev` 或 `go run main.go`)。 |
| | `restart_runtime` | 重啟目前由 `start_runtime` 啟動的程序。 |
| | `kill_runtime` | 強制關閉目前的 Genkit Runtime 程序。 |

---

## 💡 最佳實踐與操作心法 (Best Practices)

1. **先確認 Schema 再執行 (Schema First)**：
   在呼叫 `run_flow` 之前，強烈建議先使用 `list_flows` 取得特定 Flow 的精確 Input Schema，避免因 JSON 格式不符導致執行失敗。

2. **精確的錯誤追蹤 (Trace Debugging)**：
   如果 `run_flow` 回報錯誤或非預期結果，請提取回傳的 `traceId`，並立即呼叫 `get_trace` 進行深度分析，不要僅依賴表面報錯盲目修改程式碼。

3. **背景服務管理 (Runtime Awareness)**：
   Genkit Flow 的執行依賴 Runtime 的存在。若遇到連線錯誤，請先嘗試 `start_runtime` 或 `restart_runtime` 確保底層開發伺服器正在健康運作中。

4. **主動查詢文件 (Documentation Driven)**：
   開發或重構 Genkit 架構前，優先使用 `search_genkit_docs` 或 `get_usage_guide` 尋找最新的官方範例，避免使用過時的 API。
