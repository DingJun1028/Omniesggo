# MoneyPrinterTurbo × OA-Team 雙蜂戰隊 60 — 影音生產線部署

## 概述
MoneyPrinterTurbo (MPT) v1.3.5 是 AI 短影音一鍵生成工具，作為 OA-Team 雙蜂戰隊的**影音生產線補強**。
完全符合硬規「只用免費算立」：Ollama 本地 LLM + Edge TTS + 本地素材，零 API key 成本。

## 部署規格 (VPS 161.118.248.180)
- Docker 部署 (ghcr.io/harry0703/moneyprinterturbo:latest)
- WebUI: `https://mpt.esggo.co` (容器 7860→8501, HTTPS+橙雲)
- API: `https://mpt-api.esggo.co` (容器 7861→8080, HTTPS+橙雲)
- 配置: `llm_provider=ollama` + `ollama_base_url=http://host.docker.internal:11434/v1` + `ollama_model_name=qwen2.5:3b`
- TTS: Edge TTS (zh-TW-YunJheNeural, `edge_tts_timeout=120` 修正逾時)
- 素材: `video_source=pexels` + `pexels_api_keys=[用戶提供]` (免費 Pixabay/Pexels key)
- 本地素材備用: `material_directory=/MoneyPrinterTurbo/storage/materials` (CC0 影片)

## 免費鏈路驗證 (實測)
Ollama qwen2.5:3b (文案) → Edge TTS zh-TW (語音) → 本地素材 (clip1-3.mp4) → ffmpeg 合成 → MP4 (10.6MB)
任務 ID: 7825c426-0521-4415-8354-8036e982435b → state:1 (completed)

## 與 OA-Team 整合
- 萬能動畫蜂/音頻蜂可呼叫 MPT API (`/api/v1/videos`) 生成短影音
- 雙蜂戰隊儀表板 (oa.esggo.co) 可嵌入 MPT WebUI iframe
- n8n 排程自動生成每日短影音 (podcast/ESG 報告)

## 啟動命令
```bash
cd /opt/esggo/apps/mpt
docker compose -f docker-compose.esggo.yml up -d
```

## 注意
- 容器需 `extra_hosts: host.docker.internal:host-gateway` 才能連宿主 Ollama
- MPT v1.3.5 的 `video_source=pixabay` 仍呼叫 pexels 下載邏輯 (bug)，改用 `video_source=pexels` + pexels key 正常
- Edge TTS 預設 30s timeout 對長腳本不足，須設 `edge_tts_timeout=120`
- HTTPS 已通 (Let's Encrypt + 橙雲)，無不安全警告
- 真實素材: 用戶提供 Pexels/Pixabay 免費 key，符合「只用免費算立」硬規
