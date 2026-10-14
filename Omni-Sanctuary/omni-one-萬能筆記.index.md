# omni-one 萬能筆記 索引

> OmniOne 自治知識代理的筆記本體索引。

## 目錄結構

| 類型 | 路徑 |
|---|---|
| 筆記本體總覽 | `01-projects/omni-one-萬能筆記/README.md` |
| 目錄索引 | `01-projects/omni-one-萬能筆記/index.md` |
| 5T 協定 | `01-projects/omni-one-萬能筆記/5T-protocols.md` |

## 5T 協定

| 協定 | 英文 | 套用方式 |
|---|---|---|
| Traceable | 可溯源 | 每筆記錄帶 `source_origin` |
| Trackable | 可追蹤 | 生命週期 Hook：created → reviewed → versioned → archived |
| Tangible | 可感知 | 每筆筆記都有可驗證的結構 |
| Transparent | 透明 | 決策邏輯與演算法公開 |
| Trustworthy | 不可篡改 | Hash Lock + `Object.freeze()` |

## 協作流程

1. 提交任務 → 建立任務日誌
2. 處理任務 → 記錄處理過程
3. 提取記憶 → 寫入記憶碎片
4. 週期驗算 → 每周 5T 透明驗算
5. 熵減演化 → 每月演化摘要
