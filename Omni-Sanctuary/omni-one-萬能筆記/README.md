# omni-one 萬能筆記

> 為 OmniOne 自治知識代理建立的 5T 筆記本體目錄。收錄任務日誌、記憶碎片、5T 驗算記錄與演化路徑。

## 組成

| 類型 | 路徑模式 | 說明 |
|---|---|---|
| 任務日誌 | `logs/YYYY-MM-DD-<task-id>.md` | 每筆任務的完整執行軌跡 |
| 記憶碎片 | `memories/<id>.json` | 從任務中提取的可重用知識單元 |
| 5T 驗算 | `verification/<date>-<topic>.md` | 每周/每月的 5T 透明驗算 |
| 進化摘要 | `evolution/<date>.md` | 技能演化、熵減紀錄 |

## 5T 協定（應用於本筆記本體）

| 協定 | 實踐方式 |
|---|---|
| Traceable | 每筆記錄帶 `source_origin`，可追溯到原始任務 |
| Trackable | 筆記有生命週期 Hook：`created → reviewed → versioned → archived` |
| Tangible | 每筆筆記都要有可驗證的結構：ID、來源、內容、證據 |
| Transparent | 演算法與過往決策公開；回看記錄可重現 |
| Trustworthy | 筆記寫入後執行 Hash Lock + Object.freeze() |

## 目錄結構

```text
OmniOne-Note-Base/
├── README.md
├── index.md
├── 5T-protocols.md
├── logs/
├── memories/
├── verification/
└── evolution/
```

## 最小筆記範例

```markdown
---
source_origin: omnione/2026-10-14/TASK-1714430000
created_at: 2026-10-14T12:00:00Z
status: active
tags: [knowledge, omni-one]
---

# 筆記標題

## 內容
...

## 證據
...

## 5T 驗算
- Traceable: source_origin 存在
- Trackable: 有 created/reviewed/versioned 跡軌
- Tangible: 可測試
- Transparent: 決策邏輯公開
- Trustworthy: 已 freeze
```
