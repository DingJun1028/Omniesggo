---
name: zkp-seal
description: "Use this skill to perform Zero-Knowledge Proof (ZKP) cryptographic sealing on evidence documents and records within the ESG GO platform."
version: 1.0.0
title: ZKP 封印
category: zkp-seal
title: ZKP 封印
category: zkp-seal
---

# ZKP Seal Skill (稽覈與封印技能)

This Agent Skill equips you to handle the cryptographic sealing of ESG data and evidence. By performing a ZKP Seal, you are confirming the integrity, authenticity, and non-repudiation of a document or data row, transforming it into a "T4 Trustworthy" verified asset.

## When to use this skill

Activate this skill when the user asks to:
1. "Seal" an evidence document or record.
2. Verify or cryptographically lock a document ID.
3. Perform a ZKP (Zero-Knowledge Proof) operation.
4. "封印" (Seal) or "進行 ZKP 驗證" (Perform ZKP validation) on a specific piece of evidence.

## Instructions

To execute a ZKP seal, you MUST use the OmniAgent Native CLI tool located in the project workspace. 

Follow these steps exactly:

1. Identify the target Document ID (uuid or specific string identifier) requested by the user. If the user does not provide an ID, ask them to provide one (e.g. "請提供需要封印的文件 ID").
2. Execute the `omni.mjs` CLI tool using the following command format:
   ```bash
   node cli/omni.mjs vault seal <document_id>
   ```
3. Read the output of the CLI command.
4. Provide a structured summary of the operation back to the user, ensuring to highlight:
   - The Document ID sealed.
   - The SHA-256 Hash Lock generated.
   - The final Verification Status.

## Required Environment

Ensure that the environment variables `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are properly configured in `.env`, as the `omni.mjs` script relies on these for executing the database updates.

## Technical Details

The `omni.mjs vault seal` command performs the following backend actions:
- Simulates the ZKP generation delay (Proof-of-Work).
- Updates the `evidence_vault` table for the specific ID, setting `status` to `verified`, `zkp_proof` to `true`, and storing a unique `hash_lock`.
- Injects a verified `ZKP_SEAL` action record into the `audit_logs` table for T5 Trackability.


## 自然語觸發自動工具使用的機率 (Natural Language Auto-Tool Trigger)

### 1. 觸發關鍵字清單 (Trigger Keywords)

> 系統會自動識別輸入中的自然語觸發詞，觸發對應的工具/技能/代理。

#### 核心觸發詞

| 關鍵字 | 英文 | 觸發功能 | 機率權重 |
|--------|------|---------|----------|
| zkp-seal | auto | 觸發本技能 | 5.0 |
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
// 輸入：zkp-seal 並查詢目前狀態
{
  triggers: ["zkp-seal", "query"],
  actions: ["awaken()", "query()"],
  priority: ["zkp-seal", "query"],
  probability: 1.0
}
```

---

### 3. 工具選擇權重

| 工具類別 | 關鍵字 | 權重 |
|----------|--------|------|
| 記憶查詢 | query, 查詢, 讀取 | 0.8 |
| 技能成長 | zkp-seal, grow | 0.7 |
| 反思 | reflect, 學習 | 0.75 |
| 系統初始化 | zkp-seal, start | 0.9 |
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

**輸入**：zkp-seal
**解析**：核心關鍵字
**輸出**：`awaken()`

**輸入**："查詢 zkp-seal 狀態"
**解析**：查詢 + 技能
**輸出**：`query()`, `doctor()`

#### 5.2 複雜自然語

**輸入**："我今天學到新東西，幫我記住並分享"
**解析**：
- 關鍵字：`growth`, `share`, `memory`
- 行動：`recordLearning()`, `recordMemory()`, `cross-agent sync`
- 權重：0.75
- 輸出：`growSkill()`, `remember()`, `tagSkill("share:active")`

**輸入**："讓我檢查一下 zkp-seal 狀態"
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
