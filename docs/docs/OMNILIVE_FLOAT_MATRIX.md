# OmniLive Float 終始矩陣 (漂浮窗 RWD 雙向同步)

> 深貫廣通無礙圓通 · RWD × 字幕 × 音訊 × 房間 × 分享 五柱 · TypeScript 雙向同步 · SHA-256 Hash Lock

## 一、拓撲定位

本矩陣是 OA-Team 終始矩陣體系中的 **第二套**（第一套為缺口補齊 72 配對）。其 canonical 在 `apps/universal-translator`，屬 app-local 契約，**不**經根層 `scripts/export-shared-types.js` 分發給其他 consumer（故 learning-center 的 .d.ts 不含 Float 契約，這是正確的）。

```
        終 (canonical)
   apps/universal-translator/types/float-matrix.ts  (型別一次定義)
                    │
   apps/universal-translator/shared/float-matrix.mjs  (執行時鏡像, 雙向對齊)
                    │
   apps/universal-translator/public/float.html  (始: CSS :root 變數 + data-* 屬性)
                    │
   apps/universal-translator/scripts/verify-float-matrix.mjs  (5T 驗算閘, EXIT=0)
```

## 二、五大柱 (5 Pillars)

| 柱 | 型別 | 關鍵欄位 | 5T 落點 |
|----|------|----------|---------|
| RWD 響應式 | `RWDConfig` / `Breakpoint` | mobile/tablet/desktop/ultrawide, fontScale, safeArea | Tangible: 1:1 像素完美, vw+clamp |
| 字幕 | `SubtitleLine` / `SubtitleGroup` | text, speaker, source_origin, hash | Traceable: 每行帶 source_origin + Hash Lock |
| 音訊 | `AudioConfig` | source, deviceId, format, volume, chunkSize | Trackable: 分段間隔生命週期 |
| 房間 | `RoomConfig` | roomId, role, status, createdAt/updatedAt, viewerCount | Trackable: 房間生命週期 Hook |
| 分享 | `ShareConfig` | casterLink, viewerLink, qrCode, source_origin | Transparent: 連結可追蹤 |

## 三、RWD 斷點矩陣 (4 Breakpoints)

```ts
export const FLOAT_CANONICAL = {
  breakpoints: {
    mobile:    { min: 0,    max: 600 },
    tablet:    { min: 601,  max: 900 },
    desktop:   { min: 901,  max: 1440 },
    ultrawide: { min: 1441, max: Infinity },
  },
  orientations: ['portrait', 'landscape'],
  subtitleSources: ['sse', 'manual', 'stt', 'caption'],
  audioSources: ['system-display', 'mic', 'device', 'caption'],
  roles: ['caster', 'viewer'],
  roomStatuses: ['idle', 'active', 'ended', 'locked'],
  versions: ['1.0.0', '1.1.0', '1.2.0', '2.0.0'],
};
```

`shared/float-matrix.mjs` 的 `BREAKPOINT_NAMES` 必須與 `FLOAT_CANONICAL.breakpoints` 的 key 完全一致——驗證閘擷取 `BREAKPOINT_NAMES` 與 TS 對齊，確保 **TypeScript ↔ Runtime 雙向同步**。

## 四、19 CSS 變數 (FloatCSSVars)

深石墨玻璃設計（inspired by Akkadu, improved）。`float.html` 的 `:root` 必須含全部 19 項，驗證閘逐項比對：

| # | 變數 | 值（範例） | 用途 |
|---|------|-----------|------|
| 1 | `--cap-bg` | rgba(10,14,24,.6) | 字幕膠囊底 |
| 2 | `--src` | #ffffff | 原音白字 |
| 3 | `--trs` | #7fe9d6 | 翻譯青字 |
| 4 | `--gold` | #ffd479 | 金黃主調 |
| 5 | `--ui` | #e8eef7 | UI 文字 |
| 6 | `--accent` | #36e0c0 | 強調色 |
| 7 | `--accent2` | #5b8cff | 次強調 |
| 8 | `--line` | rgba(255,255,255,.14) | 分隔線 |
| 9 | `--ok` | #22c55e | 成功 |
| 10 | `--warn` | #ffb020 | 警告 |
| 11 | `--err` | #ff5d6c | 錯誤 |
| 12 | `--bg` | #070b12 | 背景 |
| 13 | `--panel` | rgba(20,27,41,.72) | 面板 |
| 14 | `--panel2` | rgba(14,22,35,.6) | 次面板 |
| 15 | `--muted` | #8a97ad | 弱化文字 |
| 16 | `--txt` | #eaf1fb | 主文字 |
| 17 | `--radius` | — | 圓角 |
| 18 | `--gap` | — | 間距 |
| 19 | `--font` | — | 字族 |

## 五、終始矩陣 (End-Beginning Matrix)

```ts
export interface FloatEndBeginMatrix {
  endState: FloatEndState;     // 終態驗收條件 (5T 五布林)
  startChain: FloatStartChain; // 起始必行清單
  gate: { pass: boolean; score: number; hashLock: string }; // 5T 驗算閘
}
```

`validateFiveT(state: FloatGlobalState): boolean` 實作 5T 閉環：
- **Traceable**: 每字幕組 `source_origin` 存在
- **Trackable**: `lastUpdated > 0 && version !== ''`
- **Tangible**: `fontSizeSrc.min > 0 && fontSizeDst.min > 0`
- **Transparent**: `hashLock !== ''`
- **Trustworthy**: `hashLock.length === 64`（SHA-256）

## 六、5T 驗算閘 (verify-float-matrix.mjs)

`node apps/universal-translator/scripts/verify-float-matrix.mjs` 執行 12 項斷言：
1. Traceable — TS↔Runtime 雙向同步（BREAKPOINT_NAMES / SUBTITLE_SOURCES / AUDIO_SOURCES / ROLES / CSS_VARS / VERSIONS 共 6 組一致性）
2. Trackable — START_CHAIN / END_STATE 生命週期 Hook 存在
3. Tangible — float.html 含 19 CSS 變數 + 金黃主調 #ffd479
4. Transparent — 驗證閘機制存在（validateEndBeginMatrix + hashLock）
5. Trustworthy — SHA-256 Hash Lock 實現

分數 100% 即 EXIT=0，否則 EXIT=1（不可篡改閉環）。

## 七、併入統一閘

本矩陣已被 `scripts/verify-terminal-origin.mjs` 的 `terminal-origin` 統一閘涵蓋（第二路）。任何 float 契約漂移都會讓統一閘整體紅燈。

```bash
# 單跑
node apps/universal-translator/scripts/verify-float-matrix.mjs
# 統一閘 (含缺口補齊 72 + Float 5柱 + Learning-Center 消費端)
node scripts/verify-terminal-origin.mjs
```

## 八、擴充守則

- 加新 CSS 變數 → 同時改 `types/float-matrix.ts` (FloatCSSVars) + `shared/float-matrix.mjs` (CSS_VARS) + `public/float.html` (:root) 三處，驗證閘會抓漏。
- 加新斷點 → 改 `FLOAT_CANONICAL.breakpoints` + `getBreakpoint()` 閾值 + `getFontScale()` 縮放表。
- 切勿手寫鏡像清單：始端必須由終端生成/驗證， drift 即紅燈。

> 相關：見 `docs/TERMINAL_ORIGIN_MATRIX.md`（三套終始矩陣總覽）。
