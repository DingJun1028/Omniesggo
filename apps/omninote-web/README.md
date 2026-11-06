# @esggo/omninote-web

萬能筆記 OmniNote: Unified 之液態玻璃 Web 控制台（Next.js 16 + React 19 + Tailwind CSS 3）。

## 功能

- 速記捕獲：一句話寫入 Alpha 原點（POST /api/notes），支援標籤與 ⌘/Ctrl+Enter 快捷。
- 塗鴉速寫：原生 SVG 向量描繪，封存為 sketch_vector 區塊（POST /api/notes/:uuid/blocks）。
- 雙鏈熔合檢索：語意搜尋（POST /api/search），嵌入未啟用時如實顯示零算力降級。
- 結晶：草稿一鍵晉升為 Omega 實體（POST /api/drafts/:id/promote）。
- 封印：稽核導出（GET /api/export，attachment 下載）。
- 引擎健康面板：30 秒輪詢 /health（筆記數、草稿數、嵌入狀態）。

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
