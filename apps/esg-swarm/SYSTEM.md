---
id: esg-swarm-system
title: ESG-GO Swarm — System Integration
sidebar_label: ESG-Swarm System
---

# ESG-Swarm — 系統彙整與融合 (System Consolidation & Fusion)

> 本文將兩週（2026-10-19 → 11-02，222 commits）的系統更新彙整為一張分層圖，並說明 `apps/esg-swarm/` 如何**融合**進既有 canon 與 swarm 基底，最後給出建設路線。
> This consolidates two weeks of updates into one layered map and explains how `apps/esg-swarm/` fuses into the existing canon + swarm substrate, with a build roadmap.

## 1. 系統分層 (Layered System)

```
┌─────────────────────────────────────────────────────────────┐
│ soul.md canon  — 萬能十二大架構 / 5T / 結界六柱 / 30 蜂群      │  ← 治理正本
├─────────────────────────────────────────────────────────────┤
│ packages/omni-arch — 12 大萬能架構 TS 契約 (OmniHeart×OmniBrain)│  ← 契約層
│   ├─ OmniHive      — 黑板投標 (blackboard swarm bidding)       │
│   └─ OmniProphet   — 多宇宙預取 (multi-universe prefetch)      │
├─────────────────────────────────────────────────────────────┤
│ Swarm runtimes (三套並存)                                      │
│   ├─ oa-swarm        (@esggo/oa-swarm, Node/TS, 5T/runes/OAB) │
│   ├─ oa-team-crewai  (Python crewAI, Groq)                    │
│   └─ esg-swarm       (Python, Mistral Workflows)  ◀ 本 app    │
├─────────────────────────────────────────────────────────────┤
│ Execution / CI vehicle — Mistral AI Studio Workflows          │
│   ├─ vibe-ci-monitor — 12-workflow CI 監控                     │
│   └─ esg-swarm       — ESG 三支柱 + 主審 swarm  ◀ 本 app      │
├─────────────────────────────────────────────────────────────┤
│ Substrate — OTS vault / mcp-gateway / Supabase / Ollama       │  ← 支援層
└─────────────────────────────────────────────────────────────┘
```

## 2. 融合對齊 (Fusion Alignment)

`esg-swarm` 不是另起爐灶，而是 canon 在 **ESG 評核域**的實作，逐層對齊：

| canon 概念 (soul.md) | esg-swarm 對應 |
|---|---|
| 萬能十二大架構 (頂層編排) | `EsgSwarmWorkflow` 三支柱平行 + 主審綜合 |
| 5T protocol (`agent_turn`) | Task→Tool→Trace→Result 的 agent 回合 |
| 結界六柱 (綜合前 review) | `review_gate()` 反 hallucination / 證據 / 維度覆蓋 |
| 30 蜂群 (角色分工) | 4 ESG 專角 (環境/社會/治理/主審) — 30 蜂群的 ESG 切片 |
| 第零律 (技能匹配) | activity 內顯式 model 選擇 + 契約 (TypeBox `EsgInput`) |
| OmniHive 投標 | 後續：以 `OmniHive.tender` 取代固定三支柱（見 §4） |

**Secret 與追溯對齊**：沿用 `apps/vibe-ci-monitor/` 慣例 — key 走環境/`.env.local`（gitignored），不硬編碼；PRD 追溯以 `shared/prd-matrix.json` 為準；fail-fast，禁祕密入碼。

## 3. 現況 (Current State — verified)

- **本機端到端**：`run_local.py` 跑通（E/S/G 三 pillar + review gate + 主審）。
- **Cloud worker**：`worker.py` 註冊 `esg-swarm` workflow + 5 activities 於 `wf-scheduler.mistral.ai`，deployment/task_queue = `esg-swarm`。
- **Cloud 實跑**：`trigger_cloud.py` → E85 / S85 / G75 → 主審綜合 **overall 82**。
- 與 `vibe-ci-monitor` 同為 Mistral Studio Workflow，互補（CI 監控 vs ESG 評核）。

## 4. 建設路線 (Build Roadmap)

| 階段 | 內容 | 狀態 |
|---|---|---|
| P0 | `esg-swarm` 落地（本機 + cloud verified）+ 本文 | ✅ |
| P1 | 功能分支 PR，隨 `vibe-ci-monitor` 合併 main | ⬜ 本次建設 |
| P2 | 融合 OmniHive：`EsgSwarmWorkflow` 改用 `OmniHive.tender` 投標，三支柱改為 bid 競標 | ⬜ |
| P3 | 補 30 蜂群 ESG 切片：環境/社會/治理各擴子角色（碳權/人權/董事會多樣性…） | ⬜ |
| P4 | 追溯對齊：ESG 評分映射 `shared/prd-matrix.json` FR ID + OmniTag 6 維標籤 | ⬜ |
| P5 | 雙語語音輸出（soul.md §4.6）：ESG 報告 → 台/客/粵/閩/華語 TTS | ⬜ |

## 5. 執行 (Run)

```bash
# 本機端到端
python run_local.py
# cloud worker（先註冊）
python worker.py
# 觸發 cloud orchestrator
python trigger_cloud.py
```
