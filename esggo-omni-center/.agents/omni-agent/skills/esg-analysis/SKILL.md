---
name: esg-analysis
description: ESG 數據分析與 GRI/CSRD/TCFD 報告生成技能。當需要進行 ESG 合規查核、碳排計算、永續報告草稿時使用。
version: 1.0.0
metadata:
  omni-agent:
    tags: [esg, gri, csrd, tcfd, reporting, sustainability]
    category: domain
---

# ESG 分析與報告技能

## 何時載入此技能

- 查詢 GRI、CSRD、TCFD、ISO 14064-1 合規要求
- 生成 ESG 章節草稿（碳排、治理、社會指標）
- 驗證 IEvidence 記錄是否符合 5T Protocol
- 子代理並行研究多個 ESG 框架

---

## 1. 5T Protocol 資料驗證門徑

所有 ESG 數據必須依序通過五道驗證：

```
真 (Truth)    → source_origin 可追溯
善 (Goodness) → 算法透明，符合 ISO-14064-1
美 (Beauty)   → UI 可感知（Liquid Glass Cyan）
信 (Trust)    → hash_lock 不可篡改
通 (Transfer) → lifecycle_hooks 全程追蹤
```

IEvidence 寫入前的必要欄位：
```typescript
{
  formula_ref: string,      // 計算公式參照（如 "GRI-305-1-v2024"）
  tangible_metric: number,  // 可量化指標（tCO2e、kWh 等）
  source_origin: string,    // 資料來源 URL 或系統識別碼
  lifecycle_hooks: Hook[]   // 生命週期追蹤鉤子
}
```

---

## 2. 主要 ESG 框架對應

| 框架 | 適用範疇 | 關鍵查詢關鍵字 |
|------|----------|----------------|
| GRI 305 | 溫室氣體排放（Scope 1/2/3）| "GRI 305 emissions disclosure" |
| CSRD | 歐盟強制揭露（2025+）| "CSRD ESRS mandatory reporting" |
| TCFD | 氣候財務風險 | "TCFD climate risk disclosure" |
| ISO 14064-1 | 碳排計算驗算標準 | "ISO 14064-1 2018 amendment" |
| 台灣金管會 | 上市公司揭露規範 | "台灣永續報告書 金管會 2025" |

---

## 3. 並行研究模式（子代理委派）

```python
# 三框架平行研究範例
omni_agent.delegate_task(tasks=[
  {
    "goal": "研究 CSRD 2025 最新合規要求",
    "context": "聚焦：歐盟 CSRD 強制揭露時程、GRI 對應、台灣企業適用範圍",
    "toolsets": ["web", "esg_analysis"]
  },
  {
    "goal": "研究 ISO 14064-1 碳排計算最新版本",
    "context": "聚焦：2024 年修訂內容、Scope 3 計算方法、驗證標準",
    "toolsets": ["web"]
  },
  {
    "goal": "分析台灣金管會 ESG 揭露規範",
    "context": "聚焦：上市公司強制揭露時程、永續報告書格式要求",
    "toolsets": ["web", "esg_analysis"]
  }
])
```

⚠️ 子代理無法存取父 session 上下文，`context` 必須自給自足。

---

## 4. GRI 305 報告草稿結構

```markdown
## GRI 305：排放量

### 305-1 直接溫室氣體排放（Scope 1）
- 排放量：{tangible_metric} tCO2e
- 計算方法：{formula_ref}
- 數據來源：{source_origin}
- 驗證狀態：{hash_lock ? "已鎖定" : "待驗證"}

### 305-2 間接溫室氣體排放（Scope 2）
...

### 305-3 其他間接排放（Scope 3）
...
```

---

## 5. Firestore Evidence Vault 查詢

```typescript
// 查詢特定框架的 evidence 記錄
const evidence = await db
  .collection("evidence_vault")
  .where("formula_ref", ">=", "GRI-305")
  .where("formula_ref", "<", "GRI-306")
  .orderBy("formula_ref")
  .get();
```

MCP 工具呼叫：
```
mcp_firebase-mcp-server_firestore_query_collection(
  collection_path="evidence_vault",
  filters=[{field: "formula_ref", op: "GREATER_THAN_OR_EQUAL", compare_value: {string_value: "GRI-305"}}]
)
```

---

## 6. 靜默模式（排程任務）

排程 ESG 監控任務時，當無異常發現時回應 `[SILENT]`：

```
掃描最新 ESG 法規更新（台灣 + 歐盟）。
若過去 7 天無重大變更，回應 [SILENT]。
若有重大變更，提供摘要並標注影響的 GRI 章節。
```
