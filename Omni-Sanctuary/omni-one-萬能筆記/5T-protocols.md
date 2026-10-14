# 5T 協定：omni-one 筆記本體套用

> 每一筆筆記的寫入、修改、驗證，皆需遵守 5T 協定。

## 5T 定義

| 協定 | 英文 | 套用於筆記本體 |
|---|---|---|
| Traceable | 可溯源 | 每筆記錄有 `source_origin`，可追溯到原始任務 |
| Trackable | 可追蹤 | 筆記有生命週期 Hook：`created → reviewed → versioned → archived` |
| Tangible | 可感知 | 每筆筆記都有可驗證的結構與內容 |
| Transparent | 透明 | 決策邏輯、演算法、自治過程公開可回看 |
| Trustworthy | 不可篡改 | 寫入後執行 Hash Lock + `Object.freeze()` |

## 筆記生命週期

```
創建 (created)
  ↓
審閱 (reviewed)
  ↓
版本化 (versioned)
  ↓
封存 (archived)
```

### 生命週期 Hook

| 階段 | 動作 | 記錄 |
|---|---|---|
| created | 寫入原始筆記 | `source_origin`, `created_at` |
| reviewed | 審閱修改 | `reviewed_at`, `reviewed_by` |
| versioned | 寫入版本號 | `version`, `version_notes` |
| archived | 封存不可改 | `archived_at`, `archived_by` |

## 5T 驗算模板

每筆筆記寫入後，必須通過以下驗算：

```yaml
- Traceable: source_origin 存在且可追溯
- Trackable: 有 created/reviewed/versioned 痕跡
- Tangible: 結構完整，可測試
- Transparent: 決策邏輯公開
- Trustworthy: 已 Object.freeze() 或等效幀鎖
```

## 驗證腳本

在 `verification/` 目錄下建立每週/每月驗算報告：

```markdown
---
source_origin: omnione/verification/2026-10-14
created_at: 2026-10-14T12:00:00Z
type: weekly
---

# 2026-10-14 5T 驗算

## 合計
- 筆記數: XX
- 記憶碎片: XX
- 通過率: XX%

## 5T 檢查
- Traceable: [X] / [ ]
- Trackable: [X] / [ ]
- Tangible: [X] / [ ]
- Transparent: [X] / [ ]
- Trustworthy: [X] / [ ]
```

## 進化記錄

每月記錄演化摘要至 `evolution/YYYY-MM.md`：

```markdown
---
source_origin: omnione/evolution/2026-10
created_at: 2026-10-14T12:00:00Z
type: monthly-evolution
---

# 2026-10 進化摘要

## 熵減
- 技能鍊精：X%
- 技術債消除：X 項

## 新增能力
- [項目]

## 風險
- [項目]
```
