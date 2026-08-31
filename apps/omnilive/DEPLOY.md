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
