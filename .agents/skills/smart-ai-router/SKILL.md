---
title: Smart AI Router
name: smart-ai-router
description: ESG 領域任務的 AI 模型路由，3 級降級鏈
category: ai-router
version: 2.0.0
author: Hermes Agent
license: AGPL-3.0
platforms:
  - windows
  - linux
  - macos
metadata:
  hermes:
    tags:
      - ai-router
      - smart-router
      - fallback
    category: skill
    related_skills:
      - smart-ai-router
      - ai-routing
---

# Smart AI Router Skill

**版本：2.0.0-beta.1（測試版）**

⚠️ 此版本為測試版，請勿在生產環境使用於未充分驗證的場景。

Smart AI model routing for ESG domain tasks. Routes carbon_calculation, compliance_review, tcfd_analysis, sdg_mapping, evidence_ocr, and other ESG task types to optimal AI models with 3-level fallback chains. Upgraded with dynamic model discovery, time-travel debugging, and zero-trust security framework.

## 🧪 測試版功能
- 對話中心：整合「萬能永撰（OmniAgent）」與「萬能商情（Business Agent）」的測試界面
- 所有功能為測試用途，可能有不穩定或功能不完整
- 建議僅限內部測試環境使用

## Enhanced Architecture
- Dynamic Model Discovery: Integrated Groq, OpenRouter, Hugging Face providers
- Time-Space Rift Protocol: Event sourcing with replay & shadow testing
- Model Conversion Framework: PyTorch↔ONNX↔TensorFlow.js conversion
- Zero-Trust Security: OAG-based proof linking & artifact freezing

## ESG Task Type Router Table
| Task Type | Primary Model | Fallback 1 | Fallback 2 |
|-----------|--------------|------------|------------|
| carbon_calculation | Groq Llama 70B | Qwen 80B | Llama 90B Vision |
| compliance_review | Qwen 80B | Llama 90B Vision | Groq Llama 70B |
| gri_report_draft | Qwen 80B | Llama 90B Vision | Groq Llama 70B |
| tcfd_analysis | Qwen 80B | Llama 90B Vision | Groq Llama 70B |
| sdg_mapping | Groq Llama 70B | Qwen 80B | Llama 70B |
| evidence_ocr | Groq Llama 8B | Gemma 9B | Groq Llama 70B |
| email_archive | Groq Llama 8B | Gemma 9B | Groq Llama 70B |
| general | Groq Llama 70B | Llama 70B | Llama 90B Vision |

## Provider Discovery & Ranking
- Groq: 30 req/min, unlimited (recommended first)
- OpenRouter: 200/day, supports specialized models
- Hugging Face: Academic/enterprise models with licensing flexibility

## Model Conversion Matrix
- Format conversion capabilities: PyTorch↔ONNX↔TensorFlow.js
- Quantization support for performance optimization
- Conversion cost estimation

## Security & Compliance Protocols
- Zero-trust framework: Audit trail + hash locking
- Compliance tagging: ISO-14064-1/GRI compliance verification
- Strict access controls for ESG data flow

## Implementation Guides
- Express Gateway API integration
- Next.js API route configuration
- Shadow testing procedures
- Time-travel debugging workflow

## Testing & Validation
- Shadow testing procedures for model A/B comparison
- Time-travel debugging for complex ESG calculations
- Compliance validation workflows

## Migration Path
- v1 to v2 upgrade guide
- Configuration migration tool
- Compliance tag management

## Configuration Samples
- Production configuration
- Development/test configurations
- Shadow testing setup

## FAQ & Troubleshooting
- API rate limit handling
- Time-travel mode limitations
- Compliance verification errors

## Features
- Dynamic model discovery
- Time-travel debugging
- Zero-trust security
- Model conversion pipeline
- Shadow testing

```

## 自然語觸發自動工具使用的機率 (Natural Language Auto-Tool Trigger)

### 1. 觸發關鍵字清單 (Trigger Keywords)

> 系統會自動識別輸入中的自然語觸發詞，觸發對應的工具/技能/代理。

#### 核心觸發詞

| 關鍵字 | 英文 | 觸發功能 | 機率權重 |
|--------|------|---------|----------|
| smart-ai-router | auto | 觸發本技能 | 5.0 |
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
// 輸入：smart-ai-router 並查詢目前狀態
{
  triggers: ["smart-ai-router", "query"],
  actions: ["awaken()", "query()"],
  priority: ["smart-ai-router", "query"],
  probability: 1.0
}
```

---

### 3. 工具選擇權重

| 工具類別 | 關鍵字 | 權重 |
|----------|--------|------|
| 記憶查詢 | query, 查詢, 讀取 | 0.8 |
| 技能成長 | smart-ai-router, grow | 0.7 |
| 反思 | reflect, 學習 | 0.75 |
| 系統初始化 | smart-ai-router, start | 0.9 |
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

**輸入**：smart-ai-router
**解析**：核心關鍵字
**輸出**：`awaken()`

**輸入**："查詢 smart-ai-router 狀態"
**解析**：查詢 + 技能
**輸出**：`query()`, `doctor()`

#### 5.2 複雜自然語

**輸入**："我今天學到新東西，幫我記住並分享"
**解析**：
- 關鍵字：`growth`, `share`, `memory`
- 行動：`recordLearning()`, `recordMemory()`, `cross-agent sync`
- 權重：0.75
- 輸出：`growSkill()`, `remember()`, `tagSkill("share:active")`

**輸入**："讓我檢查一下 smart-ai-router 狀態"
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
