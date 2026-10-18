# OmniLive 萬能即時轉譯雙語字幕播放器

Zoom 線上會議場景下的即時雙語字幕系統：音訊擷取 → 語音辨識 → 雙語翻譯 → 字幕播放器。
純免費零 key 即可運作；可選 Gemini 雲端增強 (失敗自動回落免費鏈)。

## 1. 最小可用設定流程 (首次設定)

```bash
cd apps/omnilive
cp .env.example .env        # 必要：至少確認 OMNILIVE_AUDIO_SOURCE=system-display
npm start                  # 一鍵自帶啟動本地 STT (faster-whisper) + OmniLive (預設 :8795)
# 瀏覽器開 http://localhost:8795/
```

> 若不想自帶啟動 STT，設 `OMNILIVE_AUTOSTART_STT=false`，改手動 `cd ../stt && .venv/Scripts/python.exe server.py`。
> 首次啟動會下載 whisper `tiny` 模型 (~75MB, CPU 推理, 零 key)。

開啟播放器後：

1. 點 **「建立分享連結」** → 取得「主持人連結」與「觀眾連結」+ QR Code。把觀眾連結或 QR 發給與會者，他們開連結即可看見**相同**的即時雙語字幕 (軟上限 100 人)。
2. 音訊來源選 **「系統音訊 / Zoom 共享聲音」** → 點 **開始收音**。
3. 瀏覽器跳出「分享畫面」→ 選 Zoom 視窗/整個畫面，**務必勾選「分享聲音」**。
4. 會議語音即時經本地 STT 辨識 → 雙語翻譯 → SSE 推播回全房間播放器顯示雙語字幕。
5. 若無法擷音：切到 **「手動字幕輸入」**，直接貼會議發言文字，仍走完整雙語流程。

> 無法取得音訊權限 / 瀏覽器不支援系統音擷取時，可改用 `device` 模式 + 虛擬音訊線 (VB-Cable / BlackHole)，或 `caption` 模式手動貼字。

## 2. 環境變數 (.env)

| 變數 | 預設 | 說明 |
|---|---|---|
| `PORT` | 8795 | 服務端口 |
| `OMNILIVE_AUDIO_SOURCE` | system-display | 音訊來源：`mic`/`system-display`/`device`/`caption` |
| `AUDIO_DEVICE_ID` | (空) | device 模式指定輸入裝置 ID |
| `STT_PORT` | 8791 | 本地 faster-whisper 微服務端口 |
| `STT_TIMEOUT_MS` | 30000 | 辨識逾時 |
| `STT_LANG` | auto | 辨識語提示 `zh-TW`/`en`/`auto` |
| `OMNILIVE_FROM` / `OMNILIVE_TO` | zh-TW / en | 雙語字幕兩軌 |
| `TRANSLATE_TIMEOUT_MS` / `TRANSLATE_RETRIES` | 8000 / 2 | 翻譯層容錯 |
| `SUBTITLE_MAX_LINES` / `SUBTITLE_TTL_MS` | 40 / 12000 | 字幕視窗與過期 |
| `GEMINI_API_KEY` | (空) | 可選雲端增強；不設則關閉 |
| `OMNILIVE_AUTOSTART_STT` | true | `npm start` 一鍵自帶啟動本地 STT |
| `WHISPER_MODEL` | tiny | whisper 模型大小 (tiny 較快 / base 較準) |
| `OMNILIVE_ROOM_TTL_MS` | 7200000 (2h) | 房間過期時間；過期且無觀眾會被背景清理回收 |
| `OMNILIVE_ROOM_CLEANUP_MS` | 300000 (5min) | 過期房間清理週期 |

## 3. 進階功能

- **房間密碼保護**：建立房間時填寫密碼 → 觀眾連結攜帶 SHA-256 hash (非明文)，掃描即入；無密碼/錯誤連線回 401。主持人 UI 另顯示明文供口頭告知。
- **VAD 語者分段**：播放器收音預設開啟 (`/api/transcribe?vad=1`)。對 WAV PCM 做能量偵測，靜音 >600ms 視為換語者，輪流標 🗣️A / 🗣️B，每段各自成雙語字幕。webm/ogg/mp3 等格式經主機 ffmpeg 轉 WAV 後同樣可做 VAD (需安裝 ffmpeg)。
- **房間過期**：每個房間預設 2 小時過期；背景清理程式每 5 分鐘回收「過期且無觀眾」的房間 (直播中房間不受影響)。`/api/room/:id` 可查 `expiresAt` / `expired`。
- **語言互換**：播放器 **⇄ 互換 (S)** 按鈕或快捷鍵 **S** 一鍵互換「從/到」語言 (語音:繁中⇄字幕:英文)。

## 4. 辨識服務 (本地 STT)

辨識需另行啟動 `apps/stt` (faster-whisper)：

```bash
cd apps/stt
pip install fastapi uvicorn faster-whisper
WHISPER_MODEL=tiny python server.py   # tiny 較快；base 較準
```

未啟動時：`/api/transcribe` 回 `STT_UNAVAILABLE` (HTTP 502)，但 **caption 模式仍可用**。

## 4. 驗證

```bash
npm run verify    # 可重現驗收：啟動→/health→/config→手動字幕→SSE→UI (離線 mock 縫)
npm test          # node --test 端到端 + 單元測試
```

## 5. 目錄結構

```
apps/omnilive/
├── server.mjs              # 服務層 (HTTP + SSE + 靜態播放器)
├── lib/
│   ├── config.mjs         # 設定層
│   ├── audio-source.mjs   # 輸入層 (音訊來源模式)
│   ├── stt.mjs            # 辨識層 (STT 客戶端)
│   ├── translate.mjs      # 翻譯層 (雙語引擎鏈)
│   ├── subtitle.mjs       # 字幕層 (結構 + 佇列)
│   └── errors.mjs         # 錯誤層
├── public/index.html      # 雙語字幕播放器 UI
├── test/*.test.mjs        # 測試
├── verify.mjs             # 可重現驗收
├── spec.md                # 程式規格
└── .env.example
```

詳細規格見 [spec.md](./spec.md)。
