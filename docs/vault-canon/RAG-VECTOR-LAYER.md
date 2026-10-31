# RAG 向量層（Vector Layer）正典

> AUTO-GENERATED 禁手改區以外的設計正典。對齊：Supabase 正典資料層、De-Google 政策、tzin 唯讀試點、OTS 憑證交接。

## 1. 角色分工

| 儲存 | 角色 |
|---|---|
| Supabase（正典） | 使用者、任務、OmniMemory、vault_secrets；RLS 全啟用 |
| Weaviate（VPS 自架） | 向量層；物件 ID 為確定性 UUID（docId + chunkIndex 之 SHA-256） |
| Redis（VPS 自架） | 快取／會話（本設計不含，另案） |
| Ollama（既有） | 嵌入生成（nomic-embed-text） |
| mcp-gateway（tzin） | 唯讀查詢邊界（rag_search 屬下階段） |

## 2. 資料表（Supabase migration：document_chunks_rag_mapping）

- `public.document_chunks`：chunk → Weaviate vector_ref 映射；RLS 四政策（owner_id = auth.uid()）。
- `vector_ref` 為 text（保留更換向量後端彈性）。

## 3. 用戶端模組（src/lib/rag/）

- contracts.ts：型別契約（RagChunk、RagIndexedEvent、RagSearchResult、SupabaseChunkRepo）。
- client.ts：設定載入（fail-fast）、確定性 UUID（R4 冪等）、Ollama 嵌入、Weaviate schema/upsert/graphql。
- index.ts：門面（indexDocument / search / buildIndexedEvent）。
- rag.test.ts：契約測試（模擬 fetch，不觸網路）。

## 4. 環境變數（VPS .env.secrets，600；經 OTS 交付）

- WEAVIATE_API_KEY（必要，fail-fast）
- WEAVIATE_URL（預設 http://127.0.0.1:8080）
- OLLAMA_URL（預設 http://127.0.0.1:11434）
- RAG_EMBEDDING_MODEL（預設 nomic-embed-text）
- RAG_WEAVIATE_CLASS（預設 OmniChunk）
- RAG_TIMEOUT_MS（預設 8000）

## 5. 安全邊界

- Weaviate/Redis 僅 127.0.0.1 監聽；對外經 nginx 反代 + Bearer。
- 查詢強制 ownerId 過濾，與 Supabase RLS 語義一致。
- 密文永不入 repo 與知識庫（Tier 2 禁存）。

## 6. 未驗證項（如實聲明）

- Weaviate 與 PM2 同機記憶體競爭未實測（建議 2 GB 上限試點）。
- Ollama 批量索引吞吐未實測。
- mcp-gateway rag_search 工具屬下階段。
