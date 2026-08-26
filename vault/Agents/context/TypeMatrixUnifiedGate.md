---
source_origin: oa-team-terminal-origin-gate
created: 2026-08-26
modified: 2026-08-26
co_authors: [oa-gap-matrix-terminal-origin]
lifecycle: active
access: public-research
tags: [type-matrix, terminal-origin, 5t, unified-gate, gap-remediation, float-matrix, oa-swarm]
---

# 終始矩陣統一驗證閘 (Unified Terminal-Origin Matrix Gate)

> 全域全端全量全面 · 繁中+英文 · 雙向 TypeScript 同步 · 5T 同一套守門

## 核心不變式
所有終始矩陣併入同一套 5T 守門：**統一閘只聚合子閘 exit code，任一子矩陣紅燈即整體紅燈**（5T Trustworthy 不可篡改閉環，不得宣稱通過）。

## 四套已併入的終始矩陣（2026-08-26）
| # | 矩陣 | canonical | 自有 verify 閘 | 不變式 |
|---|------|-----------|----------------|--------|
| 1 | 缺口補齊 (Gap Remediation) | shared/types.ts + shared/gap-matrix.ts | scripts/verify_gap_matrix.ts (tsx) | 30 成員 / 10 陣列對 / 60 基礎 / 12 樞紐 / **72 全量** / 30·30 觸達 |
| 2 | OmniLive Float (漂浮窗 RWD) | apps/universal-translator/types/float-matrix.ts + shared/float-matrix.mjs | apps/universal-translator/scripts/verify-float-matrix.mjs | 5 柱 / 19 CSS 變數 / 4 斷點 / SHA-256 |
| 3 | Learning-Center (消費端) | 同 #1 canonical | apps/learning-center/scripts/verify-matrix.mjs | consumer 契約完整 + 重放 72 |
| 4 | OA-Swarm 雙蜂 (60 員) | oa-swarm/src/soul-matrix-60.ts + shared/types.ts (OA 型別) | oa-swarm/scripts/verify-oa-gap.mjs | OA 型別同步 / 五陣列 MECE 10 對 / 雙蜂 60 觸達 / 5T 協定 |

## 拓撲
```
終 (canonical, 單一真相源)
   shared/types.ts + shared/gap-matrix.ts
        │ scripts/export-shared-types.js (雙向同步)
   ┌────┼────────┬──────────────┐
   ↓    ↓        ↓              ↓
始   types/  apps/*/      apps/*/       oa-swarm/
   .d.ts   types/gen    types/gen      types/gen
           (ut/float)  (lcConsumer)    (oa-swarm)
```

## 統一閘實作
- 腳本：`scripts/verify-terminal-origin.mjs`（純 node，spawnSync 串接四子閘，聚合 exit code）
- npm：`pnpm verify:matrix`
- CI：`.github/workflows/ci.yml` → job `terminal-origin`
- 關鍵：mjs **不重算**數學斷言，只聚合子閘——避免兩處真相源漂移

## 5T 對應
- Traceable: 每配對/每型別帶 source_origin；consumer .d.ts 可溯源
- Trackable: derive 函式可重放，CI 每跑重生；子閘生命週期 Hook
- Tangible: .d.ts / float.html CSS 變數 實體落檔
- Transparent: 72/10/30、60/10 由名冊程式化派生，非手寫清單
- Trustworthy: verify 任一違反 exit 1，CI 阻斷

## 相關結點
- [[TypeMatrix]] — 終始矩陣基礎拓撲
- [[GapRemediation]] — 缺口補齊 72 配對單一真相源
- [[FloatMatrix]] — OmniLive 漂浮窗 RWD 五柱
- [[OA60Matrix]] — 雙蜂 60 員

## 實證（2026-08-26）
`node scripts/verify-terminal-origin.mjs` → UNIFIED_EXIT=0（四路全綠）
push: origin/main @ 59aedd34f

## Pitfalls（實戰）
- 閘 exit code 誤判：抓退出碼勿在 `$?` 前接 `| tail`/`head`（抓到 pager 碼）；MSYS 用 `>nul` 會誤生空檔 `nul` → 用 `>/dev/null 2>&1`
- 分支異常：git stash pop 後 cwd 可能不在 main，commit 落錯分支 → 每次 commit 前 `git branch --show-current`；落錯 cherry-pick 回 main
- git index 鎖：工作樹有他人 WIP 且 stash 報 could not write index 時，勿強行 rebase/push；先只 commit 本輪檔
- consumer 閘斷言只能驗「該 consumer 實際消費的契約」：learning-center 只含缺口補齊契約（Float 不經根生成器分發），多驗 Float 會假紅燈
- oa-swarm 自有閘 ROOT 路徑寫 `../.. /esggo/shared` 較脆，湊巧能讀到；未來搬目錄可能壞
