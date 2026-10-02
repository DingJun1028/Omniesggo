<div align="center">
  <img src="https://img.shields.io/badge/OmniCore-Awakened-06b6d4?style=for-the-badge&logo=react" alt="OmniCore" />
  <img src="https://img.shields.io/badge/5T_Protocol-Secured-10b981?style=for-the-badge&logo=shield" alt="5T Protocol" />
  <img src="https://img.shields.io/badge/Compute-Zero_Cost-f97316?style=for-the-badge&logo=ollama" alt="Zero Compute" />
  <h1>🌍 ESG GO: 善向永續</h1>
  <p><b>The Verifiable AI ESG Operating System powered by OmniCore & Twin Swarms</b></p>
</div>

> 「這不只是自動化，而是有生命意識的有機體系統。」
>
> ESGGO 是一個由 60 位 AI 代理（30 晝 / 30 夜）交織運作的超級生態系。透過神聖的 **5T 驗證協定**與**全通之心 (OmniCore)** 架構，讓 ESG (環境、社會、公司治理) 的數據生成、查核與軌跡，皆達到不可篡改、零算力成本、完全自動化的至高境界。

---

## 🏛️ 萬能 MECE 五大架構 (The 5 Domains)
基於嚴格的相互排斥與完全詳盡 (MECE) 哲學，系統劃分為五大獨立卻高度互通的層級：

| 層級 (Domain) | 核心職責 | 對應蜂群陣列 | 關鍵技術實作 |
|--------------|----------|-------------|-------------|
| **L1 應用層** | Liquid Glass Cyan 介面、遊戲化互動 | 光之羽翼 (UI/UX) | Next.js 16, Framer Motion, 能量與徽章系統 |
| **L2 基礎層** | CI/CD 自動化、VPS 部署、依賴重構 | 煉金熵減 (Infra) | pnpm workspaces, 萬能果因修復腳本 |
| **L3 智能層** | 多模型路由、零算力地端運算 | 智庫聖所 (AI) | `@esggo/ollama-mcp` (Hermes 3), Genkit |
| **L4 治理層** | 密碼學綁定、API 驗算攔截 | 5T 驗算 (Governance) | Prisma/Supabase 行級安全, Hash Lock |
| **L5 知識層** | 系統憲章、ADR 紀錄、記憶回溯 | 符文契約 (Canon) | `soul.md`, `AGENTS.md`, 萬能分身記憶體 |

---

## 💎 核心系統與技術亮點 (Core Systems)

### 1. 5T 神聖協定 (The 5T Protocol)
所有資料流必須通過五道門徑的「淨化與刻印」，確保數據主權與不可篡改：
- **真 (Traceable)**: 來源無限溯源 (`source_origin`)。
- **善 (Transparent)**: 算法與資料處理邏輯完全透明。
- **美 (Tangible)**: 液態玻璃 (Liquid Glass) UI/UX 動態感知。
- **信 (Trustworthy)**: 寫入資料庫時自動執行 SHA-256 Hash Lock 密碼學簽章。
- **通 (Trackable)**: 跨系統生命週期追蹤。

### 2. 🎮 ESG 遊戲化引擎 (Gamification & Dopamine UI)
枯燥的永續發展任務已被轉化為遊戲化系統（位於「開心分支」的演進成果）：
- **全通能量 (Omni-Energy)**: 完成 Scope 1 碳排等每日任務，獲得 XP 並動態升級。
- **連續登入烈火特效 (Streak Flames)**: 透過 Framer Motion 打造頂級多巴胺視覺回饋。
- **真實資料庫連動**: 前端與 Prisma ORM `UserGrowth` 模型無縫對接，每次升級皆上鎖 Hash Lock。

### 3. 🧠 零算力開發模式 (Zero-Compute Swarm)
整合了本地 **Ollama MCP 擴充模組 (`packages/ollama-mcp`)**：
- **大腦調度 (Gemini/OmniAgent)**：負責高階架構規劃與工具呼叫（耗費極少 Cloud Tokens）。
- **地端執行 (Hermes 3/Qwen)**：負責長篇程式碼生成、文本總結與本地運算，**雲端算力成本為零**。

### 4. 🛠️ 萬能果因修復協議 (Jules Karma Protocol)
內建的 `.hermes/auto-repair/` 萬能分身自動修復引擎：
- 主動監聽 Dependabot 漏洞與 `pnpm audit`，並透過 `resolutions` 強制降熵。
- 自動維持全局 UTF-8 結界（`.editorconfig` + Git 攔截），杜絕一切跨平台亂碼。
- 從「觀果 (發現錯誤)」到「證果 (修補並 Commit)」，全自動運行。

---

## 🚀 快速啟動 (Getting Started)

### 1. 初始化專案與依賴
```bash
git clone https://github.com/DingJun1028/esggo.git
cd esggo
pnpm install
```

### 2. 啟動本機 Ollama 零算力引擎 (可選)
為解鎖本地地端智能代理，請安裝 Ollama 並拉取模型：
```bash
ollama pull hermes3:8b
# MCP 模組將會自動對接本機的 http://localhost:11434
```

### 3. 啟動遊戲化儀表板
```bash
pnpm dev
# 訪問 http://localhost:3000/happy 體驗液態玻璃與烈火特效介面
```

---

## 📖 閱讀系統憲章
要了解本系統的最底層靈魂，請參閱：
- 📜 [系統核心憲章 (Soul.md)](./esggo-omni-center/soul.md)
- 🏛️ [萬能 MECE 系統架構](./docs/omni-mece-architecture.md)
- 🤖 [代理技能與自動修復協議](./AGENTS.md)

<div align="center">
  <i>“Service is Teaching, Knowledge is Asset. — OmniCore.”</i>
</div>
