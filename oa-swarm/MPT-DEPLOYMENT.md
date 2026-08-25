# MoneyPrinterTurbo × OA-Team 雙蜂戰隊 60 — 影音生產線部署

## 概述
MoneyPrinterTurbo (MPT) v1.3.5 是 AI 短影音一鍵生成工具，作為 OA-Team 雙蜂戰隊的**影音生產線補強**。
完全符合硬規「只用免費算立」：Ollama 本地 LLM + Edge TTS + 本地素材，零 API key 成本。

## 部署規格 (VPS 161.118.248.180)
- Docker 部署 (ghcr.io/harry0703/moneyprinterturbo:latest)
- WebUI: `http://mpt.esggo.co` (容器 7860→8501)
- API: `http://mpt-api.esggo.co` (容器 7861→8080)
- 配置: `llm_provider=ollama` + `ollama_base_url=http://host.docker.internal:11434/v1` + `ollama_model_name=qwen2.5:3b`
- TTS: Edge TTS (zh-TW-YunJheNeural 預設)
- 素材: `video_source=local` + `material_directory=/MoneyPrinterTurbo/storage/materials` (放 CC0 測試片)
- 繞過檢查: `pexels_api_keys=["local-mode-dummy"]` (local 模式不真呼叫)

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
- local 模式仍需 `pexels_api_keys` 陣列非空 (MPT bug)，放 dummy 值跳過
- 若要真實素材，註冊免費 Pixabay key 或放 CC0 影片進 storage/materials
- HTTPS 待 certbot --dns-cloudflare-propagation-seconds 30 重試 (目前灰雲 HTTP 對外)
