# OA-Team 終始矩陣總覽 (Terminal-Origin Matrix Overview)

> 全域全端全量全面 · 繁中 + 英文 · 雙向 TypeScript 同步 · 5T 驗算閘

## 一、核心哲學

「終始矩陣」= 所有型別契約在 **終 (canonical)** 單一來源一次性定義，經生成器 **雙向同步** 到各 **始 (consumer)** 端消費，任一端需求變更都回饋 canonical 重跑生成 → 全端同步。絕不允許手寫枚舉漂移。

```
        終 (canonical, single source of truth)
   shared/types.ts  +  shared/gap-matrix.ts (名冊/派生)
                    │
        scripts/export-shared-types.js (雙向同步生成器)
                    │
   ┌────────────────┼────────────────┐
   ↓                ↓                ↓
 始 (consumer)   始 (consumer)   始 (consumer)
 types/          apps/universal-  apps/learning-
 generated/       translator/      center/types/
 esggo-shared     types/generated/ generated/
 .d.ts            esggo-shared.d.ts esggo-shared.d.ts
```

## 二、已建置的五套終始矩陣

| # | 矩陣 | canonical | consumer | 自有 verify 閘 | 不變式 |
|---|------|-----------|----------|----------------|--------|
| 1 | **缺口補齊** (Gap Remediation) | `shared/types.ts` + `shared/gap-matrix.ts` | `types/`, `apps/*/types/generated/esggo-shared.d.ts` | `scripts/verify_gap_matrix.ts` (tsx) | 30 成員 / 10 陣列對 / 60 基礎 / 12 樞紐 / **72 全量** / 30·30 觸達 |
| 2 | **OmniLive Float** (漂浮窗 RWD) | `apps/universal-translator/types/float-matrix.ts` + `shared/float-matrix.mjs` | `public/float.html` (CSS `:root` 變數) | `apps/universal-translator/scripts/verify-float-matrix.mjs` | 5 柱 (RWD×字幕×音訊×房間×分享) / 19 CSS 變數 / 4 斷點 / SHA-256 Hash Lock |
| 3 | **Learning-Center** (消費端) | 同 #1 canonical | `apps/learning-center/types/generated/esggo-shared.d.ts` | `apps/learning-center/scripts/verify-matrix.mjs` | consumer 契約完整性 + 重放 #1 的 72 不變式 |
| 4 | **OA-Swarm 雙蜂** (60 員) | `oa-swarm/src/soul-matrix-60.ts` + `shared/types.ts` (OA 型別) | `oa-swarm/types/generated/esggo-shared.d.ts` | `oa-swarm/scripts/verify-oa-gap.mjs` | OA 型別 canonical↔consumer 同步 / 五陣列 MECE 10 對 / 雙蜂 60 員觸達 / 5T 協定 purify+verifyZeroHallucination |
| 5 | **增量輸出** (§12/§15.5) | `src/incremental-output/index.ts` | `IncrementalArtifact` (frozen + hashLock) | `scripts/verify-incremental.mjs` (tsx) | 增量 delta 套用 / Object.freeze + FNV-1a Hash Lock / 5T 閘 verifyFiveTGate / 生命週期 hook |

## 三、統一驗證閘 (Unified Gate)

所有矩陣併入同一套 5T 守門，避免「部分綠燈就宣稱矩陣健康」的幻覺：

- 腳本：`scripts/verify-terminal-origin.mjs`（純 node，聚合子閘 exit code，**任一子矩陣紅燈即整體紅燈**）
- npm：`pnpm verify:matrix`
- CI：`.github/workflows/ci.yml` → job `terminal-origin`
- 子閘清單：
  1. `verify_gap_matrix.ts` → 缺口補齊 72
  2. `verify-float-matrix.mjs` → OmniLive Float 5 柱
  3. `verify-matrix.mjs` (learning-center) → consumer 契約 + 72 重放
  4. `verify-oa-gap.mjs` (oa-swarm) → 雙蜂 60 員 + 五陣列 MECE + 5T 協定
  5. `verify-incremental.mjs` (tsx) → 增量輸出 §12/§15.5 + 5T 閘

## 四、5T 對應表

| 5T | 缺口補齊 | OmniLive Float | Learning-Center |
|----|----------|----------------|-----------------|
| Traceable | 每配對 `source_origin` | 字幕 `source_origin` + 房間生命週期 | consumer .d.ts 含契約溯源 |
| Trackable | derive 函式可重放, CI 每跑重生 | START_CHAIN / END_STATE Hook | 重放根層 72 不變式 |
| Tangible | .d.ts 實體落檔可 import | float.html 19 CSS 變數實體 | 契約落地 consumer |
| Transparent | 72/10/30 程式化派生, 非手寫清單 | 驗證閘機制公開 | 契約可被 verify 讀取 |
| Trustworthy | verify 任一違反 exit 1 | SHA-256 Hash Lock | 缺契約即 exit 1 |

## 五、本地驗證指令 (真實取證)

```bash
# 統一閘 (三矩陣全驗)
node scripts/verify-terminal-origin.mjs

# 單矩陣
npx tsx scripts/verify_gap_matrix.ts                 # 缺口補齊 72
node apps/universal-translator/scripts/verify-float-matrix.mjs   # Float 5柱
node apps/learning-center/scripts/verify-matrix.mjs # LC 消費端

# 雙向同步再生 (終→始)
node scripts/export-shared-types.js
```

## 六、擴充守則 (日後加第四套矩陣)

1. 在對應 app 建 `types/*.ts` canonical + 自有 `verify-*.mjs` 閘 (exit 1 阻斷)
2. 在 `scripts/verify-terminal-origin.mjs` 加一行 `runGate(...)` 併入統一閘
3. 在 `package.json` 加 `verify:matrix` 腳本 (若有需要)
4. 若需跨端共享型別, 把契約加入 `shared/types.ts` + `scripts/export-shared-types.js` 的 map → 自動雙向同步

> 關鍵不變式：**統一閘只聚合子閘 exit code, 不複製數學斷言**, 否則兩處真相源會漂移。

## 七、相關技能

- Hermes skill: `oa-gap-matrix-terminal-origin`（含 Step 1–6 實作 + 踩坑 Pitfalls）
- 參考：`docs/soul.md`（§4 缺口補齊）、`docs/soul-canon-illustrated-guide.md`
