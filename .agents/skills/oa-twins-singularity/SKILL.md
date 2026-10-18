---
name: oa-twins-singularity
description: "Use when measuring OA-Twins 雙蜂組→無雙隊 evolution progress or auditing peak6 5T tag completeness. Runs structural validation + measurable stage-1 progress; never fabricates runtime stages."
---

# OA-Twins 無雙隊（The Singularity Hive）進化量測

> 「雙星歸一，六十靈魂合一；暗光融合，無雙隊誕生——非二，而是一。」

## 觸發

「無雙隊」「twins evolution」「雙蜂」「singularity progress」「5t 標籤完整性」

## 用途

量測 OA-Twins 雙蜂組（蜂王隊 1-30 暗屬性 + 蜂后隊 31-60 光屬性）向無雙隊進化的**可實測進度**，
並校驗 `esggo-omni-center/oa-twins/peak6_classification.json` 結構完整性與 5T 標籤覆蓋率。

## 使用

```bash
# 量測（預設讀 esggo-omni-center/oa-twins/peak6_classification.json）
python .agents/skills/oa-twins-singularity/scripts/singularity_progress.py

# 指定矩陣路徑 / JSON 輸出
python .agents/skills/oa-twins-singularity/scripts/singularity_progress.py --matrix <path> --json

# 測試
python -m unittest discover -s .agents/skills/oa-twins-singularity/test -v
```

## 量測模型

- **可量測（結構層）**：10 峰、暗光各 5、60 代理、每峰 6 代理 → structure 30%；
  明確 5T 標籤覆蓋率 → coverage 70%；合成 stage1_progress（0-100%）。
- **不可量測（運行時層）**：二至四階段（屬性互貫/認知合一/無雙誕生）需通道開放比例、
  記憶同步延遲、Unified Core 啟用證據 → 一律回報 `pending`，不推測。
- **佔位符規則**：`"T"` 單字元 = 不可驗證，不計入覆蓋（零幻覺驗算）。

## 規格書

`docs/ARCH-SPEC-oa-twins-singularity.md`（正典六檔 sha256 錨定 + ADR + 驗證閘）

## 5T 頁

| 原則 | 落實 |
|------|------|
| Traceable | 輸出附輸入矩陣 sha256 前 16 位；正典六檔雜湊錨定於規格書 §2.1 |
| Trackable | 每次量測輸出 timestamp + 全部校驗項結果，可重跑比對 |
| Tangible | exit code 語義明確（0=結構通過、1=結構異常、2=參數錯誤），JSON 可供儀表板 |
| Transparent | 宣告性階段標 `pending` 不推測；`"T"` 佔位符明示不計覆蓋 |
| Trustworthy | 正典數據 sha256 錨定；量測器唯讀，不寫入正典 |

*版本：v1.0 · 對應 soul-oa-twins.md 四階段進化 · source_origin: esggo-omni-center/oa-twins*
