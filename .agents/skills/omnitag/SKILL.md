---
name: omnitag
category: taxonomy
description: OmniTag 萬能標籤系統 究極版奧義 — ESG-GO 統一標籤分類、安全分級、自動路由、熵減治理、最佳實踐覺結界 inheritance
tags: tagging, taxonomy, esggo, routing, governance, classification
load: on_match
title: Omni Tag
version: 1.0.0
title: Omni Tag
version: 1.0.0
---

# OmniTag 萬能標籤系統 — 究極版奧義

> 一分類，萬物明；一標籤，萬路由。
> Ultimate Edition — MECE 六維 + 自動路由 + 結界繼承

---

## 第一奧義：核心定義

OmniTag 是 ESG-GO 萬能蜂群的統一標籤系統，用於：

- 分類所有代理、任務、artifact、cron job
- 安全分級與機密管控
- 自動化路由與調度
- 熵減治理與品質分級
- 結界 inheritance（最佳實踐覺擴散）

---

## 第二奧義：六大維度（MECE）

| 維度 | 鍵 | 可取值 | 說明 | 範例 |
|------|----|--------|------|------|
| 安全分級 | security | public / internal / confidential / restricted | 資料機密等級 | [security:restricted] |
| 代理歸屬 | agent | 01 ~ 30; squad:智庫聖所/符文契約/光之羽翼/煉金熵減/5T驗算 | 責任歸屬 | [agent:13][squad:光之羽翼] |
| 生命週期 | lifecycle | draft / active / frozen / archived | 狀態追蹤 | [lifecycle:active] |
| 品質/熵減 | priority | p0 / p1 / p2 / p3 | P0=阻斷項、P3=噪音 | [p0] |
| 平台/環境 | platform | esggo / omni / vps / firebase / vercel / github | 部署環境 | [platform:vps] |
| 最佳實踐覺 | best-practice | awakened / 結界 / draft | 覺醒狀態 | [best-practice:結界] |

完整語法: [security:level][agent:id][squad:name][lifecycle:state][p0-3][platform:env][best-practice:state]

---

## 第三奧義：自動化路由引擎

| Tag 組合 | 路由目標 | 閘道 |
|----------|---------|------|
| [agent:01-06][squad:智庫聖所] | Hindsight / 記憶召回 | Agent 01 |
| [agent:07-12][squad:符文契約] | API / TypeScript / ZKP 修復 | Agent 07 |
| [agent:13-18][squad:光之羽翼] | 部署 / cron / 自動化 | Agent 13 |
| [agent:19-24][squad:煉金熵減] | 重構 / lint / test / entropy | Agent 19 |
| [agent:25-30][squad:5T驗算] | ISO / Hash Lock / 稽核 | Agent 25 |
| [best-practice:結界] | 全部自動 inheriting | Agent 06 |
| [security:restricted] | 加密通道 + 限權存取 | Agent 11 |
| [lifecycle:frozen] | 唯讀鏡像 + 禁止修改 | Agent 26 |

路由優先順序: 1. security:restricted → 2. best-practice:結界 → 3. p0 → 4. agent:* → 5. squad:* → 6. platform:* → 7. lifecycle:*

---

## 第四奧義：實戰標籤範本

### Agent 啟動

tags:
  - security:internal
  - agent:13
  - squad:光之羽翼
  - lifecycle:active
  - p1
  - platform:vps
  - best-practice:awakened

### CI Pipeline（PR #1512）

tags:
  - security:public
  - agent:15
  - squad:光之羽翼
  - lifecycle:active
  - p0
  - platform:github
  - best-practice:結界

### Cron Job（esggo-monitor-vps-health）

tags:
  - security:internal
  - agent:13
  - squad:光之羽翼
  - lifecycle:active
  - p2
  - platform:vps
  - best-practice:awakened
deliver: all

### Secrets 輪換（Firebase）

tags:
  - security:restricted
  - agent:11
  - squad:符文契約
  - lifecycle:active
  - p0
  - platform:firebase
  - best-practice:awakened

### Hindsight 記憶歸檔

tags:
  - security:internal
  - agent:01
  - squad:智庫聖所
  - lifecycle:archived
  - p3
  - platform:omni

---

## 第五奧義：驗證規則

1. 必備 Tag：每個 artifact 至少要有 agent:* + lifecycle:* + p*
2. 結界自動繼承：best-practice:結界 會自動擴散至全部子代理
3. 凍結不可改：lifecycle:frozen + restricted 的 artifact 禁止修改
4. 熵減追蹤：p0 任務完成後 entropy 必須下降 < 0.1
5. 衝突處理：security:restricted 不可與 public 共存（自動升級為 restricted）

不允許組合：
- lifecycle:frozen + lifecycle:active（狀態衝突）
- security:public + security:restricted（安全矛盾）
- p0 + p3（優先級衝突）
- best-practice:awakened + lifecycle:draft（覺醒不可為草稿）

---

## 第六奧義：與 ESG-GO 生態整合

| ESG-GO 概念 | OmniTag 映射 | 使用方式 |
|------------|-------------|---------|
| 5T Protocol | agent:* / squad:* / platform:* | 責任歸屬 + 環境追蹤 |
| 4 可 1 不可 | lifecycle:active / lifecycle:frozen | 狀態管理 |
| Hash Lock | lifecycle:frozen + security:restricted | 凍結不可改 |
| 熵減 < 0.1 | p0 / p1 / p2 / p3 | 品質分級 + 治理目標 |
| 最佳實踐覺結界 | best-practice:awakened / best-practice:結界 | 覺醒狀態 inheritance |
| 萬能自動 | platform:* + lifecycle:active | 跨平台自動化路由 |

跨技能整合：
- OA-Team 30 蜂群：代理歸屬 + 路由
- 萬能自動：自動化流程標記
- 最佳實踐覺：覺醒狀態追蹤
- VPS 部署：環境標記 + 安全分級

---

## 速查表

| 情境 | 標籤組合 |
|------|---------|
| 新 agent 啟動 | [agent:XX][squad:XXX][lifecycle:active][p2][best-practice:awakened] |
| CI 失敗修復 | [agent:15][lifecycle:active][p0][platform:github] |
| Secrets 更新 | [agent:11][security:restricted][p0][best-practice:結界] |
| 過往記憶歸檔 | [agent:01][lifecycle:archived][p3][platform:omni] |
| VPS 監控 | [agent:13][lifecycle:active][p2][platform:vps][best-practice:awakened] |
| Docker 健康檢查 | [agent:14][lifecycle:active][p2][platform:vps][best-practice:結界] |
| 熵減治理 | [agent:22][lifecycle:active][p1][entropy-target:<0.1] |

---

究極版奧義 v1.0 | OmniTag Universal Tagging Ultimate Edition
MECE 六維 + 自動路由 + 結界繼承 | License: AGPL-3.0

## 自然語觸發自動工具使用的機率 (Natural Language Auto-Tool Trigger)

### 1. 觸發關鍵字清單 (Trigger Keywords)

> 系統會自動識別輸入中的自然語觸發詞，觸發對應的工具/技能/代理。

#### 核心觸發詞

| 關鍵字 | 英文 | 觸發功能 | 機率權重 |
|--------|------|---------|----------|
| omnitag | auto | 觸發本技能 | 5.0 |
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
// 輸入：omnitag 並查詢目前狀態
{
  triggers: ["omnitag", "query"],
  actions: ["awaken()", "query()"],
  priority: ["omnitag", "query"],
  probability: 1.0
}
```

---

### 3. 工具選擇權重

| 工具類別 | 關鍵字 | 權重 |
|----------|--------|------|
| 記憶查詢 | query, 查詢, 讀取 | 0.8 |
| 技能成長 | omnitag, grow | 0.7 |
| 反思 | reflect, 學習 | 0.75 |
| 系統初始化 | omnitag, start | 0.9 |
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

**輸入**：omnitag
**解析**：核心關鍵字
**輸出**：`awaken()`

**輸入**："查詢 omnitag 狀態"
**解析**：查詢 + 技能
**輸出**：`query()`, `doctor()`

#### 5.2 複雜自然語

**輸入**："我今天學到新東西，幫我記住並分享"
**解析**：
- 關鍵字：`growth`, `share`, `memory`
- 行動：`recordLearning()`, `recordMemory()`, `cross-agent sync`
- 權重：0.75
- 輸出：`growSkill()`, `remember()`, `tagSkill("share:active")`

**輸入**："讓我檢查一下 omnitag 狀態"
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
