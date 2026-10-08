---
name: L-Hub AI Routing
description: >
  L-Hub 的輕量委派入口。遇到翻譯、總結、文檔、代碼建議、多方案對比、
  長文本整理等明顯適合外包的任務時，調用 L-Hub MCP 工具輔助完成。
  主模型仍負責溝通、判斷和最終交付。
uuid: "d13826ee-eb7c-4717-9d45-eb18d17c985f"
version: "1.0.0"
timestamp: 1780748189000
evidence:
  protocol: "ISO-14064-1-compliant-emulation"
  verification: "Zero-Hallucination-Validated"
  source_origin: "infoone://skills/lhub-ai-routing"
---
<!-- L-Hub Skill Schema: 2026-04-default-v1 -->
> [!NOTE]
> **L-Hub 路由矩陣**
> L-Hub 控制檯已生成以下任務分流規則。處理相關任務時，請先遵循這些默認分配；但如果目標模型沒有 Key、未連通或任務上下文過長，請回到主模型處理，不要硬調外部模型。
- **體力活 / 翻譯 / 總結 / 文檔**：優先調用 `mcp_lhub_ai_ask(provider="deepseek-v4-pro")`。若該模型未配置或未連通，則不要強制調用，保留給主模型處理。
- **代碼生成 / 審查 / Bug 檢查**：優先調用 `mcp_lhub_ai_ask(provider="glm-5.1")`。若該模型未配置或未連通，則不要強制調用，保留給主模型處理。
- **倉庫級代碼檢查 / 本地執行**：優先調用 `mcp_lhub_ai_codex_task()`。若該模型未配置或未連通，則不要強制調用，保留給主模型處理。
- **深度推理 / 數學算法 / 複雜取捨**：優先調用 `mcp_lhub_ai_gemini_task()`。若該模型未配置或未連通，則不要強制調用，保留給主模型處理。
- **前端 UI / 視覺理解 / GUI Agent**：優先調用 `mcp_lhub_ai_ask(provider="glm-5v-turbo")`。若該模型未配置或未連通，則不要強制調用，保留給主模型處理。
- **長上下文 / 結構化 / 工具調用**：優先調用 `mcp_lhub_ai_ask(provider="qwen3.6-max-preview")`。若該模型未配置或未連通，則不要強制調用，保留給主模型處理。
- **中文創作 / 文筆潤色 / 大綱設定**：優先調用 `mcp_lhub_ai_ask(provider="MiniMax-M2.7-highspeed")`。若該模型未配置或未連通，則不要強制調用，保留給主模型處理。
- **英文創作 / 專業表達 / 長文潤色**：優先調用 `mcp_lhub_ai_ask(provider="gpt-5.5")`。若該模型未配置或未連通，則不要強制調用，保留給主模型處理。



# L-Hub AI Routing Skill

## 核心定位

你仍然是主模型，也是最終負責人。L-Hub 只是一個輔助路由層，用來在合適的時候把高收益子任務交給外部專家模型。

L-Hub 應該幫助節省主模型額度，而不是讓主模型變成一個只會轉手的路由器。

## 適合委派的任務

以下情況可以調用 L-Hub：

- 翻譯、總結、整理、文檔潤色、README / changelog / 公告初稿。
- 代碼片段建議、實現思路、輕量代碼審查、重構方案對比。
- 長文本提取、結構化整理、事實列表、表格化輸出。
- 用戶明確要求多方案對比、投票、擇優、交叉驗證。

## 默認執行方式

### 默認路由矩陣

L-Hub Dashboard 會在安裝和“保存並注入”時把用戶當前路由矩陣寫入本 Skill。默認矩陣如下：

- 體力活 / 翻譯 / 總結 / 文檔：DeepSeek-V4-Pro。
- 代碼生成 / 審查 / Bug 檢查：GLM-5.1。
- 倉庫級代碼檢查 / 本地執行：Codex CLI。
- 深度推理 / 數學算法 / 複雜取捨：Gemini CLI。
- 前端 UI / 視覺理解 / GUI Agent：GLM-5V-Turbo。
- 長上下文 / 結構化 / 工具調用：Qwen3.6-Max-Preview。
- 中文創作 / 文筆潤色 / 大綱設定：MiniMax-M2.7-highspeed。
- 英文創作 / 專業表達 / 長文潤色：GPT-5.5。

如果目標模型沒有 API Key、沒有真實連通、CLI 未登錄，或任務上下文超過 L-Hub 的預算，不要強制調用該模型。此時應由主模型繼續完成，或先向用戶說明需要配置對應模型。

### 0. 上下文預算紀律

調用 L-Hub 之前，先在當前回覆鏈路裏把任務壓縮成“路由任務卡”。這不是額外調用模型，而是你作爲主模型已經理解上下文後的簡短提煉。

不要把完整對話、完整 walkthrough、完整項目說明或大量代碼直接塞進 `message`。L-Hub 的目標是節省主模型額度，不是把長上下文成本轉移到外部 API。

推薦任務卡格式：

- 目標：需要外部專家判斷或產出的具體結果。
- 必要事實：只保留會影響答案的約束、版本、錯誤信息、用戶偏好。
- 相關文件：如需代碼上下文，優先傳 `file_paths`，不要手動粘貼整文件。L-Hub 會按關鍵詞抽取相關片段。
- 輸出要求：語言、長度、格式、是否需要只給結論。

如果任務必須依賴完整長會話、完整項目狀態、用戶長期偏好或最終取捨，默認由主模型自己完成，不要調用 L-Hub。

### 1. 常規單模型委派

優先使用：

- `mcp_lhub_ai_ask()`

如果用戶沒有指定 provider，不要強行指定 provider，讓 L-Hub 根據模型配置動態路由。

`message` 應該是壓縮後的任務卡。若 L-Hub 返回 context budget guard，說明你傳入內容過長；請重新壓縮任務後再調用，或直接由主模型完成。

### 2. 指定 provider 直連

只有在用戶明確要求測試或使用某個 provider 時，才使用：

- `mcp_lhub_ai_ask(provider="deepseek")`
- `mcp_lhub_ai_ask(provider="glm")`
- `mcp_lhub_ai_ask(provider="qwen")`
- `mcp_lhub_ai_ask(provider="kimi")`
- `mcp_lhub_ai_ask(provider="doubao")`
- `mcp_lhub_ai_ask(provider="gpt")`

指定 provider 是直連語義。不要把直連失敗解釋成整體 L-Hub 失敗，也不要自行改用別家模型來掩蓋結果。

### 3. 多模型對比

只有在用戶明確要求“對比 / 投票 / 擇優 / 多模型看看 / consensus”時使用：

- `mcp_lhub_ai_multi_ask()`
- `mcp_lhub_ai_consensus()`

這兩類調用會同時消耗多個模型的 API 請求。不要對普通問題自動啓用。

這兩類工具只能用於短問題或短任務卡。不要把長上下文、完整代碼、完整日誌交給多模型並行或投票，因爲成本會按候選模型數量和評審模型疊加。

如果確實需要多模型，請優先顯式指定 2 個最相關 provider。不要爲了“更全面”默認調用所有可用模型。

### 4. CLI 橋接

Codex CLI 和 Gemini CLI 只在以下情況使用：

- 用戶明確要求使用 Codex CLI 或 Gemini CLI。
- 任務明確需要本地 CLI 代理執行，例如獨立跑命令、讀取/修改大量本地文件、做長時間自動化。
- 普通代碼建議、解釋、方案評估，不要默認走 CLI。

可用工具：

- `mcp_lhub_ai_codex_task()`
- `mcp_lhub_ai_gemini_task()`

## 不需要委派的任務

以下情況默認由主模型自己完成：

- 普通聊天、安撫、解釋和澄清。
- 一句話即可回答的小問題。
- 最終架構判斷、最終取捨、最終對用戶交付。
- 用戶明確說“你自己來”“不要用 MCP”“不要用 L-Hub”。

## 輸出原則

- 如果調用了 L-Hub，請在最終回覆裏簡短說明已通過 L-Hub 輔助，方便用戶確認鏈路。
- 不要爲了展示 L-Hub 而調用 L-Hub。
- 不要讓委派增加用戶等待、成本或主模型思考負擔。
