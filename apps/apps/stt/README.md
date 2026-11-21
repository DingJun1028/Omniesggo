# 萬能即時雙語字幕 — STT 微服務

本地 `faster-whisper` 語音辨識微服務。終始矩陣的 STT 層，對應 `apps/universal-translator` 的 `ISpeechToSubtitleRequest`。

**零 key · 免費算立 · CPU-only**（符合專案「只用免費算立」硬性約束，不依賴任何雲端 STT API）

## 架構角色

```
前端錄音 ──POST /speech-to-subtitle──▶ universal-translator :8788
                                          │ (stt_client.mjs)
                                          ▼ fetch 127.0.0.1:8791/transcribe
                                    stt-whisper :8791  (本服務)
                                          │ faster-whisper (base, int8, CPU)
                                          ▼
                                    文字 + 語言檢測
                                          │
                                          ▼ (回到 UT) 雙向翻譯 → 雙語字幕
```

| 層級 | 服務 | Port | 依賴 |
|---|---|---|---|
| L2 推理 | **stt-whisper** | 8791 | 無（本地模型） |
| L3 應用 | universal-translator | 8788 | 8791 |
| L3 應用 | omniagent-gateway | 8642 | 獨立（需 `.env`） |
| L4 主站 | esggo-core | 3000 | 獨立 |

## 端點

- `POST /transcribe?lang=zh-TW|en` — body = audio bytes (webm/ogg/wav)，回 `{text, language, engine}`
- `GET /health` — `{status:'ok', model, device}`

## VPS 部署（Oracle A1.Flex 4 OCPU / 24GB，always-free）

服務由 `ecosystem.config.cjs` 的 `stt-whisper` 條目管理（pm2）。部署腳本：

```bash
# 1. 建 venv + 裝依賴（首次，需聯網下載 base 模型 ~140MB 到 ~/.cache/huggingface）
cd /var/www/esggo/apps/stt
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt

# 2. pm2 啟動（interpreter 指向 venv python，已在 ecosystem.config.cjs 設定）
cd /var/www/esggo
pm2 start ecosystem.config.cjs --only stt-whisper --update-env
pm2 save
```

> ⚠️ `ecosystem.config.cjs` 的 `stt-whisper.interpreter` 必須是
> `/var/www/esggo/apps/stt/.venv/bin/python3`，否則 pm2 用系統 python3 會報
> `ModuleNotFoundError: No module named 'fastapi'`。

## 故障隔離

- STT 掛掉時，UT 前端顯示明確錯誤「STT_UNAVAILABLE: 本地 faster-whisper (8791) 未啟動」
  （見 `universal-translator/stt_client.mjs` 的 502/503/ECONNREFUSED 區分），
  不再籠統顯示 HTTP 502。
- STT 與 UT 獨立重啟：改 STT 只需 `pm2 restart stt-whisper`，不影響其他服務。

## 效能說明

CPU-only `base` 模型：10 秒音訊約 20–40 秒推理（ARM A1.Flex 4 核）。
如需更快可改 `WHISPER_MODEL=small`（更準但更慢）或 `WHISPER_COMPUTE=float32`（更準）。

## 環境變數

| 變數 | 預設 | 說明 |
|---|---|---|
| `STT_PORT` | 8791 | 監聽端口（需與 UT 的 `STT_PORT` 一致） |
| `WHISPER_MODEL` | base | tiny/base/small/medium |
| `WHISPER_DEVICE` | cpu | 本機無 GPU，固定 cpu |
| `WHISPER_COMPUTE` | int8 | 量化方式（int8 最快） |
