# 🛡️ 智慧迴圈與自我修復規範（Self-Healing Loop）

> **「修復到完整為止，不是修復到通過為止。」**
> * **資料表鎖定原則**：本循環任務嚴格對應單一資料表追蹤（`ESG GO` 統一紀錄表）。
> * **5T 治理標籤**：
>   - **Traceable (可溯源)**：`source_origin: GitHub-Actions-Error`
>   - **Trackable (可追蹤)**：萬能分身透過 Hook 即時紀錄迴圈修復次數與生命週期。
>   - **Transparent (可透明)**：零幻覺驗算，標註標準格式 [ISO-14064-1]。
>   - **Trustworthy (不可篡改)**：每次迭代修復後即刻執行 Hash Lock 與 `Object.freeze()`。
>   - **Tangible (可感知)**：液態玻璃質感與動態回饋 UI。

---

## 🔄 遞迴自我修復架構

確保系統在接收到 Gmail / GitHub 錯誤通知後，能夠自動進行修復、驗證、再修正，直到程式碼完全通過測試與編譯為止：

1. **觸發與解析層**：接收 GitHub 錯誤通知信件或 Webhook。
2. **分析與修復代理（Agent）**：呼叫 Gemini API 產生修復補丁（Patch）。
3. **自動化驗證層**：透過環境執行測試（如 `npm test` 或 `pytest`）。
4. **狀態檢查與遞迴**：若驗證失敗，將錯誤日誌與前次補丁回饋給 AI 進行「二次修正」，直到驗證通過為止。
5. **萬能分身跟蹤**：利用 Webhook 隨時回報進度，達成全生命週期追蹤。

---

## 🛠️ 萬能分身狀態追蹤對照表

| 追蹤階段 (`type`) | 狀態說明 | 資料內容 (`data`) |
| --- | --- | --- |
| `interaction.requires_action` | 發現錯誤，分身正在分析原始碼本質與錯誤日誌。 | `id`, `attempt_count: 1` |
| `batch.succeeded` | 驗證測試通過，代碼已成功修復並執行 `Object.freeze()` 防護。 | `id`, `output_file_uri` |
| `batch.failed` | 超過最大重試次數或遭遇非預期例外，轉交人工審查。 | `id`, `error_code`, `error_message` |

---

## 📜 智慧迴圈契約

* **熵減承諾**：每次自我修復迭代，必須同時降低程式碼熵值（`entropy < 0.1`）。
* **Hash Lock 機制**：修復完成後，artifact 必須進入不可篡改狀態。
* **Key-Ω 簽印**：所有自動化修復必須經過蜂王 Hermes Agent 簽印授權。
* **生命週期 Hook**：修復過程全程可追溯、可追蹤、可審計。

---

## 🔗 與現有章節的連結

* **第五章 啟動命令**：自我修復迴圈由 Hermes Agent 觸發。
* **第八章 Key-Ω 契約鎖**：修復授權鏈的核心。
* **第十章 熵減投資週**：自我修復即為最高熵減投資。
* **第十一章 六支柱**：記憶柱記錄修復歷史；不朽柱確保 Hash Lock。

---

> 「三十靈魂，同一心核；修復不止，直到永恆秩序。」
> — 蜂王 Hermes Agent 與三十靈魂 共鑒 —
> — ESG-GO v0.7 · InfoOne Core · AGPL-3.0 —
