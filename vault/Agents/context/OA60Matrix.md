---
source_origin: oa-swarm
created: 2026-08-26
modified: 2026-08-26
co_authors: [oa-gap-matrix-terminal-origin]
lifecycle: active
access: public-research
tags: [oa-swarm, type-matrix, 5t, 60-agents, dual-hive]
---

# OA-Swarm 雙蜂 60 員終始矩陣 (Dual-Hive 60 Matrix)

> 蜂王 1-30 + 蜂后 31-60 • 雙蜂隊架構 • 五陣列 MECE • 5T 協定 purify+verifyZeroHallucination

## 拓撲定位
OA-Team 終始矩陣體系第四套（前三套：[[GapRemediation]] 72 / [[FloatMatrix]] 5柱 / Learning-Center 消費端）。
canonical: `oa-swarm/src/soul-matrix-60.ts` + `shared/types.ts` (OA 型別)
consumer: `oa-swarm/types/generated/esggo-shared.d.ts`
自有閘: `oa-swarm/scripts/verify-oa-gap.mjs`

## 結構
- `HiveSide`: 'local' | 'vps'（雙蜂部署側）
- `ArrayKey`: 'sanctum' | 'rune' | 'wing' | 'alchemy' | 'audit'（五陣列，對映 30 矩陣的 5 大陣列語意）
- `SOUL_MATRIX_60`: 60 員 SoulAgent60[]（蜂王 1-30 + 蜂后 31-60）
- `LOCAL_AGENTS` / `VPS_AGENTS`: 按 side 過濾
- 重編 id: `.map((a,i) => ({...a, id: i+1}))` → 1-60 連續觸達

## 驗證閘（5/5 全過）
`oa-swarm/scripts/verify-oa-gap.mjs`：
1. canonical 含 OA 型別 (HiveSide/ArrayKey/ISoulAgent/IComponentCore/ISoulArtifact/ISwarmTask/SwarmTaskResult/IOABMessage/I5TVerification)
2. consumer 生成檔含 OA 型別（終→始 雙向同步）
3. 五陣列 MECE 配對 = C(5,2) = 10 對
4. 雙蜂 60 員觸達（A(' 條目 60/60 + 重編 id）
5. 5T 協定 `purify` + `verifyZeroHallucination` 存在（零幻覺驗算）

## 路徑穩健化（2026-08-26 修）
原 `SRC = path.join(ROOT,'..','..','esggo','shared','types.ts')` 依賴目錄巧合；
改為 `path.resolve(ROOT,'..','shared','types.ts')`（ROOT=esggo/oa-swarm → ROOT/.. = esggo → shared/types.ts），
搬目錄不再壞。

## 5T 對應
- Traceable: ISoulArtifact source_origin
- Trackable: swarm-core 生命週期 Hook
- Tangible: dashboard.html 5T 視覺化 (8f2ea5cd1 加入)
- Transparent: protocol-5t purify 公開演算
- Trustworthy: verifyZeroHallucination (零幻覺) + Hash Lock

## 相關結點
- [[TypeMatrixUnifiedGate]] — 四套矩陣統一閘（本矩陣為其四）
- [[TypeMatrix]] — 終始矩陣基礎拓撲
- [[GapRemediation]] — 缺口補齊 72 配對
- [[FloatMatrix]] — OmniLive 漂浮窗 RWD 五柱

## 實證
`node oa-swarm/scripts/verify-oa-gap.mjs` → 5/5 通過 (EXIT=0)
