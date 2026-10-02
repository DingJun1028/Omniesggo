# OmniSub 萬能即時語音擷取翻譯

繁體中文 ⇄ English 雙向自動語音擷取、免金鑰翻譯、雙語字幕、浮動字幕。

**零 API key · 零 GPU · 零 npm 執行依賴 · 單檔可攜**

---

## 快速開始

單檔、零依賴，直接用瀏覽器開啟即可（建議 Chrome / Edge，Web Speech 辨識支援最完整）：

```
apps/omnisub/index.html
```

無需建置、無需 `npm install`、無需 `package.json`、無需任何後端服務。

## 功能

| 功能 | 說明 |
| --- | --- |
| 雙向自動對翻 | 語言自動判別，繁中⇄English 恆為對方語言，無需選單 |
| 免金鑰翻譯 | 三段備援鏈，單一失效自動降級，字幕不中斷 |
| 雙語字幕 | 原文 + 譯文即時雙行顯示 |
| 浮動字幕 | 可拖曳、可調透明度、置頂顯示 |
| 歷史紀錄 | 保留 40 筆，可展開／清空／匯出 SRT |
| VAD 靜音抑制 | 低於門檻不送推論，實質省電省流量 |
| VAD 門檻可調 | 介面可即時調整 |
| 零金鑰語音 | 瀏覽器內建 Web Speech；選擇性本機 Whisper（WASM） |

## 語音辨識引擎

| 引擎 | 說明 | 成本 |
| --- | --- | --- |
| Web Speech（預設） | 瀏覽器內建，無需下載模型 | 免費 |
| Whisper WASM（選用） | transformers.js 於瀏覽器本機推論，資料不出機 | 免費（耗本機資源） |

Web Speech 模式**不會**把重採樣 PCM 送入 Whisper 佇列；僅在 `STT.useWhisper` 為真時才入列。

## 免金鑰翻譯鏈

備援順序與實測結果（2026-10，非臆測）：

| 順序 | 端點 | 實測結果 |
| --- | --- | --- |
| 1 | MyMemory | 穩定，長句翻譯正確，`quotaFinished:false` |
| 2 | Google gtx | 延遲最低（實測 207~881ms），但對部分 IP（尤其機房／VPS）會回 429。**429 為暫時性 IP 限流，非端點永久失效**（同一端點稍後複測 4/4 HTTP 200） |
| 3 | LibreTranslate | 所有公開實例實測皆失效（`libretranslate.de` 301 後回 405、fedilab 403、terraprint 502）。**僅在填入自架 URL 時啟用，否則自動略過** |

機制要點：

- 單一併發 + 佇列上限 2，過期片段丟棄，不持續堆積
- 引擎失敗後冷卻 60 秒，避免每段字幕都白等逾時
- 冷卻中的引擎直接跳過（零請求），成功後解除冷卻

## 已知限制

**純漢字日文會被判為中文。** `detectLang` 以「有漢字、無假名、無韓文」判定中文，
因此像「会議資料」這類全漢字日文（會、議、資、料 皆為漢字）會被判為 `zh-TW`。
含假名的日文（如「今日の会議」——`の` 為 U+306E）則能正確判為非中文。

這是兩語範圍（僅繁中 ⇄ English）下的已知且可接受限制：
不以字典比對日／中同形異義詞，故不做語言學層級的鑑別。

## 驗證

61 項測試，全數通過：

```bash
node apps/omnisub/verify.mjs
```

涵蓋：語言偵測、雙向對翻、真實網路翻譯、XSS 防護、VAD 門檻、
STT 佇列上限、備援鏈冷卻與降級、SRT 匯出、快捷鍵、記憶體有界。

驗證 harness 透過 pnpm store 路徑載入 `jsdom`，**未新增任何 monorepo 依賴**。

### 關於跨 realm AbortController

`verify.mjs` 的 `beforeParse` 會將 `window.AbortController` 換成 Node 原生版本。
原因是 jsdom 自己的 `AbortSignal` 並非 Node 原生 `AbortSignal` 的實例
（`instanceof === false`），直接餵給 undici 的 `fetch` 會在 Promise 鏈之外
**同步**拋出 `TypeError`，繞過產品碼的 `.catch`，被外層 catch 接走而渲染失敗佔位字串。
真實瀏覽器中兩者同 realm，不存在此問題，故僅修補測試環境，產品碼不需改動。

## 設計要點

- **字幕與歷史一律用 `textContent`**，不碰 `innerHTML`（杜絕 XSS）
- **暫停時擷取層完全停止處理**，不燒 CPU
- **Whisper 重連**：修正原版 `onend` 檢查錯誤物件 `this.running` 導致無法重連的缺陷
- **繁中優先**：偵測為繁中時原文不重複翻譯，直接對翻

## 相關技能

本專案的語音與字幕實作參照 `streaming-speech-translator`
與 `live-caption-overlay` 技能規範。
