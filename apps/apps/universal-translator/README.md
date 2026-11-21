# 萬能即時翻譯 (Universal Translator)

繁中 ↔ 英文 **雙向及時字幕** · 免費 · 零 key · 一體化收錄顯 · 可疊 Zoom/Meet

## 核心能力
- 即時語音轉錄（本地 faster-whisper，CPU 免費）
- 雙向翻譯：繁中 ↔ 英文，一鍵互換方向
- SSE 雙語字幕推播：studio 收音 → float/stream/overlay 觀眾端浮層
- 5T 溯源：每句字幕帶 `trace` 標籤

## 最新技術整合：Gemini 3.5 Live Translate（可選增強）
- 詳見 `GEMINI_LIVE_3_5_INTEGRATION.md`
- 預設關閉（純免費零 key）。設 `GEMINI_API_KEY` 後自動啟用最前端雲端增強層，失敗自動回落免費鏈。

## 快速開始
```bash
cd apps/universal-translator
pip install -r requirements.txt   # faster-whisper STT 服務
python stt_service.py &           # 背景 STT
node server.mjs                   # :8788
```
開瀏覽器：`/` 一體化收錄顯、`/studio` 會議收音端、`/float` 懸浮字幕。

## 環境變數（.env，gitignored）
見 `.env.example`。關鍵項：`PORT`、`LIBRETRANSLATE_URL`、`MYMEMORY_EMAIL`、
`GEMINI_API_KEY`（可選雲端增強）、`GEMINI_MODEL`。

## 5T 合規
- Traceable：字幕帶 source_origin 標籤
- Trackable：SSE 推送與 metrics 端點
- Tangible：雙語字幕即時可見
- Transparent：引擎鏈與 fallback 公開
- Trustworthy：fallback 不中斷，寫入即定版
