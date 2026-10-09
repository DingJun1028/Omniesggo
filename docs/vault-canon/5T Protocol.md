---
title: 5T Protocol
canon_id: OMN-003
date: 2026-10-09
tags: [best-practice:结界][unit-of-learning][canon][protocol]
canonical: [[AI Research Index]]
---

# OMN-003 · 5T Protocol

> 本檔為 unit-of-learning：OmniESGgo / ESG-GO 的**五維度驗證條款**。任何交付物（聖典 / 程式 / DNS / secret / tag）上線前，必須通過 5T 校驗。
>
> 對齊 [[ESG-GO 核心]] / [[12大萬能 OMNI-CANON]] / [[OMN-PRD-001 終始矩陣]]

---

## 0. 總綱

**5T** = 五個以 T 開頭的可驗證維度，構成「不帶病上線」的最小充分條件。

```
Traceable   可溯源   —— 知道「從哪來」
Trackable   可追蹤   —— 知道「現在在哪」
Tangible    可觸及   —— 知道「怎麼用」
Transparent 可透明   —— 知道「為什麼這樣」
Trustworthy 可信賴   —— 知道「不可被偷偷改」
```

---

## 1. 五維度矩陣

| 維度 | 中文 | 定義 | 本 repo / vault 的實現 |
|---|---|---|---|
| **Traceable** | 可溯源 | 每個交付物可回溯到來源意圖與 commit | git commit trailer `5T: source_origin=…`；vault `canonical:` frontmatter |
| **Trackable** | 可追蹤 | 狀態可被即時觀測 | git tag（12 個進行式）、CI workflow 狀態、NCB `progress` 表 |
| **Tangible** | 可觸及 | 可被實際使用/執行/驗證 | 端到端活（FTG 表單 id `01a11f95…`）、`curl` 200、`pnpm audit` 0 |
| **Transparent** | 可透明 | 決策理由公開、可審計 | `docs/*.md` 聖典、`.github/dependabot.yml`、結界繼承 `best-practice:结界` |
| **Trustworthy** | 可信賴 | 不可被靜默篡改 | annotated git tag、`Object.freeze`、`5T-Trustworthy:` 標記、Access 結界 |

---

## 2. 使用方式（commit 範例）

```
feat(ftg): wire contact form to Resend pipeline

5T: source_origin=user-request-2026-10-09
5T-Trustworthy: freeze(D1 schema) + annotated-tag
[best-practice:awakened]

Traceable    → source_origin trailer
Trackable    → tag ftg-official-2026-10-09
Tangible     → POST /api/contact 200 {ok:true,id:11}
Transparent  → docs/FTG-pipeline + vault note
Trustworthy  → Access bypass policy + Object.freeze
```

---

## 3. 3+1 協定

5T 之外另有一個結界維度：

- **+1 結界繼承（best-practice:结界）**：任何子代理/子技能啟動時自動繼承 5T 校驗，無需重新宣告。見 [[OMNITAG/Best Practice Awakening]]。

---

## 4. 缺一不可

| 缺哪個 T | 後果 |
|---|---|
| 缺 Traceable | 出事找不到來源，無法 rollback |
| 缺 Trackable | 不知道是否已部署，重複動作 |
| 缺 Tangible | 只是宣稱，未實證 |
| 缺 Transparent | 黑箱，無法審計 |
| 缺 Trustworthy | 被靜默改，供應鏈攻擊 |

---

## 5. 聖典族譜

```
5T Protocol (本檔)
├── [[ESG-GO 核心]]            → 5T 是根公約核心
├── [[12大萬能 OMNI-CANON]]    → 12 維度哲學
├── [[OMN-PRD-001 終始矩陣]]    → 5T 如何映到需求
├── [[OMNITAG/Best Practice Awakening]] → +1 結界繼承
└── [[AI Research Index]]      → 全 vault 索引
```

---

<sub>5T Protocol v2026-10 | 無作妙德・圓通無礙・永恆覺醒 | License: AGPL-3.0</sub>
