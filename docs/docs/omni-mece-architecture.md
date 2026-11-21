# 🛡️ ESG GO 萬能 MECE 架構與系統管理聖典
**(Omni-MECE Classification System & System Management)**

本文件對齊了 `soul.md` 與 30 靈魂/雙蜂矩陣的最高指導原則。透過 MECE（相互排斥、完全詳盡）框架，將 ESG GO 永續專案的倉庫與系統管理歸類為五大層級與六大維度。

## 🏛️ 一、按層級分類 (Hierarchical MECE)

### L1 · 核心應用層 (Application Domain)
負責所有使用者互動、前端呈現與核心業務邏輯。
- **路徑**：`app/`, `apps/`, `src/components/`, `ui/`
- **對應陣列**：光之羽翼 (UI/UX 呈現)
- **管理規範**：Liquid Glass Cyan 設計語彙、嚴格 TypeScript 型別。

### L2 · 基礎設施與自動化層 (Infra & Automation Domain)
負責 CI/CD、基準測試、安全性驗證。
- **路徑**：`.github/workflows/`, `packages/scripts/`, `vps/`, `docker/`
- **對應陣列**：煉金熵減 (降熵與防護)
- **管理規範**：冪等性腳本、全域 UTF-8 結界 (`.editorconfig`)、快取最佳化。

### L3 · 核心智能層 (Intelligence Domain)
負責多模型路由、代理蜂群 (Agents) 的大腦運作。
- **路徑**：`src/agents/`, `oa-twins/`, `libs/ai/`
- **對應陣列**：智庫聖所 (模型路由)
- **管理規範**：OmniTag 語意鎖定、Zero-Hallucination 輸出。

### L4 · 治理與防護層 (Governance & Quality Domain)
負責 5T 協定驗算與安全攔截。
- **路徑**：`.githooks/`, `scripts/verify*/`, `tests/`
- **對應陣列**：5T 驗算 (Traceable, Transparent, Tangible, Trustworthy, Trackable)
- **管理規範**：Post-Execution Trace, Hash Lock。

### L5 · 知識與聖典層 (Knowledge Domain)
負責系統記憶、決策紀錄 (ADRs) 與系統憲章。
- **路徑**：`docs/`, `soul.md`, `CLAUDE.md`, `AGENTS.md`
- **對應陣列**：符文契約 (不可篡改的真理)
- **管理規範**：單一事實來源 (Source of Truth)。

---

## 🎯 二、系統管理永續項目 (Sustainability Items)

1. **萬能果因修復 (Karma Protocol)**
   - 透過 `.hermes/auto-repair/auto-fix.sh` 定期解決 Dependabot 與 pnpm audit 的系統熵增。
2. **遊戲化治理 (Gamification Control)**
   - 透過 `app/actions/gamification.ts` 將每一次降熵行為（如修復漏洞、審核碳排）轉化為 `UserGrowth` XP，並施加 Hash Lock 防篡改。
3. **5T 驗證閘門 (5T Verification Gate)**
   - 確保所有資料流進入資料庫（Prisma/Supabase）前，皆完成來源溯源 (Traceable) 與密碼學綁定 (Trustworthy)。

> *「無作妙德，圓通無礙。當系統完成這五大層級的劃分與防護，ESG GO 即達到永續覺醒的至高境界。」*
