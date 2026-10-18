# OmniLive 程式規格 (spec) — 萬能即時轉譯雙語字幕播放器

> Zoom 線上會議場景 · 最小可用設定流程 (MVP v1.0.0)

## 1. 系統概觀

OmniLive 接收 Zoom 會議音訊 → 即時語音辨識 → 雙語翻譯 → 雙語字幕播放器即時顯示。
採純免費零 key 運作；Gemini 為可選雲端增強 (設 `GEMINI_API_KEY` 啟用，失敗自動回落免費鏈)。

資料流：

```
Zoom 會議音訊
   │ (瀏覽器 getDisplayMedia 勾選「分享聲音」/ 麥克風 / 指定裝置)
   ▼
[輸入層]  lib/audio-source.mjs  — 定義 4 種音訊來源模式
   ▼ (raw audio bytes, 1.5s 切片)
[辨識層]  lib/stt.mjs  → 本地 faster-whisper (apps/stt :8791)
   ▼ {text, language, engine}
[翻譯層]  lib/translate.mjs  — 雙語翻譯 (google-gtx → mymemory → 原文兜底)
   ▼ {source, target, from, to, engine}
[字幕層]  lib/subtitle.mjs  — 雙語字幕結構 + 即時佇列 (TTL/視窗裁剪)
   ▼ BilingualSubtitle
[播放器層] public/index.html  — SSE 接收 + 雙語顯示 + 樣式控制
   ▼
使用者看到雙語字幕
```

## 2. 模組責任

| 模組 | 檔案 | 責任 |
|---|---|---|
| 設定層 | `lib/config.mjs` | 集中讀取/驗證環境變數；啟動時快速失敗 (fail-fast) |
| 輸入層 | `lib/audio-source.mjs` | 定義 4 種音訊來源模式、合法性驗證、產生描述 |
| 辨識層 | `lib/stt.mjs` | 呼叫本地 faster-whisper；空音/靜音優雅處理；不可用時拋 `STT_UNAVAILABLE` |
| 翻譯層 | `lib/translate.mjs` | 雙語翻譯引擎鏈 + 快取 + 離線 mock 縫；誠實回落原文 |
| 字幕層 | `lib/subtitle.mjs` | `BilingualSubtitle` 結構 (含 5T trace) + `SubtitleStore` (TTL/視窗裁剪) |
| 錯誤層 | `lib/errors.mjs` | `OmniLiveError` 含 code/retryable/context；`errorToJson` 統一錯誤形狀 |
| 服務層 | `server.mjs` | HTTP 路由 + SSE 廣播 + 靜態播放器；零依賴 .env 讀取 |
| 播放器 | `public/index.html` | 音訊擷取 UI + SSE 字幕 + 字級/語序/背景/開關設定 + 分享面板/QR |

## 2.1 即時分享機制 (本版新增)

為讓其他人「直接進入連結觀看同樣的字幕」：

1. **建立房間**：主持人點擊「建立分享連結」→ `POST /api/room` 產生一組 6 位房間碼（如 `6SO5K7`）。
2. **雙連結**：
   - 主持人連結：`/?room=XXXXXX&role=caster`（含收音 UI）
   - 觀眾連結：`/?room=XXXXXX`（僅看字幕，隱藏收音/建立面板）
3. **QR Code**：前端用倉庫內 `qrcode.min.js` 渲染觀眾連結 QR，與會者掃描即加入。
4. **同步廣播**：所有開同一房間連結的瀏覽器經 `GET /stream?room=XXXXXX` 訂閱 SSE；主持人送出的每一句字幕以相同 `id` 推送給全房間，觀眾看到完全一致的字幕與序號。
5. **人數統計**：`GET /api/room/:id` 回傳目前觀眾數（SSE 連線計數）；分享面板可手動/自動（5s 輪詢）刷新。軟上限 100 人（SSE 長連線，受伺服器記憶體/檔案描述符約束，未硬編碼封頂）。

> 同一房間內，主持人可切換 `system-display`（Zoom 分享聲音）或 `caption`（手動貼字）來源；觀眾端不需任何設定，開連結即看。

## 3. 輸入來源 (輸入層)

`OMNILIVE_AUDIO_SOURCE` 支援 4 種模式：

| 值 | 場景 | 瀏覽器 API | 備註 |
|---|---|---|---|
| `system-display` | **Zoom 會議 (推薦)** | `getDisplayMedia({video,audio})` 勾選「分享聲音」 | 可直接擷取 Zoom 系統音訊 |
| `mic` | 單人對麥克風講 | `getUserMedia({audio})` | 適合講者 |
| `device` | 虛擬音訊線 (VB-Cable/BlackHole) | `getUserMedia({audio:{deviceId}})` | 需 `AUDIO_DEVICE_ID` |
| `caption` | 無音訊權限兜底 | 文字輸入 | 仍走完整雙語流程 |

## 4. 轉譯流程 (辨識 + 翻譯)

1. 播放器每 ~1.5s 切片 (節流) 上送 `POST /api/transcribe` (raw audio)。
2. 服務呼叫本地更快 whisper (`http://127.0.0.1:${STT_PORT}/transcribe`)。
3. 辨識結果 `{text,language}` → 翻譯層雙語化。
4. 語言配對：若辨識語 == 預設目標語，自動互換 (e.g. 辨到 en 但 `OMNILIVE_TO=en` → 翻去 `zh-TW`)。
5. 翻譯引擎鏈：`Gemini (可選)` → `google-gtx (零key)` → `mymemory (免費)` → `原文兜底`。
6. `POST /api/speak` 為手動字幕入口 (caption 模式)。

## 5. 字幕輸出格式 (字幕層)

```ts
interface BilingualSubtitle {
  id: number;            // 單調遞增序號 (播放器去重/排序)
  source: string;        // 原文 (辨識結果)
  target: string;        // 目標語翻譯
  from: string;          // 原文語言 (zh-TW | en | ...)
  to: string;            // 目標語言
  engine: string;        // 翻譯引擎 (5T 溯源)
  ts: number;            // 產生時間戳 (ms)
  trace: string;         // 5T 不可篡改 trace = sha256(source)[:16]
  final: boolean;        // 是否最終稿
}
```

- 即時更新：每次新句 `broadcast()` 經 SSE `event: subtitle` 推播。
- 逐句刷新：`SubtitleStore` 保留最近 `SUBTITLE_MAX_LINES` (預設 40) 句，TTL `SUBTITLE_TTL_MS` (預設 12s) 內標為活躍。
- 基本同步：播放器以 `id` 排序、`ts` 判斷新舊。

## 6. 播放器行為 (播放器層)

- SSE 訂閱 `/stream?room=...`，自動重連 (3s)。
- 顯示設定：
  - 字級：`fontSize` range 14–48px
  - 語言順序：`原文在上 / 翻譯在上` 切換
  - 背景可讀性：字幕底層背景開關
  - 顯示開關：整體字幕顯示/隱藏
  - 語言配對：`from / to` 下拉，存 localStorage
- caption 模式：貼文字 → `/api/speak` → 走完整雙語流程。
- 錯誤不因短暫中斷整體崩潰：SSE 斷線重連、STT 不可用時提示並回落。

## 7. 錯誤處理

| 錯誤碼 | 觸發 | 處理 |
|---|---|---|
| `AUDIO_SOURCE_MISSING` | 音訊來源非法 / device 缺 ID | 啟動時 fail-fast 報錯 |
| `STT_UNAVAILABLE` | 本地 whisper 未啟動/不可達 | HTTP 502 + `retryable:true`，播放器提示 |
| `STT_EMPTY` | 靜音/無可辨識 | 回空結果，不報錯 |
| `TRANSLATE_TIMEOUT` | 翻譯逾時 | 換引擎；全失敗 → 原文兜底 |
| `CONFIG_MISSING` | 必要設定缺漏 | 啟動 fail-fast |
| `SUBTITLE_RENDER` | 字幕渲染中斷 | SSE 重連 + 局部容錯 |

## 8. API 一覽

| 方法 | 路徑 | 說明 |
|---|---|---|
| GET | `/health` | 健康檢查 `{status,version,audioSource,...}` |
| GET | `/config` | 公開設定 + 音訊來源描述 |
| GET | `/stream?room=` | SSE 雙語字幕推播 |
| POST | `/api/transcribe` | 音訊 bytes → 雙語字幕 (回傳 `X-OA-Trace`) |
| POST | `/api/speak` | `{text,room,from,to}` → 雙語字幕 |
| POST | `/api/room` | 建立分享房間 → `{room, casterLink, viewerLink, viewers}` |
| GET | `/api/room/:id` | 房間觀眾數與建立時間 |
| GET | `/` | 雙語字幕播放器 UI (含分享面板/QR) |

## 9. 已知限制 / 未完成項

1. **本地 STT 相依**：辨識需另行啟動 `apps/stt` (faster-whisper, Python)。未啟動時僅 caption 模式可用。
2. **瀏覽器擷音跨平台差異**：`getDisplayMedia` 分享聲音在 macOS/Windows 行為不同；部分瀏覽器不支援系統音擷取，需改用 `device` (虛擬音訊線)。
3. **即時性**：1.5s 切片 + whisper CPU 推理 (~30s/段 base 模型) 非真即時，長句會延遲；可降 `WHISPER_MODEL=tiny` 加速。
4. **翻譯層依賴外部服務**：google-gtx / mymemory 受網路與額度影響；皆失敗時回落原文 (仍顯示原文)。
5. **未含** VAD 語者分段、多房間隔離精細權限、字幕匯出存檔、多語>2 軌擴展 (目前鎖雙語)。
6. **無自動化音訊擷取服務端**：目前音訊擷取在瀏覽器端 (getUserMedia/getDisplayMedia)，服務端只收 bytes；未來可加服務端錄音卡擷取 (Windows WASAPI / macOS loopback)。

## 10. 驗收流程 (可重現)

```bash
cd apps/omnilive
npm run verify        # 啟動 → /health → /config → 手動字幕 → SSE → 播放器 UI
npm test             # node --test 端到端 + 單元測試
```

通過 = Zoom 場景設定成功、雙語字幕資料流跑通 (離線 mock 縫驗證整條管線，不依賴外網/whisper)。

## 13. 本版新增功能 (三項增強)

1. **`npm start` 一鍵自帶啟動 STT**：`start.mjs` 若 `OMNILIVE_AUTOSTART_STT!=false` 且 `apps/stt` 未跑，先以 venv python 帶起本地 faster-whisper (`WHISPER_MODEL` 預設 `tiny`)，健康後再啟動 OmniLive；STT 起不來也不阻塞 (caption 模式仍可用)。
2. **房間密碼保護**：建立房間時可設密碼；後端只存 SHA-256 hash (不存明文)。受保護房間的 `/stream` 需 `?pwd=`（明文或 hash 皆可），無/錯 → 401。觀眾連結攜帶 hash (非明文)，掃描即入；主持人 UI 另顯示明文供口頭告知。
3. **VAD 語者分段 + tiny 預設加速**：`/api/transcribe?vad=1` 對 WAV PCM 做能量 VAD，靜音間隔 >600ms 視為換語者輪流標 A/B，每段各自成雙語字幕 (帶 `speaker` 標籤)；whisper 預設模型降為 `tiny` (CPU 更快)。非 WAV 格式回退單段 A。

### 語言互換快捷鍵
- 播放器提供 **⇄ 互換 (S)** 按鈕，亦可按鍵盤 **S** 快速互換「從/到」語言。

## 14. 本輪新增 (房間過期 + webm VAD)

1. **房間過期清理**：每個房間帶 `expiresAt` (預設 `OMNILIVE_ROOM_TTL_MS=2h`)，由背景 `cleanupRooms` (預設每 `OMNILIVE_ROOM_CLEANUP_MS=5min`) 回收**過期且無活躍觀眾**的房間。`/api/room/:id` 回傳 `expiresAt` 與 `expired` 欄位。
2. **VAD 擴展到任意格式**：`vadSegmentsAny()` 對 WAV 本地解碼；對 webm/ogg/mp3/opus 等經主機 **ffmpeg** 轉 16kHz mono WAV 後做能量 VAD (靜音 >600ms 輪流標 A/B)。找不到 ffmpeg 或解碼失敗 → 回退單段 A (whisper 整段辨識)。前端收音現送 **WAV 容器** (修復 raw PCM 被 whisper/PyAV 拒讀的隱患)。

### 已知限制
- VAD 為「靜音間隔啟發式」輪流，非聲紋辨識 (同人連續發言可能誤標 B)。
- 房間 TTL 清理只回收「無活躍觀眾」者；直播中房間不會被清掉。
- webm VAD 需主機裝 ffmpeg (本機 Windows 已裝於 WinGet 路徑)；未裝則回退單段。

1. 啟動 `apps/stt` (faster-whisper, tiny) + OmniLive。
2. EN 語音 → `/api/transcribe` → 辨識 "Hello, this is a live meeting test..." → 翻 **繁中** "您好，這是全即時雙語字幕的即時會議測試。"
3. ZH 語音 → `/api/transcribe` → 辨識 "歡迎參加線上會議,這是即時雙語字幕測試" → 翻 **英文** "Welcome to the online meeting, this is an instant bilingual subtitle test"
4. 每句帶 5T `trace`，並經 `/stream?room=voice` SSE 廣播給同房間觀眾。

> 前置：`apps/stt/.venv` 已 `pip install -r requirements.txt edge-tts`。

## 12. 語言互換快捷鍵

- 播放器提供 **⇄ 互換 (S)** 按鈕，亦可按鍵盤 **S** 快速互換「從/到」語言 (輸入框/下拉聚焦時不觸發)。
- 互換後寫入 `localStorage`，下次開啟自動套用。
- 對應需求：語音:繁中⇒字幕:英文 / 語音:英文⇒字幕:繁中，中間一鍵互換。
