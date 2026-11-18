# @esggo/omninote-web

萬能筆記 OmniNote: Unified 之液態玻璃 Web 控制台（Next.js 16 + React 19 + Tailwind CSS 3）。

## 功能

- 速記捕獲：一句話寫入 Alpha 原點（POST /api/notes → 201 { ok, node }），支援標籤與 ⌘/Ctrl+Enter 快捷。
- 塗鴉速寫：原生 SVG 向量描繪，封存為 sketch_vector 區塊（POST /api/notes/:uuid/blocks）。
- 雙鏈熔合檢索：語意搜尋（POST /api/search），嵌入未啟用時如實顯示零算力降級。
- 結晶：草稿一鍵晉升為 Omega 實體（POST /api/drafts/:id/promote）。
- 封印：稽核導出（GET /api/export，attachment 下載）。
- 引擎健康面板：30 秒輪詢 /health（節點數、向量數、草稿數）。
- 節點詳情：區塊清單（型別徽章）、六種 CRDT 區塊型別追加（ON_API_APPEND 證據入鏈、lock_hash 重算）、證據鏈檢視。
- 雙鏈熔合圖譜：拓撲權威 outlinks（target_uuid/wikilink_alias/resolved）實線投影（未解析虛線、邊中點標示 wikilink_alias 別名並附懸停提示）＋區塊內容 [[雙鏈]] 灰線投影，環形佈局 SVG，三態品牌色，點擊節點開啟詳情。
- ⌘K 指令面板：全域動作（聚焦速記/檢索、重新整理、封印導出）與筆記全文跳轉，鍵盤導航（↑↓ Enter Esc）。
- 區塊 soft-delete 顯示：CRDT tombstone（deleted）以刪除線與「已刪除」標記如實呈現。
- 區塊編輯與軟刪除操作：非墓碑區塊行內編輯（PATCH /api/notes/:uuid/blocks/:blockId，ON_BLOCK_EDIT 證據入鏈、outlinks 熔合重建）與軟刪除按鈕（DELETE 同路徑，CRDT tombstone、ON_BLOCK_TOMBSTONE 證據入鏈）。
- 熵減淨化：節點詳情「淨化」按鈕觸發 POST /api/notes/:uuid/purify，對現存宇宙重標註死鏈並顯示 entropy_score（ON_ENTROPY_PURIFICATION 證據入鏈）。
- 三態躍遷操作：非 OMEGA 節點可「熔合 SIGMA」（POST /api/notes/:uuid/sigma，區塊長文熔煉）與「結晶 OMEGA」（POST /api/notes/:uuid/crystallize，實體型別輸入框注入 entity_type）；OMEGA 節點可「逆向投影 ALPHA」（POST /api/notes/:uuid/reverse）。證據鏈 ON_SIGMA_SYNTHESIS / ON_OMEGA_CRYSTALLIZE / ON_REVERSE_PROJECT 如實入鏈。
- 同態分支操作（十二期）：節點詳情可輸入重基內容生成 SyncDeltaPacket（POST /api/notes/:uuid/rebase，LATERAL_REBASE，節點未變更、lock_hash 不變），封包可預覽（vector 與 state_signature 前綴）後套用（POST /api/notes/:uuid/apply，JSON Patch 子集生效、版本遞增、ON_SYNC_DELTA_APPLY 證據入鏈；409 分歧提示重新生成）。
- 熵值與證據鏈視覺化（十四期）：節點詳情之熵值顯示為分級橫條（低於 0.25 青綠、0.25 至 0.5 金黃、高於 0.5 紅色，title 提示計算語義）；證據鏈改為時間軸樣式（左側縱線與節點圓點，最新一筆以青綠圓點標示，hook_lifecycle 徽章化，audit_formula 與 content_hash 以懸停提示呈現）。
- 熔合圖譜力導向佈局（十五期）：FusionGraph 由環形佈局改為確定性力導向佈局（環形初始化後迭代彈簧引力、全對斥力與中心重力，無隨機源、同一輸入恆得同一結果），節點半徑隨連結度遞增（9 至 15），懸停顯示連結數，邊界自動調適縮放回畫布。
- 熔合圖譜懸停聚焦（十八期）：滑鼠懸停或鍵盤聚焦節點時，突顯該節點與其相鄰邊、鄰居節點（懸停節點加白色描邊），其餘元素淡化至低不透明度，便於探索區域結構；未解析懸浮鏈結節點亦可聚焦；節點群組具備 aria-label 無障礙標示。
- 筆記結晶板關鍵字過濾（十九期）：筆記結晶板新增關鍵字過濾欄，比對區塊內容與拓撲標籤（大小寫不敏感），標題即時顯示符合數量（如 3/12），無符合時顯示提示；與語意檢索面板互補（前者為客戶端即時子集過濾，後者為伺服器端嵌入檢索）。
- 證據鏈伺服器分頁查詢（二十二期）：節點詳情之證據鏈區塊對接 GET /api/notes/:uuid/evidence（二十期端點），支援 hook 精確篩選與每頁 20 筆之分頁瀏覽（上一頁/下一頁），顯示符合區間、總數與 node_version；可返回本機全量檢視；查詢失敗於提示列如實顯示。
- 證據鏈 hook 別統計徽章（二十四期）：節點詳情之證據鏈區塊對接 GET /api/notes/:uuid/evidence/stats（二十三期端點），一鍵載入後顯示總數、首末筆 captured_at 與 node_version 綁定，各 hook 依入鏈首現順序以徽章呈現筆數，點擊徽章即以該 hook 執行分頁篩選；captured_at 為字串排序非時間權威（如實標示）；查詢失敗於提示列如實顯示。
- 證據鏈 JSON 快照匯出（二十六期）：節點詳情之證據鏈區塊對接 GET /api/notes/:uuid/evidence/export（二十五期端點），一鍵下載全量證據鏈 JSON 快照（檔名含 uuid 與 node_version；exported_at 為伺服器當下時間非鏈內時間權威，如實標示）；匯出進行中按鈕禁用，失敗於提示列如實顯示。
- 結晶板標籤軸徽章（二十八期）：筆記結晶板對接 GET /api/tags（二十七期端點），依字典序顯示標籤徽章（標籤 × 節點數，count 為含該標籤之節點數，如實標示），點擊徽章切換精確標籤過濾（與關鍵字過濾採交集，標題顯示符合數），可一鍵清除；標籤彙整隨筆記資料變更自動重新載入，載入失敗靜默降級不影響既有過濾功能。
- 熔合圖譜標籤過濾聯動（二十九期）：雙鏈熔合圖譜對接 GET /api/tags（二十七期端點），於圖譜上方顯示標籤徽章列（含「全量」清除鈕），點擊徽章以精確標籤匹配過濾筆記子集後重建圖譜（未解析懸浮鏈結節點隨子集重建，標題顯示過濾標籤），再次點擊或「全量」恢復全量圖譜；標籤軸取得失敗靜默降級為全量圖譜，不打斷主流程。
- 封存面板匯出與匯入（三十期）：新增封存面板對接引擎既有 GET /api/export（全量封存快照，引擎逐節點驗算 lock_hash，篡改即刻拒絕，匯出採 Blob 下載檔名含日期）與 POST /api/import（api.ts 既有 importArchive 封裝首次接上 UI），匯入可選衝突策略（skip 保留既有／overwrite 覆寫），完成後如實顯示 imported/skipped/overwritten/tampered 報告並自動刷新；操作進行中按鈕禁用，失敗於提示列如實顯示。
- 熵值總覽徽章（三十一期）：筆記結晶板對接引擎新增 GET /api/entropy/stats，顯示已淨化節點數（with_entropy/total_notes）與平均、最高熵值（title 如實標示 entropy_score 僅於熵減自癒 purify 後存在，無具值節點時不顯示）；隨筆記資料變更自動重新載入，載入失敗靜默降級不影響既有功能。
- 批次標籤操作列（三十三期）：筆記結晶板每張卡片提供批次選取核取框，選取後顯示批次操作列，可輸入標籤後附加或移除（對接 POST /api/notes/tags，三十二期端點）；報告如實顯示已更新數、無變化數與不存在節點數，成功後清除選取並自動刷新；操作進行中按鈕禁用，失敗於操作列如實顯示。
- 熔合圖譜伺服器投影對接（三十五期）：雙鏈熔合圖譜之節點與拓撲權威 outlink 邊改由 GET /api/graph（三十四期端點）單一請求供給（alias 取伺服器別名、resolved 為現存宇宙即時成員判定，節點事後刪除即時降為未解析），區塊內容 [[雙鏈]] 灰線與懸浮節點保留客戶端投影；投影隨筆記資料變更重新載入，取得失敗靜默降級為既有客戶端組裝並於副標如實標示。

## 啟動

```bash
pnpm --filter @esggo/omninote-web dev   # http://localhost:52720
```

引擎（本機回環 API，預設 127.0.0.1:52710）：

```bash
pnpm --filter @esggo/omninote-unified exec node bin/omninote-server.ts
```

API 基底可用 `NEXT_PUBLIC_OMNINOTE_API` 環境變數覆寫。

## 設計對應

- 品牌色：Sustainability Green #00A896（Alpha）、Governance Blue #0056B3（Sigma）、Glory Gold #D4AF37/#EEB21B（Omega）。
- 深色液態玻璃（#0F172A 疊層、backdrop-blur-2xl）、Bento Grid、428 懸浮核心操作列（行動端拇指熱區）。
