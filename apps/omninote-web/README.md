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
