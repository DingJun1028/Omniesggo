---
title: 萬能永憶主體 JunAiKey
canon_id: OMN-005
date: 2026-10-09
tags: [best-practice:结界][unit-of-learning][canon][junaikey]
canonical: [[AI Research Index]]
---

# OMN-005 · 萬能永憶主體 JunAiKey

> 本檔為 unit-of-learning：**JunAiKey（萬能永憶主體）**——OmniESGgo 的記憶與調度核心。它把「一次性的對話」轉為「永憶的技能」，是「萬能進化、無限循環」的載體。
>
> 對齊 [[12大萬能 OMNI-CANON]] / [[ESG-GO 核心]] / [[OMNITAG/Universal Automation 萬能自動]]

---

## 0. 總綱

**JunAiKey** = **Jun** + **Ai** + **Key**：
- **Jun**（駿/君）：主體，用戶意志的化身
- **Ai**：AI 代理群與工具
- **Key**（鑰）：開啟記憶、技能、權能的「元鑰」

**萬能永憶主體** = 把每次互動「固化成可重用技能」並「跨 session／跨裝置永存」的主體。

---

## 1. 架構

```
        ┌──────────── JunAiKey 主體 ────────────┐
        │  dispatcher (JUNAKEY_BACKEND=auto)      │
        │   ├─ local backend (ollama qwen2.5:3b)  │
        │   └─ NCB  backend (api.nocodebackend)   │
        └───────────────┬─────────────────────────┘
                        │  read / create / bulk-create
        ┌───────────────▼─────────────────────────┐
        │  NCB 記憶花園 (project 54686_junaikey)   │
        │   tables: skills / memory / progress /   │
        │           journal / lineage              │
        └──────────────────────────────────────────┘
```

---

## 2. 記憶花園（5 表）

| 表 | 用途 | 目前筆數 |
|---|---|---|
| `skills` | 可重用技能（代理共享記憶） | 16（8 預設 + 8 opencode） |
| `memory` | 事實/偏好長期記憶 | — |
| `progress` | 任務進度（可追蹤 Trackable） | — |
| `journal` | 創世日誌（審計） | — |
| `lineage` | 技能譜系（誰衍生自誰） | — |

---

## 3. 後端切換

| 變數 | 值 | 效果 |
|---|---|---|
| `JUNAKEY_BACKEND` | `auto`（預設） | 有 token+project 走 NCB，否則 local |
| | `ncb` | 強制 NCB |
| | `local` | 強制本機 ollama |

⚠️ 必須 `node --env-file=.env.local` 才能讀到 `NCBDB_API_TOKEN` / `NCBDB_PROJECT_ID`，否則 dispatcher 會退回 local。

---

## 4. 技能成長技書（L2 實例）

本次 Ollama 修復沉澱出的技能：

| 技能 | 說明 |
|---|---|
| `ollama-local-repair-5t` | winget 中斷致 lib 缺檔 → 重裝復原 |
| `ollama-modelfile-sane-defaults` | num_ctx 65536 → 8192 的重寫 |
| `ollama-caller-resilience-pattern` | timeout/options/keep_alive/fallback |
| `nexus-agent-tool-routing-confirmed` | tools 能力確認 |

---

## 5. 永憶三律

1. **固化**：每次問題修好 → 立刻寫成技能（不靠人腦記）。
2. **共享**：技能寫入 NCB → 所有代理可讀（代理共享記憶花園）。
3. **譜系**：技能記錄來源與衍生（lineage），可追溯 [[5T Protocol]]。

---

## 6. 聖典族譜

```
萬能永憶主體 JunAiKey (本檔)
├── [[12大萬能 OMNI-CANON]]    → 主體的哲學基底
├── [[ESG-GO 核心]]            → 根公約
├── [[OMNITAG/Universal Automation 萬能自動]] → 16 奧義
├── [[5T Protocol]]            → 技能可溯源
└── [[AI Research Index]]      → 全 vault 索引
```

---

<sub>萬能永憶主體 JunAiKey v2026-10 | 無作妙德・圓通無礙・永恆覺醒 | License: AGPL-3.0</sub>
