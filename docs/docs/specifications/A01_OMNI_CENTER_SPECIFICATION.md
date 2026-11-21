# A01 萬能中心 (Omni-Center) 終始矩陣功能說明書

**編號**: A01 · **模組代號**: `OMNI-FACILITY-A01`  
**所屬體系**: ESG GO 善向永續系統 · **核心負責體**: OmniCore & JunAiKey  
**設計語言**: Editorial Dual-Theme Standard (Light Editorial / Dark Editorial, Zero Text Gradients)  
**5T 協議狀態**: Truth (溯源) · Goodness (透明) · Beauty (可感) · Trust (防篡改) · Transferful (全追蹤)

---

## 1. 設施定位與終極願景 (Facility Positioning & Vision)

A01 萬能中心作為全系統的「全通中樞」與「萬能心核 (OmniCore)」，是驅動六位一體智慧中樞（全知之眼、全能之核、全域之脈、全境之骨、全息之腦、全通之心）的運作總覽看板。

### 核心承諾：
1. **零漸層字體原則**：所有標題、指標數值、狀態標籤一律採用高對比純色，淺色模式下為大器手冊深墨 (`#0f172a`) 與深青 (`#0d9488`)，深色模式下為純銀白 (`#ebecef`) 與冷青光芒 (`#5EEAD4`)。
2. **終始閉環 (End-Beginning Matrix)**：從治理指令的發起（因），經由全域代理蜂群流轉（循），到最終 5T 存證鏈的顯化（果），形成全自動防篡改閉環。

---

## 2. 終始矩陣全景映射 (End-Beginning Matrix Mapping)

| 階段 (Phase) | 步驟 (Step) | 觸發與輸入 (Origin Cause) | 處理與流轉 (Process Trace) | 最終顯化 (Final Effect) | 5T 檢驗點 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **起 (Origin)** | 1. 意圖感知 | 使用者點擊「全域共振」或排程心跳 | `OmniPulse` 廣播至所有代理節點 | 系統共振率與熵值即時重算 | **Truth (真)**: 來源印記標記為 `system_heartbeat` |
| **承 (Process)** | 2. 契約稽核 | 各設施回傳存證狀態與活動日誌 | `OmniBone` 檢驗 TypeScript/Zod 契約相容性 | 異常合規項目標紅警告 | **Goodness (善)**: 算法可驗算，排除黑箱 |
| **轉 (Synthesize)**| 3. 熵減代謝 | 偵測系統冗餘緩存或過期憑證 | `OmniBrain` 自動調用熵減煉金腳本進行降解 | 釋放記憶體，更新 ADR 知識項 (KIs) | **Beauty (美)**: Editorial 卡片流暢動態，零噪點 |
| **合 (Manifest)** | 4. 5T 封印 | 彙整全域器官運作指標 | 呼叫本地 SHA-256 引擎產生命中雜湊 | 生成 A01 全通治理心跳封印鎖 | **Trust (信)**: Hash Lock 不可逆鎖定 |
| **終 (Eternal)** | 5. 全生命週期紀錄 | 封印成果寫入資料庫與日誌 | 觸發 `omnisync_execution_log` Hook | 更新全通中樞即時儀表板，提供第三方稽核 | **Transferful (通)**: 跨服務全週期追溯 |

---

## 3. 功能區塊劃分與介面規格 (UI/UX Architecture)

### 3.1 頂部導航與雙主題膠囊 (Header & Theme Capsule)
- **左側設施辨識**：
  - 模組編號膠囊：`.tag-cool` 顯示 `A01 · OMNI-CENTER`
  - 核心狀態：`SYSTEM ONLINE` 脈動燈
- **主標題**：
  - `萬能中心 Omni-Core`（純色粗體，無任何漸層）
  - 副標題：`ESGGO 永續發展無限進化 · 無作妙德 · 圓通無礙`
- **右側快捷控制**：
  - 「清新淺色 / 深色手冊」切換膠囊
  - 「強制共振同步」高對比純色按鈕

### 3.2 六器官狀態矩陣 (Hexa-Core Matrix Grid)
1. **全知之眼 (OmniEye)**：監控數據源來源驗證率與即時事件流。
2. **全能之核 (OmniCore)**：展示全域代理調度狀態與任務隊列進度。
3. **全域之脈 (OmniPulse)**：數據總線吞吐量 (Throughput) 與平均延遲 (Latency)。
4. **全境之骨 (OmniBone)**：憲章約束完整性評分與 5T 契約健康度。
5. **全息之腦 (OmniBrain)**：技術債熵值評級與自動修復觸發紀錄。
6. **全通之心 (OmniHeart)**：全域共振率 (`0% - 100%`) 與無礙流轉指標。

### 3.3 終始治理事件日誌 (Event Stream & Trace Audit)
- 即時滾動顯示各代理（OmniAgent, Antigravity, Jules, Nexus）的執行軌跡。
- 每一筆紀錄具備 `UUID`、`Timestamp`、`Origin Cause` 與 `Hash Lock`。
- 支援「一鍵複製驗證」與「下載 JSON 治理存證」。

---

## 4. 驗收標準 (Definition of Done)

1. **樣式驗收**：
   - 淺色模式下背景為 `#f8fafc`，卡片為純白，邊框為 `#e2e8f0`，文字為深墨色。
   - 深色模式下背景為 `#020617` / `#0B0F19`，卡片為深藍黑，邊框為微白透明，文字為純銀白。
   - 介面中 0 處漸層文字。
2. **功能驗收**：
   - 點擊「強制共振同步」時，共振百分比具備平滑過渡動畫並重新抓取系統各設施健康度。
   - 事件日誌可篩選「錯誤」、「封印」、「代謝」三種等級。
   - 支援「匯出 A01 全通治理報告 (PDF/JSON)」。
