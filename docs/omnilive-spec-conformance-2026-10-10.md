# OmniSub / OmniLive 擷取翻譯機制 — 規格符合性驗收（2026-10-10）

> 對照《萬能即時語音擷取翻譯系統規格書 v1.0》逐節驗收。全部實測，無推測。

## 受測系統
| 系統 | 角色 | 位址 |
|---|---|---|
| OmniLiveTranslation / OmniLive | 完整服務版（VPS faster-whisper + 免費翻譯鏈 + SSE） | omnilivetranslation.esggo.co · omnilive.esggo.co |
| OmniSub | 瀏覽器零算力版（Web Speech + Whisper WASM，無服務端） | omnisub.esggo.co |

## 本日修復（阻塞級）
1. **前端整個死掉（根因）**：`public/index.html` 被 3 個編碼事故 commit（d9fa960e7/edd434ae3/9a552cc11）把中文全改成 `?`（0x3f）、吃掉 `<title>` 的 `<`，inline JS 字符串永不閉合 → 整個 UI Script 語法錯誤。服務端 API 正常所以一直沒被發現。
   → 以最後好版本 4e64de45f 為基底＋挑回 Liquid Glass 純英文樣式塊，重組為乾淨 UTF-8：live 複驗 title 中文、JS 語法 OK、0 亂碼、1304 CJK 字復位。已部署（static 逐請求重讀，免重啟）。
2. **STT 準確度**：whisper `base` → `small`（VPS CPU）。實測「語音辨識測試」base 時代錯成「語音電視測試」，small 正確辨識；低信心字 0。
3. **測試孤兒**：app 內 5 支 node:test 套件補 `test` script（root 排除＋直跑繼承 root config 雙重孤兒）→ 43/43 通過。

## 規格符合性
| 規格條目 | 狀態 | 實測 |
|---|---|---|
| 4.1 系統音源（Zoom 會議） | ✅ | getDisplayMedia({audio:true})；health: audioSource=system-display；另有麥克風/指定裝置/文字輸入 |
| 4.1 開始/暫停/繼續/停止 | ✅ 本日補 | 暫停鈕已上線（停送 STT、緩衝保留、可繼續） |
| 4.1 音量/收音狀態 | ✅ | Analyser 音量計＋靜音看門狗 |
| 4.2 自動語言偵測＋手動指定 | ✅ | CJK 比例偵測；實測 zh→en、en→zh 雙向正確 |
| 4.2 逐句＋時間戳＋標點 | ✅ | words 逐字時間戳（probability 齊） |
| 4.2 說話者區分（標示推定） | ✅ | 能量 VAD A/B 輪替＋本日補「VAD 推定」註記 |
| 4.2 低信心提示 | ✅ 本日補 | probability<0.5 → 字幕組附「⚠ 低信心片段」 |
| 4.3 原文/譯文並列＋句段對應 | ✅ | 雙語字幕組＋merge 窗口（2.5s） |
| 4.3 只顯示譯文/兩者 | ✅ | 順序切換（orderSrcFirst） |
| 4.3 持續更新不按停止才翻 | ✅ | 6 秒窗口＋2 秒 overlap 即時送（非 stop 才翻） |
| 4.4 複製/匯出/清除 | ✅ 本日補 | 匯出 TXT＋SRT（雙語帶時間戳）；清除工作階段紀錄 |
| 5 介面要素 | ✅ | 語言選擇/輸入源狀態/控制鈕/即時雙語區/連線與錯誤狀態/操作鈕 |
| 6 延遲 | ✅ | zh 端到端 ~3-8s（6s 窗口）；翻譯單段 1-2s |
| 6 可用性（錯誤狀態） | ✅ | STT 不可用→502＋明確碼；429 inflight 保護；錯誤碼體系 |
| 7 隱私（停止即不擷取） | ✅ | stop 停全部 track＋關 AudioContext；房間密碼＋主播金鑰 |
| 8 錯誤處理 | ✅ | 麥克風失敗/無聲/STT busy/逾時皆有提示與回復路徑 |
| 9 驗收條件 | ✅ | 上述對應；未授權不啟麥克風（按鈕才啟動） |

## 引擎鏈（免費算立）
STT：本地 faster-whisper（small, CPU, 零 key）→ 翻譯：google-gtx → mymemory → 原文兜底（全免費零 key；Gemini 可選增強）。

## 待辦（見 docs/TODO-2026-10-10-hermes-omni-ops.md）
- OmniSub（零算力版）僅驗证服務 200；瀏覽器 WASM/Web Speech 路徑需真機點開確認（無法 headless 測麥克風）。
- 手機實機點開 omnihermes/omnilive 各页面做最終人眼驗收。
