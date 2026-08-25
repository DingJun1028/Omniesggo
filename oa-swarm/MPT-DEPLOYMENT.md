# 萬能自動影音 OmniAutoVideo (基於 MoneyPrinterTurbo) — OA-Team 雙蜂戰隊 60 影音生產線

## 概述
**萬能自動影音 OmniAutoVideo** 是 OA-Team 雙蜂戰隊 60 的**影音生產線**，底層採用 MoneyPrinterTurbo (MPT) v1.3.5 一鍵短影音生成引擎，作為雙蜂戰隊的影音自動化補強。

完全符合硬規「只用免費算立」：
- **Ollama 本地 LLM** (qwen2.5:3b) 生成腳本與搜尋詞
- **Edge TTS** (zh-TW-YunJheNeural) 合成繁中語音，零 key 成本
- **Pixabay 免費素材** (用戶提供有效 key) 下載 CC0 影片
- 全程零付費 API、零雲端 DB

## 部署規格 (VPS 161.118.248.180)
- Docker 部署 (`ghcr.io/harry0703/moneyprinterturbo:latest`)
- WebUI: `https://mpt.esggo.co` (容器 7860→8501, HTTPS 灰雲直連)
- API: `https://mpt-api.esggo.co` (容器 7861→8080, HTTPS 灰雲直連)
- 配置: `llm_provider=ollama` + `ollama_base_url=http://host.docker.internal:11434/v1` + `ollama_model=qwen2.5:3b`
- TTS: Edge TTS (`zh-TW-YunJheNeural`, `edge_tts_timeout=120` 修正逾時)
- 素材源: **`video_source=pixabay`** + `pixabay_api_keys=[用戶提供有效 key]` (免費 CC0 影片)
- 本地素材備用: `material_directory=/MoneyPrinterTurbo/storage/materials`

## 免費鏈路驗證 (實測)
Ollama qwen2.5:3b (文案+英文搜尋詞) → Pixabay 下載素材 → Edge TTS zh-TW (語音) → ffmpeg 合成 → MP4
- 端到端任務 `d46fe554`：上傳 `esg_doc.txt` → 解析 → MPT 用 pixabay 找到 20 個素材 → `combined-1.mp4`(4.7MB) + `final-1.mp4`(4.9MB) 生成成功，state:1 progress:100

## 與 OA-Team 整合
- 萬能動畫蜂/音頻蜂可呼叫 OmniAutoVideo API (`/api/v1/videos`) 生成短影音
- 雙蜂戰隊儀表板 (oa.esggo.co) 可嵌入 MPT WebUI iframe
- n8n 排程自動生成每日短影音 (podcast/ESG 報告)

## 檔案上傳 → 自動解析 → 生成影片 (filedrop)
- 上傳頁面: `https://mpt.esggo.co/filedrop/` (接收 txt/md/pdf/docx)
- API: `https://mpt.esggo.co/filedrop/upload` (FastAPI, pm2 管理, 純本地無雲端 DB)
- 流程: 解析文字 → 呼叫 MPT `/api/v1/videos` (video_script + voice_name + video_source=pixabay) → 回 task_id
- 符合「停用 Google Cloud SQL」要求：filedrop 服務無任何雲端 DB 依賴

## 啟動命令
```bash
cd /opt/esggo/apps/mpt
docker compose -f docker-compose.esggo.yml up -d
```

## Patch 清單 (VPS 掛載, 已提交 git `oa-swarm/mpt-patches/`)
| 檔案 | 作用 |
|------|------|
| `schema.py` | `video_source: Optional[str] = "pixabay"` (預設改 pixabay，繞過無效 pexels key) |
| `Main.py` | `video_source = params.get("video_source") or "pixabay"` + WebUI 標題/品牌名改「萬能自動影音 OmniAutoVideo」 |
| `llm.py` | `generate_terms` 強制產英文搜尋詞 (pixabay 對中文詞不友善) |
| `material.py` | aspect 寬鬆匹配 (`_matches_video_aspect` 即可，不要求精確解析度) + 下載失敗 traceback 診斷 |
| `task.py` | local 素材 fall back (無上傳素材時讀 `storage/materials`) |
| `video.py` | 接受字串路徑作為素材輸入 |

## 故障排除
- **WebUI 無畫面 (空白)**：Streamlit 需 websocket，Cloudflare 橙雲免費版不代理長連接 → 改灰雲 (proxied:false) 直連 VPS
- nginx 需加 `proxy_http_version 1.1` + `Upgrade/Connection` 頭支援 websocket
- Streamlit 啟動參數 `--browser.serverAddress=mpt.esggo.co` (非 127.0.0.1)
- **`failed to download video materials from pexels`**：Pexels key 回 401 無效；已改用 pixabay 修復 (`schema.py` + `Main.py` 預設改 pixabay)
- **`failed to synthesize audio; TTS timeout`**：Edge TTS 預設 30s 對長腳本不足，設 `edge_tts_timeout=120`

## 已知限制
- MPT v1.3.5 上游 `video_source=local` 模式未實作（仍走線上源邏輯），我們的 `task.py` patch 提供 local fall back 但不穩定；生產環境用 pixabay 線上源
- Pixabay 免費 API 有速率限制（每小時 ~100-200 次），高併發任務需排程限速
