---
title: OmniTag Universal Labeling Contract
canon_id: OMN-004
date: 2026-10-09
tags: [best-practice:结界][unit-of-learning][canon][omnitag]
canonical: [[AI Research Index]]
---

# OMN-004 · OmniTag Universal Labeling Contract

> 本檔為 unit-of-learning：**OmniTag 萬能標籤契約**——以 MECE 六維度為任何事物（檔案 / commit / 任務 / 代理 / 技能 / 風險）貼上可機器讀取、可稽核的標籤。
>
> 對齊 [[OMNITAG/INDEX]] / [[12大萬能 OMNI-CANON]] / [[5T Protocol]]

---

## 0. 總綱

**OmniTag** = 一個跨領域、跨系統的統一標籤語言。目標：

- **MECE**：互斥且完全窮盡（Mutually Exclusive, Collectively Exhaustive）
- **機器可讀**：可由程式解析
- **稽核友好**：可回答「這是什麼 / 誰的 / 多敏感 / 走哪條路」
- **套用即治理**：貼標即完成分類、安全分級與路由

---

## 1. 六維度契約（MECE）

| 維度 | 前綴 | 值域示例 | 作用 |
|---|---|---|---|
| 1 領域 | `domain:` | `esg` / `web` / `infra` / `ai` / `sec` | 歸屬 |
| 2 類型 | `type:` | `canon` / `skill` / `fix` / `spec` / `note` | 性質 |
| 3 安全級 | `sec:` | `public` / `internal` / `confidential` / `secret` | 安全分級 |
| 4 路由 | `route:` | `auto` / `review` / `blocked` | 自動路由 |
| 5 熵減 | `entropy:` | `reduce` / `neutral` / `increase` | 治理方向 |
| 6 結界 | `结界:` | `best-practice` / `guard` | 結界標記 |

---

## 2. 標準範例

```yaml
# 範例：一個修補 commit 的 OmniTag
tags:
  - domain:infra
  - type:fix
  - sec:internal
  - route:auto
  - entropy:reduce
  - best-practice:结界
```

```
# 範例：一個機密 secret 檔案
domain:sec  type:secret  sec:secret  route:blocked  entropy:reduce  guard
→ 自動：禁止外傳、強制加密、需 L2 授權
```

---

## 3. 標籤 → 治理動作（自動路由）

| 標籤組合 | 自動動作 |
|---|---|
| `sec:secret` | 阻擋 commit / 強制轉存 Secrets Store |
| `route:blocked` | 需 [[ESG-GO 核心]] 代主通典 L2 授權 |
| `entropy:increase` | 觸發 [[OMNITAG/Root Cause × Effect Elimination]] 果因消除 |
| `type:canon` | 允許寫入 vault + 需 5T 校驗 |
| `best-practice:结界` | 子代理自動繼承（見 [[OMNITAG/Best Practice Awakening]]） |

---

## 4. 與 5T 的關係

| 5T 維度 | OmniTag 對應 |
|---|---|
| Traceable | `domain:` + `type:` 標明來源 |
| Trackable | `route:` 觀測狀態 |
| Tangible | 標籤可被程式解析使用 |
| Transparent | 標籤公開可審計 |
| Trustworthy | `sec:` + `结界:` 不可靜默改 |

---

## 5. 聖典族譜

```
OmniTag Universal Labeling Contract (本檔)
├── [[OMNITAG/INDEX]]          → OmniTag 總索引
├── [[12大萬能 OMNI-CANON]]    → 12 維度哲學
├── [[5T Protocol]]            → 標籤與驗證對映
├── [[OMNITAG/Best Practice Awakening]] → 結界繼承
├── [[OMNITAG/Root Cause × Effect Elimination]] → 熵增觸發果因消除
└── [[AI Research Index]]      → 全 vault 索引
```

---

<sub>OmniTag Universal Labeling Contract v2026-10 | 無作妙德・圓通無礙・永恆覺醒 | License: AGPL-3.0</sub>
