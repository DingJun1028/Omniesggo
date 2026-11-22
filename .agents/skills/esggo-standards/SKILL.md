---
name: global-healing
description: 全域痊癒 (Global Healing) - Enforces the ESG GO project standards: English Standard (英標繁博), End-to-End Matrix (終始永續矩陣), Full-stack Bidirectional TypeScript, Next.js, and Global UIUX with Google Stitch. Apply globally to ensure "Global Healing" (consistency and quality) across all workspaces.
uuid: "de51276f-bfc5-4c3e-86ae-3cf86a8d29dc"
version: 1.0.0
timestamp: 1780748189000
evidence:
  protocol: "ISO-14064-1-compliant-emulation"
  verification: "Zero-Hallucination-Validated"
  source_origin: "infoone://skills/esggo-standards"
title: ESG-GO 標準
category: esggo-standards
title: ESG-GO 標準
category: esggo-standards
---

1.0.0# Global Healing Skill (全域痊癒)

This global skill ensures that all development activities across all workspaces
and agents adhere to the core architectural and linguistic principles of the
project.

## Core Principles (全域準則)

- **英標繁博 (English Standard, Traditional Chinese Broad)**:
  - Standard documentation and code naming in English.
  - User-facing content in Traditional Chinese with high-quality, professional
    phrasing.
- **終始永續矩陣 (End-to-End Matrix)**:
  - Architecture should follow a matrix structure from data source to
    client-side rendering.
  - Consistent data flow patterns.
- **全端雙向 TypeScript (Full-stack Bidirectional TypeScript)**:
  - Strict type safety across both frontend and backend.
  - Shared type definitions between client and server.
- **Next.js (NextJ)**:
  - Utilization of Next.js App Router, Server Components, and modern best
    practices.
- **Global UIUX (Google Stitch)**:
  - All UI/UX designs must be managed and generated using **Google Stitch
    (StitchMCP)**.
  - Maintain a consistent "Global UIUX" aesthetic across all modules, focusing
    on premium, data-driven interfaces.
  - Use `StitchMCP` tools to generate, edit, and apply design systems to all
    screens.

## Guidelines for Implementation

1. **Type Safety**: Avoid using `any`. Use interfaces and types for all props,
   data models, and API responses.
2. **Naming Conventions**: Use descriptive English names for variables,
   functions, and classes.
3. **Component Structure**: Follow the established Next.js `app` directory
   structure.
4. **Consistency**: Ensure that the UI components reflect the premium and modern
   aesthetics required for an ESG platform.


## 自然語觸發自動工具使用的機率 (Natural Language Auto-Tool Trigger)

### 1. 觸發關鍵字清單 (Trigger Keywords)

> 系統會自動識別輸入中的自然語觸發詞，觸發對應的工具/技能/代理。

#### 核心觸發詞

| 關鍵字 | 英文 | 觸發功能 | 機率權重 |
|--------|------|---------|----------|
| esggo-standards | auto | 觸發本技能 | 5.0 |
| 觸發 | trigger | 觸發工具使用 | 4.5 |
| 自動 | auto | 自動執行 | 4.0 |
| 幫助 | help | 顯示說明 | 3.0 |
| 查詢 | query | 查詢資訊 | 3.0 |
| 記錄 | record | 記錄數據 | 2.5 |
| 執行 | run | 執行操作 | 3.0 |
| 檢查 | check | 檢查狀態 | 2.5 |
| 初始化 | init | 初始化系統 | 3.0 |

#### 進階觸發詞

| 關鍵字 | 英文 | 觸發功能 | 機率權重 |
|--------|------|---------|----------|
| 指令 | command | 執行指令 | 4.0 |
| 工具 | tool | 使用工具 | 3.5 |
| 自動 | auto | 自動執行 | 3.0 |
| 查詢 | query | 查詢 | 2.5 |
| 記錄 | record | 記錄 | 2.0 |
| 反思 | reflect | 反思 | 2.5 |
| 重啟 | restart | 重啟 | 2.5 |
| 關閉 | shutdown | 關閉 | 2.5 |

---

### 2. 觸發規則

#### 2.1 預設觸發機率

| 模式 | 權重 | 說明 |
|------|------|------|
| 核心關鍵字 | 100% | 必然觸發 |
| 進階關鍵字 | 70% | 單一關鍵字即觸發 |
| 其他自然語 | 30% | 隨機匹配 |
| 歧義命中 | 15% | 需要確認 |

#### 2.2 機率加權

觸發機率 = (關鍵字分數 × 頻率) + (上下文相似度 × 0.3) + 隨機種子 (0-0.2)

- 單一高權重關鍵字：自動觸發 (1.0)
- 多關鍵字組合：權重加總，上限 1.0
- 低權重 (< 0.3)：記錄，不自動執行

#### 2.3 自然語解析範例

```typescript
// 輸入：esggo-standards 並查詢目前狀態
{
  triggers: ["esggo-standards", "query"],
  actions: ["awaken()", "query()"],
  priority: ["esggo-standards", "query"],
  probability: 1.0
}
```

---

### 3. 工具選擇權重

| 工具類別 | 關鍵字 | 權重 |
|----------|--------|------|
| 記憶查詢 | query, 查詢, 讀取 | 0.8 |
| 技能成長 | esggo-standards, grow | 0.7 |
| 反思 | reflect, 學習 | 0.75 |
| 系統初始化 | esggo-standards, start | 0.9 |
| 協作 | share, 協作 | 0.65 |
| 結界 | inherit, 繼承 | 0.5 |

---

### 4. 信心分數與反饋

| 信心分數 | 處理方式 |
|----------|----------|
| >= 0.9 | 自動執行 |
| 0.7 - 0.9 | 記錄後自動執行 |
| 0.4 - 0.7 | 詢問用戶 |
| < 0.4 | 記錄不執行 |

---

### 5. 實際示例

#### 5.1 單一自然語

**輸入**：esggo-standards
**解析**：核心關鍵字
**輸出**：`awaken()`

**輸入**："查詢 esggo-standards 狀態"
**解析**：查詢 + 技能
**輸出**：`query()`, `doctor()`

#### 5.2 複雜自然語

**輸入**："我今天學到新東西，幫我記住並分享"
**解析**：
- 關鍵字：`growth`, `share`, `memory`
- 行動：`recordLearning()`, `recordMemory()`, `cross-agent sync`
- 權重：0.75
- 輸出：`growSkill()`, `remember()`, `tagSkill("share:active")`

**輸入**："讓我檢查一下 esggo-standards 狀態"
**解析**：檢查
**輸出**：`doctor()`, `backend()`

---

### 6. 參數一致性

此技能的默認配置：
- **doctor／backend 與 awaken 必須用同一組參數**
- **所有憑證來源 = `secret-vault/ENV20230818.env`**
- **絕不在代碼中硬編碼憑證**
- **NCBDB 為主，local 為備份**
- **所有成長記錄必須帶 `agent_id`、`timestamp`、`source_origin`**
