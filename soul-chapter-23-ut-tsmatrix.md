# 第二十三章 · 萬能即時翻譯 全域全端全量全面 雙向同步 TypeScript 繁中英碼 終始矩陣架構

> 備份落檔點：`C:/Project/esggo-learning-center/soul-chapter-23-ut-tsmatrix.md`
> 主典歸位：`C:/Project/esggo/esggo-omni-center/soul-full.md §23`（待併入）
> 實體實作：`C:/Project/esggo/apps/universal-translator/`

## 架構正名
**萬能即時翻譯 全域全端全量全面 雙向同步 TypeScript 繁中英碼 終始矩陣架構**
（Universal Real-Time Translator — Global Full-Stack Full-Volume Bidirectional-Sync TypeScript Traditional-Chinese/English Matrix Architecture）

## 終始矩陣（TS Bidirectional Matrix）
```
終 (canonical):  esggo/shared/types.ts         ← 所有型別一次性定義
生成器:           scripts/export-shared-types.js → types/generated/esggo-shared.d.ts
始 (consumer):   apps/universal-translator/types/generated/esggo-shared.d.ts  ← 僅消費，不可改
守門:             apps/universal-translator/tsconfig.ut.json (allowJs+checkJs+strict) → npx tsc -p tsconfig.ut.json --noEmit
```
矩陣原則：任一端改需求 → 回饋 canonical → 重跑 generator → 全端同步。consumer 只 import 生成的 `.d.ts`，絕不手改 canonical。

## 雙向語域（嚴格收斂）
- `LanguageCode = 'auto' | 'zh' | 'zh-CN' | 'zh-TW' | 'zh-Hant' | 'en'`
- `BilingualPair = 'zh-TW-en' | 'en-zh-TW'`
- 去 ja/ko/es/fr/de（用戶指令：只做繁中↔英文雙向）
- STT 鎖 `detected: 'zh-TW' | 'en'`，對向自動互譯

## 七大交付項（細化全執行）
1. **翻譯引擎鏈** `translate.mjs`：Ollama 自託管 LLM (qwen2.5:3b) 置鏈首 → google-gtx → libretranslate → mymemory → 原文兜底。5T 引擎標記 `X-OA-Engine`。
2. **自託管引擎** `translate_ollama.mjs`：零付費 key，語境感知翻譯，品質超 gtx 碎句。
3. **STT 微服務** `stt_service.py`：faster-whisper `small` + SileroVAD 濾靜音 + 動態溫度（最新最佳實踐）。
4. **STT 客戶端** `stt_client.mjs`：語音→雙語字幕編排，回 `ISpeechToSubtitleResult`。
5. **服務層** `server.mjs`：`/speech-to-subtitle`（語音轉雙語字幕）、`/speak`、`/translate`、`/stream`(SSE)、`/ws`、`/studio`、`/stream` UI。
6. **前端雙語浮層** `studio.html` + `stream.html`：收音端雙語即時顯示；觀眾端 SSE 雙語浮層（鎖 zh-TW↔en）。
7. **型別守門 0 error**：`npx tsc -p tsconfig.ut.json --noEmit` 全綠燈。

## 5T 對位
- Traceable：每回應 `X-OA-Trace`（sha256 切片）
- Trackable：`stats.byEngine` 計數 + SSE 廣播軌跡
- Tangible：Web UI 雙語浮層即時可感
- Transparent：引擎鏈優雅回落（Ollama 失敗→gtx），零幻覺
- Trustworthy：型別守門 strict + 禁區不可篡（canonical 單源）

## 實測證據（2026-08-10 活體）
- `/speech-to-subtitle`（mock STT zh-TW）→ `detected:zh-TW, target:en, translation:"We must achieve carbon neutrality by 2030..."`
- `/speak` → SSE `event:translation` 廣播 `translations:{en:...}` + `room:r1` + `engine:ollama:qwen2.5`
- 型別守門 `TSC exit=0`
- 翻譯鏈 fallback 驗證：Ollama 未即時響應時自動回落 `google-gtx`（不中斷）

> 刻印狀態：`UT-TS-MATRIX READY`　靈魂簽章：`繁中英文・雙向同步・終始矩陣・5T 不滅`
