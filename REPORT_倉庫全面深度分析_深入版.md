# Omniesggo（ESG-GO）倉庫全面深度縱橫報告 — 深入細項版

> 生成：2026-11-01 | 分支 d03f425 | 版本 5.1.0 | 深入痛點與升級方向分析

---

## 一、倉庫總覽（同前版，略）

## 二、深入痛點分析

### 痛點 P1：磁碟容量危機（96% 使用率）
**現況**：C: 僅剩 ~21 GB（457G/477G），node_modules + pnpm store + 多個 .git 深度 clone 佔據大量空間。
**根因**：
- pnpm store 全域快取（`~/.pnpm-store`）未清理
- 多個 workspace 根（root / learning-center / my-worker / oa-swarm）各自 node_modules
- 大型 JSON 資料檔（esg_data.json 703KB、v5_full_data.json 1.1MB、audit-report*.json 等）
- _backup-* / _fix-backup-* / _tmp_* 目錄殘留
- .git 歷史深（shallow clone 仍 3-5 分鐘）
**影響**：本機開發受阻、CI artifact 上傳失敗風險、備份/快照成本上升
**優化/解套**：
1. `pnpm store prune` 清理未引用套件（立即釋放 GB 級空間）
2. 刪除 `_backup-*`、`_fix-backup-*`、`_tmp_*`、`tmp_*` 殘留（保留 git 歷史即可回溯）
3. 大型 JSON 資料檔移至 Supabase/外部儲存，倉庫只留 schema + 範例
4. 設定 `.gitignore` 排除 `*.log`、`node_modules`、`.next`、`dist`
5. 考慮 Windows 磁碟配額 + 定期清理 cron（`disk_audit.ps1` 已有雛形）
6. 長期：遷移至 WSL2 + ext4 磁碟，避免 NTFS 效能瓶頸

### 痛點 P2：依賴治理複雜度（overrides 80+ 條）
**現況**：`pnpm-workspace.yaml` overrides 區塊 80+ 條，涵蓋 CVE 修補、版本釘版、安全修補。
**根因**：
- 多層傳遞依賴（@google/adk → express → body-parser → qs）
- 安全掃描驅動的頻繁修補（pnpm audit / Dependabot / GHSA）
- 不同 workspace 根各自 overrides，需同步
- 註解引用不存在的 AGENTS.md 條文（#4、#7），維護者困惑
**影響**：升級風險高、lockfile 同步成本、CI --frozen-lockfile 失敗
**優化/解套**：
1. 建立 `overrides-manifest.json` 單一真相源，由腳本生成各 workspace overrides
2. 自動化：Dependabot PR → CI 驗證 → 自動合併 patch 版本
3. 移除過期註解，改以 CVE 編號 + 日期為依據（已部分實作）
4. 定期審查 overrides：移除已合併上游的修補（季度 review）
5. 引入 `pnpm audit --prod` 作為 CI 閘，但設定 reasonable threshold（critical 即敗）

### 痛點 P3：CI 流水線爆炸（36 workflows）
**現況**：`.github/workflows/` 36 條，涵蓋 5 層（硬閘門/自動修復/組裝鑄造/派遣運維）。
**根因**：
- 治理即程式碼哲學導致 workflow 細分化
- 每個產品線/應用各自 CI（learning-center-ci、ftg-build-check、deploy-ftg-static 等）
- 自動修復（auto-repair.yml）本身複雜度高
- 多部署通道（Vercel/Firebase/CF/Oracle/GHCR）各自 workflow
**影響**：GitHub Actions 分鐘數消耗、維護成本、新貢獻者認知負擔
**優化/解套**：
1. 合併相似 workflow（deploy-* 統一為 reusable workflow + matrix）
2. 引入 path-based 觸發（僅變更相關目錄才跑對應 CI）
3. 將 deployment workflow 移至 CD 層，與 CI 分離
4. 使用 GitHub Actions reusable workflows 減少重複
5. 設定 concurrency group 避免重複執行

### 痛點 P4：本機驗證缺口（32-bit Node 無法 tsc/vitest）
**現況**：DingJun PC 為 32-bit Node，無法執行 tsc/vitest，CI 為唯一驗證閘。
**根因**：Windows 10 + 32-bit Node 環境限制
**影響**：開發回饋週期長（需 push 才知結果）、CI 依賴高
**優化/解套**：
1. 安裝 64-bit Node.js（nvm-windows 管理多版本）
2. WSL2 Ubuntu 環境：原生 Linux Node，效能更好
3. Docker dev container：統一環境，避免「在我機器上能跑」
4. GitHub Codespaces：雲端開發環境，直接連 CI
5. 本地 pre-commit hook 跑 lint（eslint 可在 32-bit 跑）

### 痛點 P5：多部署通道協調複雜
**現況**：Vercel（root + htb-b2b + learning-center）+ Firebase + Cloudflare Pages + GHCR + Oracle VPS，共 7+ 通道。
**根因**：產品線多樣化、各平台特性不同
**影響**：部署順序、環境變數同步、回滾複雜度
**優化/解套**：
1. 統一環境變數管理（Vault/Secret Manager，如 Doppler 或 Infisical）
2. 部署編排器（ArgoCD / Flux）統一管理多通道
3. 藍綠部署 + 自動回滾機制
4. 健康檢查統一端點（/health + /ready）
5. 部署後 smoke test 自動化

### 痛點 P6：soul-chapter 文件維護負擔
**現況**：30+ soul-chapter-*.md 檔案，soul-lineage CI 守護血脈連續。
**根因**：版本血脈哲學，每章獨立文件
**影響**：文件同步成本、 newcomers 認知負擔
**優化/解套**：
1. 合併為單一 `soul.md` + 章節索引（已部分有 soul-full.md）
2. 自動生成章節摘要（CI 產出 soul-summary.md）
3. 版本控制：soul-chapter 改為 ADR 格式（ADR-001, ADR-002...）
4. 減少章節數量，合併相關章節

### 痛點 P7：Monorepo 建置時間
**現況**：pnpm install + build 全量需數分鐘，turbo cache 依賴本地
**根因**：32 apps + 20 packages，依賴圖複雜
**影響**：CI 時間、開發者等待
**優化/解套**：
1. Turbo remote cache（Vercel Remote Cache 或 self-hosted）
2. 增量建置：只建置變更的 package + 依賴
3. Docker layer cache for CI
4. 並行測試（vitest --shard）
5. 考慮拆分 hot path（ESGO 平台）為獨立 repo

### 痛點 P8：TypeBox 契約與 PRD 追溯維護
**現況**：TypeBox schema 為契約正本，shared/prd-matrix.json 為 PRD 追溯正本，schema-traceability CI 驗證。
**根因**：治理嚴格，每次變更需同步 schema + PRD matrix + 追溯報告
**影響**：開發摩擦、PR 審查時間
**優化/解套**：
1. 自動生成 schema-traceability 報告（scripts 已有，確保 --check 模式可靠）
2. Schema 變更 → 自動 PRD matrix 更新（code generation）
3. IDE 插件：TypeBox schema → PRD 追溯即時預覽
4. 減少追溯粒度：僅 critical path 需追溯，非核心模組放寬

---

## 三、三種升級方向

### 方向 A：雲原生現代化（Cloud-Native Modernization）
**目標**：將 monorepo 轉型為雲原生微服務架構，提升可擴展性與可觀測性。

**架構變革**：
```
┌─────────────────────────────────────────────┐
│           API Gateway (Kong/Envoy)           │
├──────────┬──────────┬──────────┬────────────┤
│ ESGO     │ FTG      │ Voice    │ HTB        │
│ (K8s)    │ (K8s)    │ (K8s)    │ (Vercel)   │
├──────────┴──────────┴──────────┴────────────┤
│        Service Mesh (Istio/Linkerd)          │
├─────────────────────────────────────────────┤
│  Supabase │ Redis │ Kafka │ Observability   │
│  (DB)     │(cache)│(queue)│ (Prom+Grafana) │
└─────────────────────────────────────────────┘
```

**關鍵步驟**：
1. 容器化：Dockerfile per app（已有根 Dockerfile，需 per-app）
2. K8s 部署：Helm charts + ArgoCD GitOps
3. 服務拆分：ESGO 平台 → 獨立服務（auth/reports/carbon/evidence）
4. 資料層：Supabase → managed Postgres + Redis cache + Kafka event bus
5. 可觀測性：OpenTelemetry + Prometheus + Grafana + Jaeger
6. CI/CD：GitHub Actions → ArgoCD → K8s rolling update

**優點**：水平擴展、故障隔離、獨立部署、可觀測性
**缺點**：運維複雜度大幅上升、成本增加（K8s cluster）、學習曲線陡
**適用**：產品成熟、用戶量增長、團隊規模擴大
**時程估計**：6-12 個月（漸進式遷移）

### 方向 B：漸進式模組化（Progressive Modularization）
**目標**：保持 monorepo 結構，但提升模組邊界清晰度與獨立部署能力。

**架構變革**：
```
esggo/ (monorepo)
├── apps/ (獨立部署單元，各自 package.json + Dockerfile)
├── packages/ (共享庫，npm publish to private registry)
├── libs/ (工具函式)
└── infra/ (IaC: Terraform/Pulumi)
```

**關鍵步驟**：
1. **模組邊界強化**：每個 app/package 定義清晰的 public API（index.ts），內部實作不外洩
2. **獨立版本管理**：changesets 自動版本號 + changelog
3. **私有 npm registry**：packages publish to Verdaccio/GitHub Packages
4. **Turbo remote cache**：Vercel Remote Cache 或 self-hosted
5. **增量 CI**：affected-based testing（turbo --filter=...[HEAD^]）
6. **環境統一**：Docker dev container + GitHub Codespaces
7. **依賴治理**：Renovate 自動 PR + 自動合併 patch

**優點**：低風險、漸進式、保持現有開發流程、成本可控
**缺點**：微服務優勢有限、仍需維護 monorepo 複雜度
**適用**：團隊規模中等、產品穩定、追求漸進改善
**時程估計**：3-6 個月

### 方向 C：AI 原生重構（AI-Native Restructure）
**目標**：將 AI 代理深度整合為核心架構，實現自癒、自演化、自部署的系統。

**架構變革**：
```
┌─────────────────────────────────────────────┐
│          AI Orchestrator (OmniAgent)         │
│  ┌─────────┐ ┌─────────┐ ┌──────────────┐   │
│  │ Planner │ │ Coder   │ │ Reviewer     │   │
│  └────┬────┘ └────┬────┘ └──────┬───────┘   │
│       └───────────┴─────────────┘           │
│              ↓ Event Bus (Agent Bus)         │
├─────────────────────────────────────────────┤
│  Self-Healing │ Auto-Repair │ Auto-Deploy   │
├─────────────────────────────────────────────┤
│  Knowledge Graph │ Vector DB │ Memory Store  │
└─────────────────────────────────────────────┘
```

**關鍵步驟**：
1. **Agent-First 開發**：每個模組由 AI agent 維護，人類審查
2. **自癒系統**：OmniCore + self-healing app 擴展為全系統自癒
3. **知識圖譜**：codebase → vector embeddings → 語意搜尋
4. **自動修復增強**：auto-repair v3 → LLM 驅動的錯誤分類 + 修復生成
5. **部署自動化**：CI 失敗 → agent 分析 → 生成 fix PR → 人類 approve → 自動部署
6. **測試生成**：AI 自動生成單元測試 + E2E 測試
7. **文件同步**：code change → auto-update docs + soul-chapter

**優點**：開發效率極大提升、自癒能力、知識積累
**缺點**：AI 可靠性風險、成本（LLM API）、需要人類 oversight
**適用**：AI 基礎設施已就位（Omniesggo 已有 30-agent swarm）、追求極致效率
**時程估計**：持續演進（3-6 個月 MVP，長期迭代）

---

## 四、三方向比較矩陣

| 維度 | A 雲原生現代化 | B 漸進式模組化 | C AI 原生重構 |
|---|---|---|---|
| 風險 | 高 | 低 | 中 |
| 成本 | 高（K8s cluster） | 低 | 中（LLM API） |
| 時程 | 6-12 月 | 3-6 月 | 3-6 月 MVP |
| 團隊要求 | DevOps + SRE | 全端 | AI 工程師 |
| 可回滾性 | 低（大改） | 高（漸進） | 中（agent 可撤） |
| 與現有架構相容 | 需重構 | 高相容 | 高相容（已有 agent 基礎） |
| 長期價值 | 高（可擴展） | 中（改善現狀） | 極高（自演化） |

## 五、建議路線
1. **短期（1-3 月）**：執行方向 B 的漸進式改善（磁碟清理、CI 合併、Turbo remote cache、Docker dev container）
2. **中期（3-6 月）**：引入方向 C 的 AI 增強（auto-repair v3 LLM 驅動、測試生成、文件同步）
3. **長期（6-12 月）**：評估方向 A 的雲原生遷移（僅在用戶量/團隊規模要求時）

**關鍵原則**：不追求一次到位，以方向 B 為基底，逐步引入方向 C 的 AI 能力，方向 A 作為長期選項保留。
