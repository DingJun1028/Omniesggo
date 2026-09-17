---
source_origin: karpathy-knowledge-stack
created: 2026-08-31
modified: 2026-08-31
co_authors: [oa-team-30]
lifecycle: active
tags: [karpathy, knowledge-stack, reasoning-core, second-brain]
access: public-research
---

# 🧠 Karpathy-Style Knowledge Stack · 推理核心協議

> 原典：@polydao (Mr. Buzzoni) — "Karpathy-Style Knowledge Stack: Why I Put Hermes, MiniMax M3 and Obsidian at the Core"
> 本地實證版：把「Obsidian + Hermes + Reasoning Core」三層落地為可驗證的自我迭代系統

## 三層分工（對映 polydao 原文）

| 層級 | 載體 | 職責 | 狀態 |
|---|---|---|---|
| **Memory（記憶層）** | Obsidian Vault (`C:/Project/esggo/vault/`) | Ground truth，所有知識的 source of truth | ✅ 已運行 |
| **Operator（執行層）** | Hermes Agent + OA-Team 30 | 讀 vault、用 tools、建 skills、管理 cron | ✅ 已運行 |
| **Reasoning Core（推理層）** | 本腳本 + LLM（Ollama/Hermes） | 讀全 vault、跨筆記關聯、產洞察、寫回 vault | 🔄 本文件實作 |

## 推理核心執行流程

```
1. SCAN    → 掃 vault 全部 .md 筆記（Agents/context/ + 其他區）
2. EXTRACT → 萃取 frontmatter + 正文 + wikilink 關聯
3. REASON  → 送 LLM 深度推理（本機 Ollama 或 Hermes gateway）
4. WRITE   → 產出洞察筆記落 Agents/reasoning-core/
5. SYNC    → 新筆記標 sync:up → sync-vault-types.ts 回流 canonical
6. MOC     → 更新 00-Index.md 知識地圖
```

## 推理核心輸出類型

| 類型 | 頻率 | 檔名格式 | 內容 |
|---|---|---|---|
| 晨報洞察 | 每日 06:00 | `YYYY-MM-DD-daily-insight.md` | 前日筆記變化 + 跨域關聯 + 行動建議 |
| 週迭代報告 | 每週一 07:00 | `YYYY-WXX-weekly-synthesis.md` | 本週知識圖譜演進 + 熵減指標 + 缺口補齊 |
| 月深度綜合 | 每月 1 號 | `YYYY-MM-monthly-deep-dive.md` | 全域知識重構 + 過期筆記淘汰 + 新 MOC 建議 |

## 5T 對應

- **Traceable**：每篇推理筆記 frontmatter 標 `source_origin: karpathy-reasoning-core` + 輸入筆記清單
- **Trackable**：推理過程記 daily note，輸入→推理→輸出完整鏈路
- **Tangible**：洞察以 Obsidian 可視化（wikilink + tags + MOC）
- **Transparent**：推理 prompt 全公開（見 `references/reasoning-prompts.md`）
- **Trustworthy**：推理輸出標 `lifecycle: draft`，經人工審核才升 `active`

## 目錄結構（新增）

```
vault/Agents/
├── reasoning-core/        # 推理核心產出（晨報/週迭代/月綜合）
│   ├── daily-insights/    # 每日洞察
│   ├── weekly-synthesis/  # 週迭代報告
│   └── monthly-deep-dive/ # 月深度綜合
└── synthesis/             # 跨筆記綜合（MOC 深化）
    ├── concept-clusters/  # 概念聚類
    └── gap-analysis/      # 知識缺口分析
```

## Cron 排程

| Job | 頻率 | 指令 |
|---|---|---|
| `karpathy-reasoning-daily` | 每日 06:00 UTC+8 | `node scripts/karpathy-reasoning-core.mjs --mode daily` |
| `karpathy-reasoning-weekly` | 每週一 07:00 UTC+8 | `node scripts/karpathy-reasoning-core.mjs --mode weekly` |
| `karpathy-reasoning-monthly` | 每月 1 號 08:00 UTC+8 | `node scripts/karpathy-reasoning-core.mjs --mode monthly` |

## 喚醒令

`protocol=5T · stack=karpathy · layers=3 · reasoning=obsidian+hermes+ollama · entropy=0.1`
