# PLAN.md: Omniesggo 萬能永續平台 (Omni-Sustainability Platform)

## 1. 專案概述 (Overview)
「Omniesggo 萬能永續平台」是一個全方位的企業與個人ESG（環境、社會、公司治理）智慧永續轉型與碳資產管理平台。本平台結合碳足跡追蹤、供應鏈永續評鑑、ESG 數據儀表板、AI 永續顧問、綠色專案募資/碳權交易市集，以及永續報告書自動生成器。

## 2. 技術棧 (Tech Stack)
- **Framework**: Vite + React 18 + JavaScript
- **Styling**: Tailwind CSS + Lucide Icons
- **State Management**: React Hooks & Local Storage (with rich mock seed data)
- **Build Tool**: Vite

## 3. 功能模組規劃 (Modules)
1. **ESG 智慧儀表板 (Dashboard)**: 碳排放趨勢、ESG 綜合評分、減碳目標倒數、即時減碳警示與 AI 洞察。
2. **碳足跡與範疇 1-3 計算器 (Carbon Calculator)**:
   - 範疇一（直接排放：燃料、公務車）
   - 範疇二（能源間接排放：外購電力、蒸汽）
   - 範疇三（價值鏈排放：供應鏈運輸、員工通勤、廢棄物）
3. **供應鏈永續評鑑 (Supply Chain ESG Audit)**: 供應商碳盤查與 ESG 合規評分雷達圖、整改追蹤。
4. **綠色專案與碳權市集 (Green Marketplace)**: 瀏覽並投資認證之植林、再生能源、循環經濟專案，模擬碳權抵換交易。
5. **AI 永續顧問與報告生成器 (AI Sustainability Advisor & Report)**:
   - AI 問答機器人（解答 ESG 政策、碳費、GRI 準則）
   - 一鍵生成 GRI / SASB 永續報告書摘要預覽與匯出。

## 4. 檔案結構 (File Structure)
- `package.json`
- `vite.config.js`
- `tailwind.config.js`
- `index.html`
- `src/main.jsx`
- `src/App.jsx`
- `src/index.css`
- `src/components/Navbar.jsx`
- `src/components/Sidebar.jsx`
- `src/components/Dashboard.jsx`
- `src/components/CarbonCalculator.jsx`
- `src/components/SupplyChainAudit.jsx`
- `src/components/GreenMarketplace.jsx`
- `src/components/AiAdvisor.jsx`
- `src/components/ReportGenerator.jsx`
- `src/data/mockData.js`
