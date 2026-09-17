---
chapter: 24
title: "最佳實踐矩陣 (Best-Practice Items Matrix)"
source: "best-practice-items.md"
related_chapters: ["Ch.23", "Ch.08", "Ch.09"]
tags: [MECE, 矩陣, 啟動, 驗證]
---

# 24 · 最佳實踐矩陣 (Best-Practice Items Matrix)

> MECE 矩陣覆蓋 A-G 七大域 + H. 語音代理部署。啟動 checklist 九項必過，否則不帶病上線。

## A-G 七大域矩陣

| 域 | 項目 | 狀態 | 驗證 |
|----|------|------|------|
| A. 語言層 | TypeScript strict 編譯 | 🟢 | `tsc --noEmit` |
| A. 語言層 | Python type hints | 🟢 | `mypy src/` |
| B. 測試層 | Vitest 單元測試 | 🟢 | `pnpm vitest run` |
| B. 測試層 | E2E 渲染測試 (ffmpeg) | 🟢 | 28 cases |
| C. 部署層 | Docker Compose 健康 | 🔴 | Docker 6/6 not healthy |
| C. 部署層 | pm2 進程監控 | 🟢 | `pm2 status` |
| D. 安全層 | HMAC 認證 | 🟢 | Ch.03 |
| D. 安全層 | 路徑穿越防護 | 🟢 | resolve + 檢查 |
| E. 數據層 | SQLite 管道 | 🟢 | Ch.10 |
| E. 數據層 | 指標系統 | 🟢 | `/api/health?format=metrics` |
| F. 協作層 | OmniTag 合約率 100% | 🟢 | `pnpm oa:audit` |
| F. 協作層 | CI 全綠 | 🟢 | GitHub Actions |
| G. 治理層 | Kill Switch 就緒 | 🟢 | Ch.09 |
| G. 治理層 | 熵值 < 0.1 | 🟡 | 持續監控 |
| H. 語音代理 | s2s × HUB 架構 | 🟡 | H.4 |
| H. 語音代理 | VPS 解鎖 SOP | 🟡 | H.5 |

## 啟動 Checklist（九項必過）

```bash
[ ] 1. VPS Running (OCI Console)
[ ] 2. SSH 通 (key 認證)
[ ] 3. /health 200 (curl)
[ ] 4. pnpm test 全綠
[ ] 5. pnpm oa:audit 100%
[ ] 6. entropy < 0.1
[ ] 7. Docker healthy 或標記跳過
[ ] 8. Cron 任務存活 (cronjob list)
[ ] 9. 無未授權的 .env 變更
```

> 任何一項 🔴 不得上線。🟡 項目需記錄風險並設立追蹤。

## 阻塞項目（需外部依賴）

| 項目 | 阻礙 | 解決路徑 |
|------|------|----------|
| TencentDB Agent Memory | 需 VPS + SSH | Ch.02 解鎖後 |
| Hindsight 402 | 額度不足 | 等待额度充值 |
| VPS instance OOM 凍結 | 記憶體不足 | Oracle Console 重啟 |
| Docker 6/6 not healthy | 容器異常 | `docker-compose restart` |
| 5 個殘留 cron jobs | 暫停中 | 更新 prompts + resume |

## 語音代理部署（H. 專章）

### H.1 監控閾值

| 項目 | 閾值 | 觸發 |
|------|------|------|
| VPS RAM | < 4G | 限制模型 ≤ 2GB |
| STT 延遲 | > 10s | 檢查 faster-whisper |
| SSE 連線 | > 30s 無回應 | 檢查 tunnel |

### H.2 已知陷阱

- **VPS OOM 凍結**：Oracle Console → Reboot → `ollama rm gemma4:e4b` → pull `gemma4:e2b` → 更新 `.env` → `pm2 restart`
- **HUB 端口衝突**：確認 :8795 未被佔用
- **n8n 金鑰失效**：自動回落 edge-tts + Pillow

### H.3 核心指標

| 指標 | 目標 | 驗證 |
|------|------|------|
| TTS 延遲 | < 5s | `/api/tts` 計時 |
| STT 準確率 | > 90% | 樣本測試 |
| SSE 連線穩定 | 99% | 5 分鐘壓力測試 |

### H.4 s2s × HUB 架構

```
語音輸入 → s2s (VPS :8765)
  → VAD/STT (gemma4:e2b) → LLM → TTS (edge-tts)
  → HUB /voice/bridge → /speak → SSE /stream
```

### H.5 VPS 解鎖 SOP

```bash
# 1. Oracle Console → Reboot Instance
# 2. 清理記憶體
ollama rm gemma4:e4b
ollama pull gemma4:e2b
# 3. 更新配置
echo 'OLLAMA_MODEL=gemma4:e2b' >> .env
# 4. 重啟
pm2 restart ecosystem.config.js
```

## 與 Ch.23 的關係

Ch.23 定義覺醒原則（預設即合規 / 不帶病上線 / 醒著就頂標），本矩陣提供可量化的驗證項目與啟動門檻。

## 驗證命令

```bash
# 全域掃描
pnpm oa:audit && pnpm lint && pnpm typecheck && pnpm vitest run
# 語音代理檢查
curl -s http://127.0.0.1:8795/health
# 熵值檢查
git diff --stat
```
