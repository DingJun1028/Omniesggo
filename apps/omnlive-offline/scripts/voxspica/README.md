# VoxSpica × OmniLive 整合 / Integration

> VoxSpica (VOSK 離線語音辨識, https://github.com/alex37529/voxspica) 繁體中文化並接入 ESG-GO OmniLive 即時翻譯生態。

## 一、繁體中文介面補丁 / Traditional Chinese UI Patch

VoxSpica 官方僅有簡體 (`zh`) 介面。本補丁不加金鑰、不改功能，只在 PyInstaller CArchive 追加一個 locale 檔：

```
dictophone/locales/zhtw.json     # 繁體中文介面字典 (由 zh.json 傳統化 + 台灣用語潤飾)
```

程式機制（逆向 `dictophone.i18n` 證實）：
- 介面語言清單 = `LOCALES_DIR/*.json` 動態掃描 → 放入 `zhtw.json` 即自動出現在語言選擇器
- 顯示名 = locale 內的 `lang.zhtw` 鍵（「繁體中文」）

### 安裝 / Install

```powershell
# 1) 下載官方 portable (SHA256 校驗) 並解壓
#    https://github.com/alex37529/voxspica/releases → VoxSpica-0.1.8-win64.zip → C:\opt\voxspica\app

# 2) 下載辨識模型 (cn 中文 + en-us 英文)
& C:\opt\voxspica\app\VoxSpica.exe download --lang cn --size small
& C:\opt\voxspica\app\VoxSpica.exe download --lang en-us --size small

# 3) 注入繁體 locale (自動備份原檔為 VoxSpica.orig.exe)
python apps/omnilive/scripts/voxspica/pyxinject.py C:\opt\voxspica\app\VoxSpica.exe \
  apps/omnilive/scripts/voxspica/zhtw.json "dictophone\locales\zhtw.json" \
  C:\opt\voxspica\app\VoxSpica.orig.exe

# 4) 介面語系切繁體 (寫入 config, 無 BOM UTF-8)
#    C:\Users\<user>\.voxspica\config.json → "ui_lang": "zhtw"
```

- `make_zhtw.py`：由 zh.json 重新產生 zhtw.json（可套新版本）。
- 回滾：以 `VoxSpica.orig.exe` 覆蓋即可。

## 二、OmniLive 橋接 / Bridge

`../voxspica-bridge.ps1`：本機 VoxSpica 辨識結果 → OmniLive `/api/speak` → 即時雙語字幕。

- VOSK cn 模型輸出簡體 → 橋接自動 `zhconv` 轉繁體（見 `convertToTraditional`）
- from/to 預設 `auto`：聽中譯英、聽英譯中雙向自動配對 (r6.1 伺服器端)
- 零費用：只用 OmniLive 免費翻譯鏈

```powershell
# 即時麥克風
powershell -ExecutionPolicy Bypass -File voxspica-bridge.ps1 -ServerUrl http://<omni>:8797 -Lang cn
# 檔案轉錄
powershell -ExecutionPolicy Bypass -File voxspica-bridge.ps1 -Mode file -AudioFile meeting.wav -Lang en-us
```

## 三、已驗證 / Verified

- [x] TOC 注入成功（entries: be/de/en/es/fr/it/ru/uk/zh/zhtw）
- [x] 真 app 碼 + 真 locale 函數級載入（app.title=「VoxSpica — 語音辨識」）
- [x] 修繕 exe 辨識正常（EN 一句不錯；CN 簡體→s2t 繁中）
- [x] E2E：wav → VOSK → s2t → /api/speak → 自動配對英文回傳
