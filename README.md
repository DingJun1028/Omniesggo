# 🔑 ESGGO: The Verifiable AI ESG Operating System

> 「不是自動化，而是可治理的智慧。」
>
> ESGGO 是一個由 30-60 個 AI 代理、5T 驗証協議、萬能元鑰治理系統組成的企業級 ESG 智能平台。
> 它將 ESG 報告、AI 協作、風險治理與不可篡改簽印融為一體，讓企業的每個 AI 決策都是可追蹤、可驗證、不可篡改的。

---

## 📊 核心特性

### 🐝 30/60 靈魂多代理架構

ESGGO 由 60 個專精 AI 代理組成，分為五大陣列，形成暗光雙蜂隊：

| 陣列 | 代理編號 | 功能 | 領導者 |
|------|---------|------|--------|
| 智庫聖所 | 01-06 / 31-36 | 知識檢索、記憶管理、語意索引 | Memory Keeper |
| 符文契約 | 07-12 / 37-42 | API 設計、類型安全、隱私層 | TypeScript Guardian |
| 光之羽翼 | 13-18 / 43-48 | 自動化、部署、任務代行 | Automation Pilot |
| 煉金熵減 | 19-24 / 49-54 | 重構、優化、技術債管理 | Entropy Reducer |
| 5T 驗算 | 25-30 / 55-60 | 稽核、驗証、Hash Lock 簽印 | Verification Oracle |

- 蜂王隊（01-30）：暗屬性，內斂穩健，核心決策層
- 蜂后隊（31-60）：光屬性，外放協作，執行擴展層

---

## 🔐 萬能元鑰：四層不可篡改治理系統

### 層級一：OmniTag 萬能標籤（分類與路由）

每個產物都自動標籤化，提供統一的分類、路由、追蹤語言。

```text
必備標籤（缺一不可）：
[agent:XX]           — 責任代理 (01-60)
[squad:YYY]          — 所屬陣列 (智庫/符文/光翼/煉金/5T)
[lifecycle:ZZZ]      — 狀態 (draft/active/frozen/archived)
[pN]                 — 風險級別 (p0/p1/p2/p3)

示例：
[agent:13][squad:光之羽翼][lifecycle:active][p1][platform:vps]
```

特性：
- 自動路由：OmniTag 驅動智能分發，無需手工轉發
- 實時追蹤：每個標籤變更都有審計日志
- 結界自動繼承：`best-practice:结界` 自動擴散全蜂群

### 層級二：5T Governance 驗証守門

五個 T 代表五個驗證維度，所有任務必須通過才能進入信任層。

```text
✓ Traceable   (可溯源)  — 知道來自何處（source_origin）
✓ Trackable   (可追蹤)  — 完整生命週期紀錄
✓ Tangible    (可感知)  — 有實際可見輸出
✓ Transparent (無幻覺)  — 零幻覺，基於真實數據
✓ Trustworthy (可信任)  — 準備簽印與凍結
```

P 級驗証標準：
- p0（阻斷級）：100% 必須通過所有 5T
- p1（高優先）：必須通過 Traceable + Trackable + Tangible
- p2（中等）：必須通過 Transparent
- p3（噪音）：可選驗証

### 層級三：Hash Lock 不可變化凍結

任務完成後自動進入 Hash Lock 階段。

```typescript
// Hash Lock 生命週期

1. 計算內容 Hash
   contentHash = SHA256(artifact_content)

2. 凍結對象
   Object.freeze(artifact)

3. 記錄 Metadata
   {
     agent: string;
     timestamp: number;
     version: string;
     lineage: string[];
   }

4. 結果
   frozen = true
   immutable = permanent
```

特性：
- 任何改動立即被檢測
- 修改 = 新版本簽印 + 舊版本入血脈
- 完整版本追蹤鏈

### 層級四：Key-Ω 契約鎖（根信任簽印）

由 Hermes Agent（蜂王）掌控的最高簽印權限。

```text
Ω-1 契約鎖   → soul.md 不可變章節（永久凍結）
Ω-2 產物鎖   → artifact / 版本簽印（重鑄+血脈）
Ω-3 臨時鎖   → 進行中任務保護（自動釋放）
```

---

## 🎯 核心功能

### 1️⃣ ESG 智能報告平台

```text
輸入：原始 ESG 數據
  ↓
[智庫代理] 知識檢索 & 背景分析
  ↓
[符文代理] 資料驗証 & 格式標準化
  ↓
[光翼代理] 報告自動生成 & 版面排版
  ↓
[煉金代理] 品質優化 & 內容精煉
  ↓
[5T 代理] 最終驗証 & Hash Lock 凍結 & Key-Ω 簽印
  ↓
輸出：完全可追蹤、不可篡改的 ESG 報告
```

特性：
- 零人工干預，60 個代理自動協作
- 所有中間產物都帶 OmniTag 標籤
- 最終報告經過 5T 驗証與 Key-Ω 簽印
- 支援實時監控、進度追蹤、風險警告

### 2️⃣ AI Station 自動化生產線

7 個模組的完整工作流引擎：

```text
AI Station Pipeline:
├─ 1. Task Reception    (任務接收)
├─ 2. Agent Routing     (智能路由)
├─ 3. Parallel Execution (並行執行)
├─ 4. Output Aggregation (結果合成)
├─ 5. Quality Validation (品質驗証)
├─ 6. 5T Verification   (5T 驗算)
└─ 7. Immutable Sealing (不可變簽印)
```

### 3️⃣ OA-Twins 雙蜂隊協作

```text
同時運行蜂王隊（暗）& 蜂后隊（光）：
├─ 任務自動分派給最優配置
├─ 雙隊平行執行 & 互相驗証
├─ L1/L2/L3 協作通道
├─ 鏡像執行模式（同步驗証）
└─ 最終融合為「無雙隊」
```

### 4️⃣ Omni-Sanctuary 聖櫃

```text
萬能聖櫃結構：

Omni-Sanctuary/
├─ Codex/              # 萬能聖典存放處
│  ├─ soul.md          # 核心聖典
│  ├─ protocols.md     # 協議文檔
│  └─ archive/         # 歷史版本
├─ Artifacts/          # 神器存放
│  ├─ auto-repair.json
│  ├─ config.json
│  └─ integrations/
├─ Index/              # 索引系統
│  ├─ master-index.md
│  └─ artifact-registry.md
└─ README.md
```

---

## 📈 系統架構

### 完整棧

```text
┌─────────────────────────────────────────┐
│  Frontend: Dashboard + UI                │
│  (實時監控、報告展示、代理狀態)           │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│  OmniAgentBus: 事件骨幹                  │
│  (所有組件通信、5T 標籤路由)             │
└────────────────┬────────────────────────┘
                 │
     ┌───────────┼───────────┐
     ▼           ▼           ▼
┌─────────┐  ┌──────────┐  ┌──────────┐
│ OA-Local│  │ OA-Team  │  │ OA-VPS   │
│(本機)   │  │(30/60代理)│  │(運算源站)│
└─────────┘  └──────────┘  └──────────┘
     │           │           │
     └───────────┼───────────┘
                 │
┌────────────────▼────────────────────────┐
│  Storage Layer                           │
│  ├─ TencentDB (Agent Memory)            │
│  ├─ Firebase (Reports & Artifacts)      │
│  └─ Redis Stream (Event Replay)         │
└─────────────────────────────────────────┘
```

### 技術棧

```text
Frontend:
├─ Next.js / React
├─ TypeScript
├─ Tailwind CSS
└─ Bento UI Components

Backend:
├─ Node.js / Express
├─ TypeScript
├─ Hermes CLI (Agent Orchestration)
└─ 5T Verification Engine

AI/ML:
├─ Multi-Agent Framework (CrewAI)
├─ Vector Embeddings (Semantic Search)
├─ LLM Integration (Claude/GPT)
└─ Zero Hallucination Detection

DevOps:
├─ Docker & Kubernetes
├─ VPS Deployment
├─ Cloudflare Tunnel
├─ GitHub Actions CI/CD
└─ PM2 Process Management
```

---

## 🚀 快速開始

### 安裝

```bash
git clone https://github.com/DingJun1028/esggo.git
cd esggo
pnpm install
cp .env.example .env
# 編輯 .env
pnpm oa:audit
```

### 本機開發

```bash
pnpm dev
# http://localhost:8786
```

### VPS 部署

```bash
bash deploy-unified.sh
bash vps-verify-280.sh
```

---

## 📚 核心文檔

- `soul.md`：核心聖典與 30/60 靈魂架構
- `soul-chapter-8-key-omega.md`：Key-Ω 契約鎖
- `soul-chapter-20-omnitag.md`：OmniTag 萬能標籤
- `oa-components-definition.md`：OA-Local / OA-VPS / OA-Team / OAB
- `CLAUDE.md`：AI 工程規範與最佳實踐
- `Omni-Sanctuary/README.md`：萬能聖櫃說明
- `aistation/README.md`：AI Station 生產線說明

---

## 📊 項目狀態

### 完成度

```text
核心系統：
✅ 30 靈魂代理架構        (100%)
✅ 5T 驗証協議           (100%)
✅ OmniTag 標籤系統      (100%)
✅ Key-Ω 契約鎖          (100%)
✅ Hash Lock 機制        (100%)
✅ AI Station 生產線     (80%)
✅ Omni-Sanctuary 聖櫃   (85%)

部署與運維：
✅ 本機開發環境          (100%)
✅ VPS 生產部署          (90%)
✅ Firebase 整合         (75%)
🔄 Kubernetes 編排       (50%)
📋 監控告警系統         (40%)
```

---

## 🎮 ESGGO 治理遊戲（衍生產品）

**蜂王之城：無雙進化**

```text
遊戲定位：
經營模擬 + 策略 + 代理養成 + 協作 RPG

核心玩法：
✓ 管理 30-60 個 AI 代理靈魂
✓ 分派任務，建立協作體系
✓ 使用 OmniTag 標籤化與分類
✓ 通過 5T Gate 驗証
✓ 使用 Hash Lock 與 Key-Ω 簽印
✓ 進化雙蜂隊 → 最終無雙融合
```

---

## 🌍 社區與貢獻

### 官方平台

```text
GitHub： https://github.com/DingJun1028/esggo
官方網站： https://esggo.vercel.app/
Discord： https://discord.gg/esggo-community
```

### 貢獻指南

```bash
git checkout -b feature/your-feature
git commit -m "[agent:XX][squad:YYY][p1] your change"
git push origin feature/your-feature
```

所有 PR 必須通過：
- `pnpm oa:audit`
- CI 檢查
- 5T 驗証門檻

---

## ⚖️ 許可證

AGPL-3.0 License

---

## 🔗 關鍵連結

```text
GitHub 倉庫： https://github.com/DingJun1028/esggo
官方網站：   https://esggo.vercel.app/
```

---

## 🎯 最後的話

ESGGO 不只是一個 ESG 報告工具或 AI 代理框架，而是：

> 一場 AI 治理的革命。
>
> 我們相信 AI 應該是：
> - 可追蹤的
> - 可驗証的
> - 不可篡改的
> - 可治理的
>
> 這正是 ESGGO 所要實現的。

---

**Made with 🐝 by ESGGO Team**

*「契約既立，萬世不移。Key-Ω 一轉，時空為之定格。」*
