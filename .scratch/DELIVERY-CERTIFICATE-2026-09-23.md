# 萬能即時翻譯 — 交付證書 (Delivery Certificate)

**日期**: 2026-09-23
**成品**: https://translate.esggo.co (v1.7.0)
**交付狀態**: ✅ 全鏈路已上線並實證

---

## 交付範圍

### 核心成品
| 項目 | 網址 | 狀態 |
|---|---|---|
| 🎙️ 主持人浮動字幕窗 | https://translate.esggo.co/float | ✅ Live |
| 📱 輕量版 (手機優先) | https://translate.esggo.co/lite.html | ✅ Live |
| 👁️ 觀眾頁 (SSE) | https://translate.esggo.co/stream?room=xxx | ✅ Live |
| 🎬 收音工作室 | https://translate.esggo.co/studio | ✅ Live |
| 🖥️ Overlay | https://translate.esggo.co/overlay | ✅ Live |
| 🎥 影片翻譯 | https://translate.esggo.co/player | ✅ Live |
| ❤️ 健康檢查 | https://translate.esggo.co/health | ✅ `{"status":"ok","version":"1.7.0"}` |

### 支援場景
- **iPhone/iPad (Safari)**: 麥克風收音 → 6 秒分段 → 雙語字幕（本輪修復重點）
- **Android**: 同上
- **桌面 Chrome/Edge**: 系統音擷取 (Zoom 共享聲音) + 麥克風
- **觀眾 (任何裝置)**: 掃 QR / 開連結 → SSE 即時雙語字幕
- **手動字幕**: 貼文字 → 翻譯廣播
- **Live Captions 輔助**: Windows/Chrome 剪貼簿監聽 (方案C)

---

## 今日九連修復 (全部已上線)

| # | 問題 | 根因 | Commit |
|---|---|---|---|
| 1 | 收音從未送翻譯 | ondataavailable 只存 blob 給下載鈕，註釋「每 6 秒發送」是假的 | `859ca8b2a` |
| 2 | 觀眾 SSE ERR_HTTP2_PROTOCOL_ERROR | server 送 Connection: keep-alive（RFC 9113 §8.2.1 h2 禁止） | `2e2042bac` |
| 3 | 3-tier CI Health-loop 必敗 | STT 8791 只綁 127.0.0.1，workflow 打公網必 000 | `1b73c2321` |
| 4 | iOS "音訊收音失敗: Not supported" | MediaRecorder 硬編 audio/webm + STT 無 mp4 魔數 | `1e1cc2cee` |
| 5 | lite.html 全功能死 | API 硬編 http://IP → mixed content 封鎖 + 7 頁 mimeType | `3b371f6a7` |
| 6 | 「字幕沒出現」收音從未啟動 | 預設音源 getDisplayMedia — iOS Safari 無此 API | `bb9bb595a` |
| 7 | lite 觀眾永遠收不到字幕 | es.onmessage 只收未命名事件；server 廣播具名 translation | `9db29b35b` |
| 8 | lite 觀眾斷線不重連 | 唯一缺 onerror 的觀眾頁 | `c3d03f59c` |
| 9 | 語音字幕不廣播觀眾 | /speech-to-subtitle 無 room 參數（手動有、語音沒有） | `ff8d0fac9` |

**VPS 治本**: gemma4:e4b (10GB) 反覆載入打爆 4 核機 (load 310) → manifest 停用 + ollama 重啟 → load 8，STT 恢復。

---

## 驗收證據 (5T)

### Traceable (可溯源)
- 9 commits 全在 main: `859ca8b2a → ff8d0fac9`，每個 commit message 記載根因
- 技能書 `universal-translator-mobile-audio-fix` 收錄完整修復表

### Trackable (可追蹤)
- 部署鏈: push main → deploy-oracle.yml + deploy-bilingual.yml 雙 workflow 全 success
- Live 版本 marker 實測:
  - float.html: `mobileDefault`×1 `pickAudioMime`×2 `sendAudioForSubtitle`×3 `room=ROOM`×1
  - lite.html: `addEventListener('translation')`×1 `es.onerror`×1 `行動裝置偵測`×1
  - `/api/room/final-scan` → `{"room":"final-scan","viewers":0}` ✅

### Tangible (可感知)
- 真語音 E2E（Windows SAPI 合成）:
  - "The complete mobile translation chain is verified end-to-end today."
  - →「完整的移動翻譯鏈現已過端到端驗證。」(google-gtx)

### Transparent (透明)
- 公網終極 E2E: `E2E_PUBLIC_VOICE_BROADCAST_PASS`
  - 主持人語音 → STT → 翻譯 → SSE → 觀眾收到 `speaker:"voice"` 事件
- VPS load 310→8 全程實測記錄

### Trustworthy (可信)
- 語法驗證: 每次修改 node --check / py_compile 全過
- TS 終始矩陣: Forward 14 exports ✓ / Reverse 0 drift / SHA256 lock
- 測試: 59/59 vitest PASS（未受影響）

---

## 使用指南

### 主持人 (iPhone)
1. 開 `https://translate.esggo.co/float`
2. ⚙️ → 建立連結 → 得房間 + QR
3. 🎙️ 開始收音（自動用麥克風）→ 說話
4. 每 6 秒自動出雙語字幕

### 觀眾
1. 掃 QR 或開分享連結
2. 即時看到雙語字幕（語音+手動都會收到）

### Zoom 場景 (電腦)
1. 開 float → 音源選「系統音訊」
2. 分享 Zoom 視窗 + 勾「分享音訊」

---

## 已知殘留 (透明申報)

| 項目 | 狀態 | 建議 |
|---|---|---|
| tdai-memory-core 引用 gemma4 | 改叫會 404（不再燒機，摘要功能降級） | 改用 qwen2.5:1.5b |
| Dependabot 106 漏洞 (16 critical) | 既有技術債 | pnpm overrides 批次處理 |
| STT 靜音檔 max() empty | 邊界情況（非語音輸入） | 可加靜音預檢 |
| VPS 23GB 機器跑多服務 | 結構性風險 | 大模型遷移或升級 |

---

**交付人**: 萬能分身 (Hermes Agent)
**驗證方式**: 全部以真實工具輸出實證（curl/SSH/E2E 腳本），零假完成
