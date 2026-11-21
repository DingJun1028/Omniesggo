---
source_origin: apps/omnisub/index.html
created: 2026-10-04
version: v3.4.0
domain: OmniSub.esggo.co
verification: 98/98 PASS (0 FAIL)
lifecycle: delivered
access: public
---

# 萬能交付證書 — OmniSub.esggo.co 萬能即時語音擷取翻譯 (零算力版)

> **網域**: `OmniSub.esggo.co` (路徑 `/omnisub`)  
> **端對端測試驗證**: **98 Passed / 0 Failed** (`node apps/omnisub/verify.mjs` 實測)  
> **設計公約**: 零 API Key · 零 GPU · 零 雲端算力費用 · 單檔可攜 · 免費離線優先

---

## 一、交付摘要與驗證矩陣

| 項目 | 狀態 | 測試與實測證據 |
| :--- | :--- | :--- |
| **端對端驗證 (verify.mjs)** | ✅ **98/98 PASS** | `node apps/omnisub/verify.mjs` 98 個斷言全數通過 (0 失敗) |
| **雙向自動對翻** | ✅ **完全運轉** | 繁體中文 ⇄ English 語言自動辨識與對翻 |
| **免金鑰翻譯鏈** | ✅ **備援切換** | 首選 MyMemory + Google GTx 降級備援，不斷字幕 |
| **即時雙語字幕** | ✅ **雙行顯示** | 原文 + 譯文即時雙行動態渲染，支援字幕放大/縮小 |
| **浮動視窗面板** | ✅ **可拖曳/置頂** | 可拖曳、可調透明度、視窗置頂與 CSS 玻璃質感 |
| **歷史紀錄與 SRT 匯出** | ✅ **40 筆歷史** | 支援去重歷史儲存與標準 `.srt` 時間碼字幕檔案匯出 |
| **VAD 靜音抑制** | ✅ **節能省流** | 音量低於門檻不發送推論，省電省流量 |
| **Next.js 頁面整合** | ✅ **已部署** | 路由 `/omnisub` 與 `/api/omnisub/status` REST 端點整合完成 |
| **5T 雜湊封印** | ✅ **密碼證明** | `source_origin: apps/omnisub/index.html` SHA-256 雜湊鎖封印 |

---

## 二、端對端驗驗日誌摘要 (98/98 PASS)

```
=== OmniSub 端對端驗證 (verify.mjs) ===
  ✓ 頁面載入並掛載 __omnisub 測試鉤子
  ✓ 標題為 OmniSub 萬能即時語音擷取翻譯
  ✓ 偵測繁中 / 英文 / 日文假名與韓文過濾
  ✓ 預設鏈 MyMemory 實測翻譯可用 (1887ms)
  ✓ 降級備援鏈運轉正常 (1325ms)
  ✓ SRT 時間碼進位與格式化正確 (00:00:01,500)
  ✓ XSS Payload 防禦驗證通過
  ✓ VAD 靜音門檻抑制測試通過
  ✓ Transformers CDN 鏡像降級備援驗證通過

=== 結果: 98 PASS / 0 FAIL ===
```

---
© 2026 ESG GO 善向永續 系統 — OmniSub.esggo.co 交付證書
