---
title: ESG-GO 核心
canon_id: OMN-002
date: 2026-10-09
tags: [best-practice:结界][unit-of-learning][canon][core]
canonical: [[AI Research Index]]
---

# OMN-002 · ESG-GO 核心

> 本檔為 unit-of-learning：ESG-GO（OA-Team 30 蜂群）的**根公約**。任何代理 / 技能 / 子系統的最高約束。
>
> 對齊 [[5T Protocol]] / [[12大萬能 OMNI-CANON]] / [[OmniESGgo 系統架構 功能設定 成果交付 終始矩陣 設計規劃書]]

---

## 0. 總綱

**ESG-GO** = 永續雲端平台，由 **OA-Team 30 蜂群**（30 個自主任務代理）+ **OAG/OAB/OA/OA-Team** 四層架構構成。其根公約 = **5T + 4可1不可**。

---

## 1. 根架構：四層蜂群

```
┌─────────────────────────────────────────────┐
│ OA-Team（30 蜂群上層，任務編排）              │  uuid: 2e2b… / crewai-based
│  · 各蜂有 role / goal / tools / backstory    │
├─────────────────────────────────────────────┤
│ OA（Operations Agent，單蜂操作代理）          │
│  · 執行單一任務，可被結界繼承                  │
├─────────────────────────────────────────────┤
│ OAB（Operations Agent Bridge，蜂群橋）         │
│  · 蜂群之間的消息/狀態協調                     │
├─────────────────────────────────────────────┤
│ OAG（Operations Agent Gateway，蜂群閘道）      │
│  · 統一對外交付介面                            │
└─────────────────────────────────────────────┘
```

---

## 2. 根公約：5T + 4可1不可

### 5T（五維度驗證）
見 [[5T Protocol]]：Traceable / Trackable / Tangible / Transparent / Trustworthy。

### 4 可
| 可 | 說明 |
|---|---|
| **可溯源** | 每個決策可回溯 to 用戶意圖 / commit |
| **可驗算** | 結果可被獨立工具覆核（audit / vitest / curl） |
| **可繼承** | 結界與最佳實踐自動傳給子代理 |
| **可回滾** | 任一步驟可安全撤銷 |

### 1 不可
| 不可 | 說明 |
|---|---|
| **不可越權** | 代理不得執行超出授權範圍的操作（見「代主通典」L0/L1/L2） |

---

## 3. 30 蜂群的職能分佈（摘要）

| 群組 | 蜂數 | 職能 |
|---|---|---|
| 探勘群 | 5 | 掃描 repo / web / 資料源 |
| 建造群 | 6 | 寫程式 / 建 workflow / 鑄造符文 |
| 校驗群 | 5 | 測試 / 型別 / 安全掃描 |
| 部署群 | 4 | VPS / Cloudflare / Vercel |
| 通信群 | 3 | 信件 / 通知 / 對外 API |
| 治理群 | 4 | 標籤 / 記憶 / 熵減 / 結界 |
| 觀測群 | 3 | KPI / KPI 可視化 / 異常回報 |

---

## 4. 結界（Boundary）

| 結界 | 內容 |
|---|---|
| 代主通典 | L0 自動 / L1 需確認 / L2 禁止；1.2 熔斷清單 |
| Cloudflare Access | `ftgtours-api-public`（`/api/contact` bypass everyone） |
| Resend 寄件 | esggo.co verified → esgsunshine.com 待 UI Verify |
| NCB 記憶 | 16 技能 + 8 聖典 |

---

## 5. 聖典族譜

```
ESG-GO 核心 (本檔)
├── [[5T Protocol]]            → 根公約的驗證條款
├── [[12大萬能 OMNI-CANON]]    → 12 維度 + 雙腔體
├── [[OMN-PRD-001 終始矩陣]]    → 需求→交付追溯
├── [[OmniESGgo 系統架構 功能設定 成果交付 終始矩陣 設計規劃書]] → 系統總設計
├── [[OMNITAG/Best Practice Awakening]] → 結界繼承
└── [[AI Research Index]]      → 全 vault 索引
```

---

<sub>ESG-GO 核心 v2026-10 | 無作妙德・圓通無礙・永恆覺醒 | License: AGPL-3.0</sub>
