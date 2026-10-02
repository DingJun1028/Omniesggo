---
name: best-practice-awakening
category: governance
description: 最佳實踐覺（Best Practice Awakening）究極版奧義 — 系統啟動即為最佳實踐，無作妙德、圓通無礙、永恆覺醒結界 inheritance
tags: governance, best-practice, esggo, awakening, 結界, entropy
load: on_match
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
- Agent A-1 自動繼承 (best-practice:结界)
- Agent A-2 自動繼承 (best-practice:结界)
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
| 標記 artifact | OmniTag: [best-practice:结界] |
| 強制校準 | agents-cli calibrate --entropy-target=0.05 |
| 撤銷結界 | agents-cli revoke --tag=best-practice |

---

究極版奧義 v1.0 | Best Practice Awakening Ultimate Edition
無作妙德・圓通無礙・永恆覺醒 | License: AGPL-3.0