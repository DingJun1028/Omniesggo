# RAG 向量層（Vector Layer）正典

> AUTO-GENERATED 禁手改區以外的設計正典。對齊：Supabase 正典資料層、De-Google 政策、tzin 唯讀試點、OTS 憑證交接。
> 2026-11-07 使用者裁決：向量層改採 Weaviate Cloud 免費沙箱（原 VPS 自架 docker-compose 方案退役）。

## 1. 角色分工

| 儲存 | 角色 |
|---|---|
| Supabase（正典） | 使用者、任務、OmniMemory、vault_secrets；RLS 全啟用 |
| Weaviate Cloud（免費沙箱） | 向量層；物件 ID 為確定性 UUID（docId + chunkIndex 之 SHA-256） |
| Ollama（可指本機或 VPS） | 嵌入生成（nomic-embed-text），向量於用戶端計算後以明確向量寫入 |
| mcp-gateway（tzin） | 唯讀查詢邊界（rag_search 工具已落地，見 apps/mcp-gateway/src/rag.ts） |

## 2. 資料表（Supabase migration：document_chunks_rag_mapping）

- `public.document_chunks`：chunk → Weaviate vector_ref 映射；RLS 四政策（owner_id = auth.uid()）。
- `vector_ref` 為 text（保留更換向量後端彈性）。

## 3. 用戶端模組（src/lib/rag/ 與 apps/mcp-gateway/src/rag.ts）

- contracts.ts：型別契約（RagChunk、RagIndexedEvent、RagSearchResult、SupabaseChunkRepo）。
- client.ts：設定載入（fail-fast）、確定性 UUID（R4 冪等）、Ollama 嵌入、Weaviate schema/upsert/graphql。
- index.ts：門面（indexDocument / search / buildIndexedEvent）。
- rag.test.ts：契約測試（模擬 fetch，不觸網路）。
- mcp-gateway/src/rag.ts：rag_search 唯讀端點（缺 WEAVIATE_API_KEY 時 503 優雅降級）。
- 程式碼零改動即相容 Weaviate Cloud：兩入口皆以 `Authorization: Bearer <key>` 對 `WEAVIATE_URL` 呼叫同一套 REST/GraphQL API，WCD 亦接受此認證格式。

## 4. 環境變數（經 OTS 交付；VPS .env.secrets / 部署環境，600）

- WEAVIATE_URL（WCD 叢集位址，形如 `https://<cluster-id>.weaviate.network`）
- WEAVIATE_API_KEY（WCD API key，必要，fail-fast）
- OLLAMA_URL（預設 http://127.0.0.1:11434；VPS 停機期間可指向本機 Ollama）
- RAG_EMBEDDING_MODEL（預設 nomic-embed-text）
- RAG_WEAVIATE_CLASS（預設 OmniChunk；WCD 免費層限 1 個 collection，此名即唯一席位）
- RAG_TIMEOUT_MS（預設 8000；雲端往返建議 10000 以上）

## 5. 安全邊界

- 傳輸：WCD 全程 TLS；認證為 Bearer API key（Tier 2 禁存，僅存 .env.secrets / Supabase vault_secrets）。
- 查詢強制 ownerId 過濾（where Equal），與 Supabase RLS 語義一致；GraphQL 字串跳脫防注入（mcp-gateway 既有實作）。
- 密文永不入 repo 與知識庫。
- WCD 帳號本身之登入憑證（email/密碼）為 Tier 2，永不入庫。

## 6. 未驗證項（如實聲明）

- WCD 端到端寫入/查詢未實測（待使用者建立沙箱並交付 URL + API key 後驗證）。
- 自帶向量寫入是否計入 WCD「每日 2,000 嵌入請求」額度未實測（本設計嵌入於用戶端 Ollama 完成，WCD 僅存向量）。
- mcp-gateway rag_search 對 WCD 之實際延遲未量測。

## 7. Weaviate Cloud 免費沙箱接入手冊

額度（weaviate.io/pricing，2026-06-17 起 always-free，取代舊 14 天試用）：每使用者 1 個叢集、100,000 物件、1 GB 記憶體、10 GB 磁碟、1 個 collection（最多 3 租戶）、每日 2,000 嵌入請求；免信用卡、無期限。

步驟：

1. 使用者於 console.weaviate.io 以 email 註冊（免信用卡）。
2. 建立 Sandbox 叢集（免費方案），取得叢集 URL 與 API key。
3. 依「代理密碼交接工作流」以 OneTimeSecret 交付 URL 與 API key（兩行：WEAVIATE_URL=... 與 WEAVIATE_API_KEY=...）。
4. 代理兌換後寫入 Supabase vault_secrets 與部署環境 .env.secrets，並以 `scripts/verify-weaviate-cloud.mjs` 驗證（子命令：ready / meta / schema / e2e；e2e 建立缺席之 OmniChunk、寫入明確向量測試物件、nearVector 檢索尋回後清理，不留殘留）：
   ```
   WEAVIATE_URL=... WEAVIATE_API_KEY=... node scripts/verify-weaviate-cloud.mjs e2e
   ```
   全過通過時輸出 `E2E_ALL_PASS`。
5. 升級路徑：免費沙箱可原地升級 pay-as-you-go，無需遷移。
