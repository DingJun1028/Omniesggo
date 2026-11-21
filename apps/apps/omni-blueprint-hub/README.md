# 萬能藍圖中心 (Omni-Blueprint Hub) v0.6.0

> 自託管即時多語翻譯轉播中樞 — 取代 Akkadu 付費顯示與共享。
> **成本 0 點數 / 0 元**，零外部 npm 依賴（純 Node 原生 fetch / WebSocket / http）。

線上：<https://live.esggo.co>

| 端點 | 用途 |
|---|---|
| `/studio.html` | 講者端 — 瀏覽器原生 Web Speech API 轉錄，麥克風授權即開播 |
| `/stream?src=studio` | 觀眾端 — RWD 多語便當盒字幕，深/淺主題、5T 溯源顯示 |
| `/healthz` | 健康檢查 — uptime / subscribers / 翻譯統計 / 版本 |
| `/speak` (POST) | 講者轉錄入口 → 多語翻譯 → SSE 廣播 |
| `/ingest` (POST) | 本機 chromium 抓到的 Akkadu 字幕推送入口 |

---

## 架構

```
講者麥克風
  └─ studio.html — Web Speech API (瀏覽器原生 STT，免 key)
       └─ POST /speak
            └─ monitor-server.mjs (中樞)
                 ├─ translate.mjs  LibreTranslate → MyMemory → 原文兜底
                 │                 平行翻譯 + LRU 快取 + 指數退避重試
                 └─ SSE broadcast ─┬─ event: translation  (多語 + 5T 欄位)
                                   ├─ event: caption      (Akkadu 字幕)
                                   ├─ event: room-status
                                   └─ event: snapshot / heartbeat
                                        └─ 觀眾 stream.html (任意人數)
```

nginx `live.esggo.co` 反代 `127.0.0.1:8787`（SSE 優化：`proxy_buffering off` + 3600s timeout）。

---

## 5T 協議落實

| 協議 | 實作 |
|---|---|
| **Traceable** 可溯源 | 每筆 payload 帶 `sourceOrigin`；`engines` 標記每語實際使用的翻譯引擎 |
| **Trackable** 可追蹤 | `timestamp` ISO-8601；pm2 日誌時戳；`/healthz` 統計 |
| **Transparent** 可透明 | `/healthz` 公開運行狀態、翻譯引擎、快取命中數 |
| **Tangible** 可感知 | Bento Box RWD UI、主題切換、字級調整、連線脈動指示 |
| **Trustworthy** 不可篡改 | 每筆 payload 附 sha256 `hash`；靜態資產白名單；token 認證；速率限制 |

---

## 快速開始

```bash
cp .env.example .env      # 依需求調整；真實 env 優先於 .env
bash run.sh               # 本機啟動 (wrapper，繞開 git-bash background 陷阱)
pnpm test                 # 端對端煙霧測試 (22 項，認證啟用時 25 項)
```

## 部署

```bash
bash deploy.sh                     # 一鍵：語法檢查→本機測試→scp→pm2重啟→公網驗證
bash deploy.sh --skip-local-test   # 僅前端改動時
```

任一階段失敗即中止（`set -euo pipefail`），**絕不在未驗證下宣稱成功**。

VPS 端由 `ecosystem.config.cjs` 管理：
```bash
pm2 start ecosystem.config.cjs && pm2 save
```

---

## 環境變數

見 `.env.example`。關鍵項：

| 變數 | 預設 | 說明 |
|---|---|---|
| `PORT` | 8787 | 監聽埠 |
| `LANG_TARGETS` | `zh-CN,en,ja,es,ko,fr` | 廣播目標語系 |
| `INGEST_TOKEN` | *(空)* | 設定後 `/speak` `/ingest` 需帶 Bearer token |
| `RATE_MAX` | 60 | 每 IP 每分鐘寫入上限 |
| `REPLAY_MAX` | 20 | 新訂閱者可回補的近期事件數 |
| `LIBRETRANSLATE_URL` | *(空)* | 設定即改用自建翻譯引擎 |

---

## 安全

- **靜態白名單**：`PUBLIC_FILES` 未列一律 404，`.mjs` / `.json` / `.conf` 不外洩
- **Token 認證**：`?token=` 或 `Authorization: Bearer`，未帶/錯誤一律 401
- **速率限制**：每 IP 每分鐘滑動視窗
- **優雅關閉**：SIGTERM 先收 SSE 連線再退出

---

## 外掛系統 (Hub Plugin System v0.7)

> 讓 Hub 可被蜂群 30 代理或第三方擴充 — 一套 5T 合規的 Plugin 子系統。
> 設計哲學：無作（失敗靜默）、圓通（鉤子廣播給所有 enabled 外掛）、無礙（單外掛錯不中斷整體）。

### 架構

```
OmniBlueprintHub
  └─ plugins: PluginRegistry (5T Gate + 生命週期)
       ├─ entropy-reducer    (萬能優化蜂 06) 監聽 onBroadcastPushed → 熵減 < 0.1
       ├─ conduit-bridge      (萬能編碼蜂 07) 監聽 onBroadcastPushed/onTranslation → 5T 封印轉跨蜂
       └─ soul-canon-verifier (萬能質控蜂 30) 監聽 onProductManifested/onBlueprintCreated → 30矩陣校驗
```

### 5T Gate（註冊閘）

外掛 `PluginManifest` 必須聲明全 5T（`traceable/trackable/tangible/transparent/trustworthy`）+ 非空 `hooks` 陣列，否則：
- **strict 模式**：`register()` 回傳 `false`（結界阻斷，不落地）
- **loose 模式**（預設）：仍註冊但標記，允許後續補強

### 生命週期

`registered → enabled → disabled → unloaded`；`enable()` 失敗標 `errored` 不向上拋（無作）。

### 鉤子（對齊 monitor-server broadcast 事件）

| Hook | 觸發時機 |
|---|---|
| `onBlueprintCreated` | `createBlueprint()` 後 |
| `onProductManifested` | `manifestToProduct()` 後 |
| `onBroadcastPushed` | `pushBroadcastPayload()` 後 |
| `onTranslation` | 翻譯事件 |
| `onCaption` | Akkadu 字幕事件 |
| `onSnapshot` | 輪詢快照 |
| `onHealthCheck` | 健康檢查 |

### 快速開始

```ts
import { OmniBlueprintHub } from './hub-engine.js';
import { EntropyReducerPlugin } from './plugins/entropy-reducer.js';

const hub = new OmniBlueprintHub();
hub.bindPluginContext(
  (src, event) => console.log('[broadcast]', src, event.type),
  (lvl, msg) => console.log('[log]', lvl, msg)
);
hub.plugins.register(new EntropyReducerPlugin());
await hub.plugins.enable('entropy-reducer');
// 之後每筆 pushBroadcastPayload 都會自動觸發熵減
```

### 測試

```bash
npm run test:plugins   # 7 斷言全綠 (5T Gate + 生命週期 + 3 示範外掛)
node .compiled/hub-demo.js   # 含外掛系統演示段
```

---

## 檔案

| 檔案 | 說明 |
|---|---|
| `monitor-server.mjs` | 中樞伺服器：SSE 廣播 / 輪詢 / 翻譯 / 認證 |
| `translate.mjs` | 可插拔翻譯引擎鏈 + LRU 快取 |
| `captions-scraper.mjs` | Akkadu 房間監控 + 本機 chromium 字幕抓取 |
| `env.mjs` / `env-boot.mjs` | 零依賴 `.env` 載入（`env-boot` 必須為第一個 import） |
| `ecosystem.config.cjs` | pm2 設定 |
| `deploy.sh` / `run.sh` | 一鍵部署 / 本機啟動 |
| `_smoke-test.mjs` | 端對端回歸測試 |
| `OmniBlueprintHub.ts` | 藍圖鑄造引擎（IComponentCore / 單一資料表 / Hash Lock） |

AGPL-3.0 · 萬能蜂群 OA-Team 30
