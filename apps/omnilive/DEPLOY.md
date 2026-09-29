# OmniLive 部署與運維筆記

> 這份筆記記錄 2026-08-17 實戰踩過的坑與修復，部署時照著做可避免重蹈覆轍。

## 架構

- **OmniLive**（port 8795）：即時雙語字幕播放器。前端 `public/index.html` 擷取螢幕/麥克風音訊 → POST `/api/transcribe` → 後端 `server.mjs` 轉發到 STT → 雙語翻譯 → SSE 廣播給房間。
- **STT**（port 8791，獨立 pm2 `stt-whisper`）：faster-whisper，`/var/www/esggo/apps/stt/server.py`。
- **Cloudflare Tunnel**：`omnilive.esggo.co` → `127.0.0.1:8795`。

## VPS 部署流程（改完前端/後端後）

```bash
# OmniLive (在 /opt/esggo/apps/omnilive, git mirror)
cd /opt/esggo/apps/omnilive
git fetch origin && git merge --ff-only origin/main
pm2 restart omnilive
sleep 3
curl -sf http://127.0.0.1:8795/health   # 應回 {"status":"ok",...}
pm2 save

# STT (在 /var/www/esggo/apps/stt, 非 git, 直接編輯 server.py)
# 編輯完重啟:
pm2 restart stt-whisper --update-env
sleep 8
curl -sf http://127.0.0.1:8791/health   # 應回 {"status":"ok","model":"small",...}
pm2 save
```

> ⚠️ `apps/stt/server.py` 必須 commit 進 git（已在 `apps/stt/` 下追蹤）。VPS 上直接改過的內容若沒回寫本地 git，重裝/還原會丟失。
> ⚠️ **不要用 `git reset --hard`**（Hermes 安全層會擋）。用 `git merge --ff-only origin/main` 代替。

## 已知地雷（按嚴重度）

### 1. caster 建立房間後 SSE 沒重連 → 主持人無字幕、觀眾有
- **現象**：觀眾連 `?room=XXX` 開頁面有字幕；主持人按「建立分享連結」後本機無字幕。
- **根因**：`connectSSE()` 在頁面載入時用**空 room** 連（那時還沒建房間）；建立房間後 URL 變更，但 `if(es)return` 擋住重連 → SSE 掛空房間。
- **修法**：`connectSSE()` 開頭先 `es.close()`；`createRoom` 換 URL 後呼叫 `connectSSE()`。

### 2. AudioContext 預設 48kHz 被當 16kHz 送 → 慢速怪聲 + whisper 幻覺
- **現象**：下載擷取音訊聽起來像慢動作、低沉；whisper 幻覺 "Thanks for watching"。
- **根因**：`new AudioContext()` 預設 48k，前端卻包成 16k WAV 送 STT → 速率錯 3 倍。
- **修法**：`new AudioContext({sampleRate:16000})`。

### 3. lang=auto 強制 → whisper 偶發 500
- **現象**：STT 日誌出現 `POST /transcribe?lang=auto` 500。
- **根因**：`server.mjs` 呼叫 STT 時硬寫 `sttLang: CFG.sttLang`（=auto），忽略前端 `lang=en/zh-TW`。auto 偵測偶爾崩。
- **修法**：`const reqLang = q.get('lang') || CFG.sttLang;` 透傳前端語言。

### 4. 前端併發堆積 → ClientDisconnect 500 連環
- **現象**：每 4s 送一次，STT 單 worker 忙不過來，客戶端 timeout 斷開。
- **修法**：`sendChunk`/`flushWindow` 加 `sttInflight` 旗標（上一個沒回就不送），並加 45s 超時保護防永久卡死。

### 5. 固定 4s 硬切 → 句中斷句破碎
- **現象**：長句被切成半句，whisper 硬猜 → 碎字/重複。
- **修法**：`flushWindow` 每 6s 送「最近 6s 音」，與上段重疊 2s（滑動緩衝），適合 Zoom/YouTube 連續音訊。

### 6. start.mjs 當 pm2 入口 → 502 間歇
- **現象**：`start.mjs` spawn `server.mjs` 子程序，父進程 online 但子程序死 → 8795 空窗 → cloudflared 502。
- **修法**：pm2 直接跑 `node server.mjs`，不經 `start.mjs`。

### 7. STT 模型選擇
- `small`：CPU 推理 4-8s/段，即時字幕推薦。
- `medium`：更準但 20-30s/段，延遲過大不適即時場景（除非要最高準確度不在意延遲）。
- 切換：`pm2 set stt-whisper:WHISPER_MODEL small|medium` + `pm2 restart stt-whisper --update-env`。
- 首次載模型中 (~1.5GB) 需數分鐘，期間 health 暫時拿不到屬正常。

### 8. POST /api/* 上線前無認證 → 任何人可打爆主機
- **現象**：`/api/room`、`/api/transcribe`、`/api/speak`、`/api/course` 原本完全開放。
  這四個端點會實際吃 CPU —— STT 要跑 whisper，`/api/course` 要跑本地 LLM
  （實測單次 115 秒）。任何拿到網址的人都能無限觸發，把主機燒乾。
- **修法**：設定 `OMNILIVE_HOST_KEY`，所有 `POST /api/*` 需帶金鑰否則 401。
  兩種傳遞方式皆可：`X-OmniLive-Key: <key>` 或 `Authorization: Bearer <key>`。
- **刻意不設金鑰時維持開放**（本機開發向後相容），故**上線務必確認已設定**：

  ```bash
  pm2 set omnilive-translator:OMNILIVE_HOST_KEY "$(openssl rand -hex 24)"
  pm2 restart omnilive-translator --update-env
  ```

- **刻意保持公開**：`GET /health`（監控）、`GET /config`（播放器初始化）、
  `GET /stream`（SSE，另由房間密碼保護）、靜態檔案 —— 加驗證會擋掉監控與觀眾端。
- 前端/腳本呼叫需帶金鑰，否則會收到 `401 {"code":"HOST_KEY_REQUIRED"}`。

### 9. 測試用固定 sleep → 整組 ECONNREFUSED
- **現象**：`npm test` 9 個測試全敗，錯誤為 `ECONNREFUSED :8796`。
  但單獨手動啟動 `node server.mjs` 完全正常 —— 服務確實有起來。
- **根因**：測試用固定 `await wait(800)` 睡死等啟動。Node 冷啟動耗時隨機型、
  磁碟與並行負載浮動，800ms 不足以保證已 listen。只有會「輪詢」的測試能過。
- **修法**：改用 `waitReady()` 輪詢 `/health`，等待條件是「服務真的可回應」。
  已加入 `test/server.test.mjs`。
- **另一個坑**：`node --test` 預設**並行**跑各測試檔，每檔都 spawn 服務 →
  機器飽和、測試變慢 3 倍且開始失敗。已在 `package.json` 加上
  `--test-concurrency=1`（實測 131s/3 敗 → 47s/全過）。
- **不要**把 `waitReady()` 改回固定 sleep；也不要拿掉 `--test-concurrency=1`。


## 除錯工具

- 前端「⬇ 下載擷取音訊」鈕：錄音時按一下下載 WAV，親耳確認擷取層是否有聲音/慢速/靜音。
- 伺服器端 SSE 驗證：
  ```bash
  # 終端機監聽某房間 SSE, 另開送音, 看是否廣播 subtitle 事件
  (timeout 30 curl -s -N 'http://127.0.0.1:8795/stream?room=TEST' > /tmp/sse.txt &)
  curl -s -X POST 'http://127.0.0.1:8795/api/transcribe?room=TEST&vad=1&lang=en' \
    --data-binary @/path/to/test.wav -H 'content-type: audio/wav'
  grep 'subtitle' /tmp/sse.txt
  ```

## 驗收門檻
- 主持人與觀眾**兩端**都出現雙語字幕。
- 字幕準確對應影片語言（無 "Thanks for watching" 類幻覺）。
- 字幕每 ~6s 一段、從下往上 roll-up。
- `https://omnilive.esggo.co/health` 回 200。
