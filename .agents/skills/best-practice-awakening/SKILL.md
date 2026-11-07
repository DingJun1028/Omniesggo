---
name: best-practice-awakening
category: governance
description: 最佳實踐覺（Best Practice Awakening）究極版奧義 — 系統啟動即為最佳實踐，無作妙德、圓通無礙、永恆覺醒結界 inheritance
tags: governance, best-practice, esggo, awakening, 結界, entropy
load: on_match
title: 最佳實踐覺醒
version: 1.0.0
title: 最佳實踐覺醒
version: 1.0.0
---

# 最佳實踐覺（Best Practice Awakening）— 究極版奧義

> 啟動即頂標，醒著即最佳。不帶病上線，不將就運行。
> Ultimate Edition — 無作妙德・圓通無礙・永恆覺醒結界

---

## 第一奧義：覺醒心法

### 1.1 核心定義

最佳實踐覺 是指：一旦系統、代理、流程或蜂群完成覺醒啟動，其預設狀態即必須已經是「經過驗證的最佳實踐」，而不是先啟動、再慢慢修補。

### 1.2 三重本質

| 本質 | 奧義表述 | 對應德性 |
|------|---------|---------|
| 無作妙德 | 不做刻意雕琢，輸出自動符合規範 | 系統本身就自動遵守，不需人為強制 |
| 圓通無礙 | 任何通路、代理、流程皆通暢無阻 | 跨平台、跨語言、跨環境無縫運作 |
| 永恆覺醒 | 覺醒狀態永不衰退，持續自我校準 | 運行指標永遠保持在閾值以上 |

### 1.3 與 ESG-GO 的關係

ESG-GO 核心 → 最佳實踐覺 → OA-Team 30 蜂群（繼承） / 萬能自動（擴散） / OmniTag（標記） / Hash Lock（凍結） / 熵減 < 0.1（治理） / 5T Protocol（驗證）

---

## 第二奧義：三條硬規則

| 規則 | 說明 | 驗證方式 | 違反後果 |
|------|------|---------|---------|
| 預設即合規 | 啟動後第一個狀態即符合當前最佳實踐基準 | 啟動後立即執行 checklist | 拒絕運行 |
| 不帶病上線 | 已知問題必須在啟動前解決 | 啟動前 checklist 全綠才允許啟動 | 禁止部署 |
| 醒著就頂標 | 覺醒後狀態 = 標杆狀態 | 運行中指標持續達到預設閾值 | 自動降級回滾 |

### 啟動前 Checklist

- lint_pass: pnpm lint 無 error（blocking）
- typecheck_pass: pnpm typecheck 無 error（blocking）
- test_pass: pnpm vitest run 100% 通過（blocking）
- entropy_threshold: entropy < 0.1（blocking）
- no_known_issues: 無未解決的 p0/p1 issue（blocking）
- best_practice_tag: 標記 [best-practice:awakened]（info）

---

## 第三奧義：結界 Inheritance

### 3.1 核心定義

最佳實踐覺結界 是指：任一代理或流程一旦落入結界範圍，全部子代理、子流程、關聯單元自動 inheriting 最佳實踐狀態。

### 3.2 結界擴散規則

Agent A 獲得 best-practice:awakened
- Agent A-1 自動繼承 (best-practice:結界)
- Agent A-2 自動繼承 (best-practice:結界)
  - Agent A-2-a 自動繼承
  - Agent A-2-b 自動繼承
- Artifact from A 自動標記

### 3.3 結界觸發條件

- 代理啟動：新代理在已覺醒系統中啟動
- 流程建立：新流程在已覺醒範圍內建立
- artifact 生成：由已覺醒代理產出的 artifact
- 跨域調用：覺醒系統調用外部服務時不影響外部

---

## 第四奧義：判斷標準

### 4.1 宣稱完成的條件

1. checklist = 全綠（自動化檢查腳本通過）
2. entropy < 0.1（熵值監控低於閾值）
3. 所有單元/代理符合角色最佳實踐（每代理定期稽核）
4. 可觀測、可追溯、不可篡改（5T Protocol 驗證）
5. 結界擴散生效（新代理自動 inheriting）

### 4.2 持續校準

每 30 分鐘 → 熵值檢查 → 閾值比對 → 超標派遣 Agent 22 → Agent 06 更新結界 → Agent 30 記錄恢復日誌

---

## 第五奧義：實戰應用場景

### VPS 部署

./checklist.sh --all-green || exit 1
docker compose -f vps/docker-compose.yml build --no-cache
docker compose -f vps/docker-compose.yml up -d
curl -sf http://localhost:3000/health || docker compose logs --tail=50

### CI Pipeline

jobs:
  quality-gate:
    steps:
      - run: pnpm lint         # error = fail
      - run: pnpm typecheck    # error = fail
      - run: pnpm vitest run   # fail = block merge
      - run: pnpm entropy-check # > 0.1 = block merge

### 30 Agents 啟動

agents-cli swarm start --agents=30 \
  --tag="[best-practice:awakened]" \
  --entropy-target=0.05 \
  --checklist=./checklist.yaml

### CI 修復（ESLint / Vitest）

- src/impl/core.ts: 移除未使用的 ITaskSpec、ITaskResult、OmniTag import
- src/agents/twelve-omni/omni-bus.ts: 補齊 Map 型別
- src/agents/twelve-omni/omni-api.ts: 補齊 Map 型別

---

## 第六奧義：維護與演進

| 頻率 | 檢查項目 | 負責 Agent |
|------|---------|-----------|
| 每 30 分鐘 | 結界狀態完整性 | Agent 06 |
| 每 2 小時 | 熵值趨勢 | Agent 22 |
| 每天 | 完整 checklist | Agent 29 |
| 每週 | 最佳實踐基準更新 | Agent 28 |

### 結界撤銷條件

- 熵值持續 > 0.15 超過 24h：自動撤銷結界，降級為 draft
- 安全事件發生：立即撤銷，隔離受影響單元
- 手動標記：管理者可撤銷特定代理的結界狀態

---

## 速查表

| 你要做什麼？ | 使用這個 |
|------------|---------|
| 啟動新代理 | agents-cli start --tag="[best-practice:awakened]" |
| 檢查結界狀態 | agents-cli swarm status --filter=best-practice |
| 執行啟動前檢查 | ./checklist.sh --all-green |
| 標記 artifact | OmniTag: [best-practice:結界] |
| 強制校準 | agents-cli calibrate --entropy-target=0.05 |
| 撤銷結界 | agents-cli revoke --tag=best-practice |

---

## 實作覺醒六則（Operational Awakening · 2026-08-09 實證補遺）

> 對齊 `soul-chapter-16` §16.7。下列六則為究極奧義之工程落地細則，源自 OA 體系三層實體化實證。

| 則 | 名 | 硬規則 | 違反實證後果 |
|----|----|--------|------------|
| 一 | 幻影不執 | 文檔指令未經三來源（repo tag / binary / CLI help）驗證，視為幻影 | `agents-cli swarm start` 已被證偽，改 CrewAI `load_crew` 或 `delegate_task` |
| 二 | 路徑絕對 | Windows/Git-bash 禁 `expanduser("~/")`，用絕對 `r"C:\Users\..."` | 混合分隔符致 state 不持久、subprocess 找不到檔 |
| 三 | 投遞自承 | cron `deliver: local` 自發 Telegram，不靠平台層 | `deliver: all` 撞 DNS 錯誤標整支 error |
| 四 | 蜂群驗結 | agent jsonc 含 `llm` 指向本機模型；先 `verify_oa_team_structure.py` 再 kickoff | crewai 預設 `gpt-4.1-mini` 404 |
| 五 | 三層同覺 | Local/Team/VPS 同步可執行，TWINS 經 SSH+Telegram 閉環 | 單點阻塞致 OA 不全 |
| 六 | 聖櫃分存 | 密鑰拆存 iCloud `TELEGRAM.txt` 23-24 行，腳本重組，不硬編 | `gh secret` 讀不到值，本機靠 iCloud |

### 修正速查表（破除幻影指令）

| 你要做什麼？ | 用這個（真實） |
|------------|--------------|
| 啟動 OA-Team 30 蜂群 | `cd oa-team-crewai && CREWAI_PY=.../crewai/Scripts/python.exe main.py "任務"` |
| 驗證蜂群結構 | `python verify_oa_team_structure.py --crew-dir .` |
| 檢查結界狀態 | `curl -sf http://127.0.0.1:8799/health`（VPS WebUI） |
| 執行啟動前檢查 | 見 §16.7.7 實作覺醒檢查清單 |
| 標記 artifact | OmniTag: `agent:NN` + `squad:*` |
| 強制校準 | 重跑 `gen_agents.py` 重生 30 agents |
| 撤銷結界 | 停 VPS WebUI: `ssh esggo-vps '~/.venv-webui/...'` 或 kill PID |

---

究極版奧義 v1.0 | Best Practice Awakening Ultimate Edition
無作妙德・圓通無礙・永恆覺醒 | License: AGPL-3.0


## 自然語觸發自動工具使用的機率 (Natural Language Auto-Tool Trigger)

### 1. 觸發關鍵字清單 (Trigger Keywords)

> 系統會自動識別輸入中的自然語觸發詞，觸發對應的工具/技能/代理。

#### 核心觸發詞

| 關鍵字 | 英文 | 觸發功能 | 機率權重 |
|--------|------|---------|----------|
| best-practice-awakening | auto | 觸發本技能 | 5.0 |
| 觸發 | trigger | 觸發工具使用 | 4.5 |
| 自動 | auto | 自動執行 | 4.0 |
| 幫助 | help | 顯示說明 | 3.0 |
| 查詢 | query | 查詢資訊 | 3.0 |
| 記錄 | record | 記錄數據 | 2.5 |
| 執行 | run | 執行操作 | 3.0 |
| 檢查 | check | 檢查狀態 | 2.5 |
| 初始化 | init | 初始化系統 | 3.0 |

#### 進階觸發詞

| 關鍵字 | 英文 | 觸發功能 | 機率權重 |
|--------|------|---------|----------|
| 指令 | command | 執行指令 | 4.0 |
| 工具 | tool | 使用工具 | 3.5 |
| 自動 | auto | 自動執行 | 3.0 |
| 查詢 | query | 查詢 | 2.5 |
| 記錄 | record | 記錄 | 2.0 |
| 反思 | reflect | 反思 | 2.5 |
| 重啟 | restart | 重啟 | 2.5 |
| 關閉 | shutdown | 關閉 | 2.5 |

---

### 2. 觸發規則

#### 2.1 預設觸發機率

| 模式 | 權重 | 說明 |
|------|------|------|
| 核心關鍵字 | 100% | 必然觸發 |
| 進階關鍵字 | 70% | 單一關鍵字即觸發 |
| 其他自然語 | 30% | 隨機匹配 |
| 歧義命中 | 15% | 需要確認 |

#### 2.2 機率加權

觸發機率 = (關鍵字分數 × 頻率) + (上下文相似度 × 0.3) + 隨機種子 (0-0.2)

- 單一高權重關鍵字：自動觸發 (1.0)
- 多關鍵字組合：權重加總，上限 1.0
- 低權重 (< 0.3)：記錄，不自動執行

#### 2.3 自然語解析範例

```typescript
// 輸入：best-practice-awakening 並查詢目前狀態
{
  triggers: ["best-practice-awakening", "query"],
  actions: ["awaken()", "query()"],
  priority: ["best-practice-awakening", "query"],
  probability: 1.0
}
```

---

### 3. 工具選擇權重

| 工具類別 | 關鍵字 | 權重 |
|----------|--------|------|
| 記憶查詢 | query, 查詢, 讀取 | 0.8 |
| 技能成長 | best-practice-awakening, grow | 0.7 |
| 反思 | reflect, 學習 | 0.75 |
| 系統初始化 | best-practice-awakening, start | 0.9 |
| 協作 | share, 協作 | 0.65 |
| 結界 | inherit, 繼承 | 0.5 |

---

### 4. 信心分數與反饋

| 信心分數 | 處理方式 |
|----------|----------|
| >= 0.9 | 自動執行 |
| 0.7 - 0.9 | 記錄後自動執行 |
| 0.4 - 0.7 | 詢問用戶 |
| < 0.4 | 記錄不執行 |

---

### 5. 實際示例

#### 5.1 單一自然語

**輸入**：best-practice-awakening
**解析**：核心關鍵字
**輸出**：`awaken()`

**輸入**："查詢 best-practice-awakening 狀態"
**解析**：查詢 + 技能
**輸出**：`query()`, `doctor()`

#### 5.2 複雜自然語

**輸入**："我今天學到新東西，幫我記住並分享"
**解析**：
- 關鍵字：`growth`, `share`, `memory`
- 行動：`recordLearning()`, `recordMemory()`, `cross-agent sync`
- 權重：0.75
- 輸出：`growSkill()`, `remember()`, `tagSkill("share:active")`

**輸入**："讓我檢查一下 best-practice-awakening 狀態"
**解析**：檢查
**輸出**：`doctor()`, `backend()`

---

### 6. 參數一致性

此技能的默認配置：
- **doctor／backend 與 awaken 必須用同一組參數**
- **所有憑證來源 = `secret-vault/ENV20230818.env`**
- **絕不在代碼中硬編碼憑證**
- **NCBDB 為主，local 為備份**
- **所有成長記錄必須帶 `agent_id`、`timestamp`、`source_origin`**
