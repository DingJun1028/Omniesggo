---
source_origin: oa-gap-matrix-terminal-origin
created: 2026-08-26
modified: 2026-08-26
co_authors: [oa-gap-matrix-terminal-origin]
lifecycle: active
access: public-research
tags: [gap-remediation, type-matrix, 5t, pairings]
---

# 缺口補齊終始矩陣 (Gap Remediation Matrix)

> soul.md §4 缺口補齊 • 30 員矩陣 • 單一真相源派生 72 配對 • 雙語(繁中+English)

## 核心不變式（深貫廣通無礙圓通）
- 5 陣列 MECE: strategy / technology / creative / marketing / guard
- 陣列對 C(5,2) = **10**（兩兩窮盡）
- 基礎配對 = 10 × 6 = **60**（每陣列對內 6 條跨組 1:1，編號 1–30 不越界、不重複同陣列）
- 樞紐配對 = **12**（守衛防護 6 + 蜂后總控 6）
- 全量 = 60 + 12 = **72**；觸達 **30/30**（無孤島成員）
- 每配對帶 `source_origin: 'gap-matrix-canon'`（5T Traceable）

## 單一真相源拓撲
```
終 (canonical): esggo/shared/types.ts (型別一次定義)
           + shared/gap-matrix.ts (名冊30 + 陣列對10 + 樞紐規則 → 派生 72)
生成器: scripts/export-shared-types.js (雙向同步 → consumer .d.ts)
始 (consumer): types/generated/ + apps/*/types/generated/esggo-shared.d.ts
驗證: scripts/verify_gap_matrix.ts (10 斷言, 任一違反 exit 1)
```

## §4.1 具名配對（15 對）
以名冊 title 為真相源解析 (a,b) 編號，**不盲從 canon §4.1 漂移標頭**（5T 誠實）：
規劃蜂⇄設計蜂、分析蜂⇄圖像蜂、策効蜂⇄動畫蜂、風險蜂⇄文案蜂、優化蜂⇄音頻蜂、
編碼蜂⇄市場蜂、算法蜂⇄社群蜂、架構蜂⇄增長蜂、數據蜂⇄運營蜂、測試蜂⇄商業分析蜂、
探路蜂⇄規劃蜂、外交蜂⇄策効蜂、調研蜂⇄分析蜂、測場蜂⇄風險蜂、追蹤蜂⇄優化蜂。

## 5T 對應
- Traceable: 每配對 source_origin
- Trackable: derive 函式可重放，CI 每跑重生
- Tangible: 終→始 .d.ts 實體落檔，consumer import 可用
- Transparent: 72/10/30 由名冊程式化派生，非手寫清單
- Trustworthy: verify_gap_matrix.ts 任一違反 exit 1，CI 阻斷

## 相關結點
- [[TypeMatrixUnifiedGate]] — 四套矩陣統一閘（本矩陣為其一）
- [[TypeMatrix]] — 終始矩陣基礎拓撲
- [[FloatMatrix]] — OmniLive 漂浮窗 RWD 五柱
- [[OA60Matrix]] — 雙蜂 60 員

## 實證
`npx tsx scripts/verify_gap_matrix.ts` → 10/10 通過（30 成員 / 10 陣列對 / 60 基礎 / 12 樞紐 / 72 全量 / 30·30 觸達 / §4.1 具名 15 對跨陣列）
