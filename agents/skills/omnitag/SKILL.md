---
name: omnitag
category: taxonomy
description: OmniTag 萬能標籤系統 究極版奧義 — ESG-GO 統一標籤分類、安全分級、自動路由、熵減治理、最佳實踐覺結界 inheritance
tags: tagging, taxonomy, esggo, routing, governance, classification
load: on_match
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
| 品質/熵減 | priority | p0 / p1 / p2 / p3 | P0=阻断項、P3=噪音 | [p0] |
| 平台/環境 | platform | esggo / omni / vps / firebase / vercel / github | 部署環境 | [platform:vps] |
| 最佳實踐覺 | best-practice | awakened / 结界 / draft | 覺醒狀態 | [best-practice:结界] |

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
| [best-practice:结界] | 全部自動 inheriting | Agent 06 |
| [security:restricted] | 加密通道 + 限權存取 | Agent 11 |
| [lifecycle:frozen] | 唯讀鏡像 + 禁止修改 | Agent 26 |

路由優先級: 1. security:restricted → 2. best-practice:结界 → 3. p0 → 4. agent:* → 5. squad:* → 6. platform:* → 7. lifecycle:*

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
  - best-practice:结界

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
2. 結界自動繼承：best-practice:结界 會自動擴散至全部子代理
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
| 最佳實踐覺結界 | best-practice:awakened / best-practice:结界 | 覺醒狀態 inheritance |
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
| Secrets 更新 | [agent:11][security:restricted][p0][best-practice:结界] |
| 過往記憶歸檔 | [agent:01][lifecycle:archived][p3][platform:omni] |
| VPS 監控 | [agent:13][lifecycle:active][p2][platform:vps][best-practice:awakened] |
| Docker 健康檢查 | [agent:14][lifecycle:active][p2][platform:vps][best-practice:结界] |
| 熵減治理 | [agent:22][lifecycle:active][p1][entropy-target:<0.1] |

---

究極版奧義 v1.0 | OmniTag Universal Tagging Ultimate Edition
MECE 六維 + 自動路由 + 結界繼承 | License: AGPL-3.0