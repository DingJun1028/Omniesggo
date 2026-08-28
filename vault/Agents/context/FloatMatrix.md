---
source_origin: oa-float-matrix
created: 2026-08-26
modified: 2026-08-26
co_authors: [oa-gap-matrix-terminal-origin]
lifecycle: active
access: public-research
tags: [float-matrix, type-matrix, rwd, 5t, omnilive]
---

# OmniLive Float 終始矩陣 (漂浮窗 RWD 雙向同步)

> 深貫廣通無礙圓通 • RWD × 字幕 × 音訊 × 房間 × 分享 五柱 • TypeScript 雙向同步 • SHA-256 Hash Lock

## 拓撲定位
OA-Team 終始矩陣體系第二套（第一套為 [[GapRemediation]] 72 配對）。
canonical: `apps/universal-translator/types/float-matrix.ts` + `shared/float-matrix.mjs`
consumer: `public/float.html` (CSS `:root` 變數) ←→ TypeScript 型別（驗證閉環）

## 五大柱
1. **RWD 響應式**：4 斷點 (mobile/tablet/desktop/ultrawide) + orientation + safe-area + fontScale (vw+clamp 像素完美)
2. **字幕**：SubtitleSource(sse/manual/stt/caption) + 每行帶 source_origin + hash (5T)
3. **音訊**：AudioSource(system-display/mic/device/caption) + volume + chunkSize
4. **房間**：Role(caster/viewer) + RoomStatus(idle/active/ended/locked) + 生命週期 Hook
5. **分享**：casterLink/viewerLink + qrCode + source_origin (5T Transparent)

## 終始矩陣 (End-Beginning Matrix)
- `FloatEndBeginMatrix`: endState(終態驗收) + startChain(起始必行) + gate(pass/score/hashLock)
- `FloatGlobalState`: 全域全端全量同步 (frontend↔backend 雙向) + 5T Hash Lock (SHA-256, 64 字)
- `FLOAT_CANONICAL`: 斷點/來源/角色/版本 宣告式常量（單一真相源）
- `validateFiveT(state)`: traceable/trackable/tangible/transparent/trustworthy 五維驗算

## 驗證閘
`apps/universal-translator/scripts/verify-float-matrix.mjs` (純 mjs, 12/12 通過)：
- Traceable: TS↔Runtime 雙向同步 (BREAKPOINT_NAMES/SUBTITLE_SOURCES/AUDIO_SOURCES/ROLES/CSS_VARS/VERSIONS 6 項)
- Trackable: START_CHAIN + END_STATE 生命週期存在
- Tangible: float.html 含 19 CSS 變數 + 金黃主調 #ffd479
- Transparent: validateEndBeginMatrix + hashLock 機制存在
- Trustworthy: SHA-256 Hash Lock 實作

## 5T 對應
- Traceable: 字幕/分享 source_origin
- Trackable: 房間 createdAt/updatedAt 生命週期
- Tangible: 19 CSS 變數實體落 float.html
- Transparent: 驗算結果公開、分享連結可追蹤
- Trustworthy: SHA-256 Hash Lock (64 字)

## 相關結點
- [[TypeMatrixUnifiedGate]] — 四套矩陣統一閘（本矩陣為其二）
- [[TypeMatrix]] — 終始矩陣基礎拓撲
- [[GapRemediation]] — 缺口補齊 72 配對
- [[OA60Matrix]] — 雙蜂 60 員

## 實證
`node apps/universal-translator/scripts/verify-float-matrix.mjs` → 12/12 通過 (EXIT=0)
