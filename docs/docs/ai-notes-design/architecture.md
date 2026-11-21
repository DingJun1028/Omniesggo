# AI 萬能筆記系統 - 混合架構設計文件

## 概述

AI 萬能筆記是一個智慧型筆記系統，支援多模態輸入、AI 自動分類、語意搜尋，並與 ESG GO 平臺深度整合。

## 核心功能

1. **多模態輸入** - 文字、圖片、音訊、PDF
2. **智慧分類** - AI 自動分類、標籤、關聯分析
3. **自動摘要** - 根據內容生成摘要、行動項、報告
4. **語意搜尋** - 自然語言搜尋（向量相似度）
5. **ESG 整合** - 與 ESG GO 平臺資料和報告整合

## 架構設計

### 混合架構

```
┌─────────────────────────────────────────────────────────────────┐
│                      AI 萬能筆記系統                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Next.js 應用層                        │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐              │   │
│  │  │ 筆記 API  │  │ 搜尋 API  │  │ AI 處理  │              │   │
│  │  └──────────┘  └──────────┘  └──────────┘              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          │                                      │
│         ┌────────────────┼────────────────┐                     │
│         ↓                ↓                ↓                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │ NoCodeBackend│  │ PostgreSQL  │  │  Redis      │            │
│  │  (MySQL)     │  │ + pgvector  │  │  (快取)     │            │
│  │  ──────────  │  │  ──────────  │  │  ──────────  │            │
│  │  • 筆記 CRUD │  │  • 向量儲存  │  │  • 會話快取  │            │
│  │  • 用戶資料  │  │  • 語意搜尋  │  │  • 熱數據    │            │
│  │  • 分類標籤  │  │  • 關聯分析  │  │  • 限流      │            │
│  │  • 附件管理  │  │  • ESG 實體  │  │              │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 資料分工

| 資料類型 | 儲存位置 | 說明 |
|----------|----------|------|
| 筆記內容 | NoCodeBackend (MySQL) | 結構化 CRUD |
| 用戶資料 | NoCodeBackend (MySQL) | 認證、設定 |
| 分類標籤 | NoCodeBackend (MySQL) | 關聯查詢 |
| 附件中繼資料 | NoCodeBackend (MySQL) | 檔案路徑、類型 |
| 向量嵌入 | PostgreSQL + pgvector | 語意搜尋 |
| ESG 實體 | PostgreSQL + pgvector | 關聯分析 |
| 搜尋歷史 | PostgreSQL + pgvector | 分析用 |
| 熱數據快取 | Redis | 效能優化 |

## NoCodeBackend Schema

### 筆記主表 (notes)

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | varchar(36) | 主鍵 |
| user_id | varchar(36) | 用戶 ID |
| title | varchar(255) | 筆記標題 |
| content | text | 筆記內容 |
| type | enum | text, image, audio, pdf, mixed |
| category | varchar(100) | 分類 |
| summary | text | AI 摘要 |
| source | enum | manual, import, api, email |
| embedding_id | varchar(100) | 關聯 PostgreSQL 向量 ID |
| created_at | datetime | 建立時間 |
| updated_at | datetime | 更新時間 |
| deleted_at | datetime | 軟刪除時間 |

### 標籤表 (tags)

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | varchar(36) | 主鍵 |
| name | varchar(100) | 標籤名稱（唯一） |
| color | varchar(7) | 顏色代碼 |

### 筆記-標籤關聯 (note_tags)

| 欄位 | 類型 | 說明 |
|------|------|------|
| note_id | varchar(36) | 外鍵 → notes.id |
| tag_id | varchar(36) | 外鍵 → tags.id |

### 附件表 (attachments)

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | varchar(36) | 主鍵 |
| note_id | varchar(36) | 外鍵 → notes.id |
| file_name | varchar(255) | 檔案名稱 |
| file_type | varchar(50) | 檔案類型 |
| file_size | bigint | 檔案大小 |
| storage_path | varchar(500) | 儲存路徑 |
| extracted_text | text | 提取的文字 |

### 筆記關聯表 (note_relations)

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | varchar(36) | 主鍵 |
| note_id | varchar(36) | 外鍵 → notes.id |
| related_note_id | varchar(36) | 外鍵 → notes.id |
| relation_type | enum | similar, reference, follow_up |
| confidence | decimal(3,2) | 信心度 |

## PostgreSQL + pgvector Schema

### 向量嵌入表 (note_embeddings)

```sql
CREATE TABLE note_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id VARCHAR(36) NOT NULL UNIQUE,
    embedding vector(1536) NOT NULL,
    model VARCHAR(50) NOT NULL DEFAULT 'text-embedding-3-small',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_note_embeddings_vector 
    ON note_embeddings 
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);
```

### ESG 實體表 (esg_entities)

```sql
CREATE TABLE esg_entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id VARCHAR(36) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_name VARCHAR(255) NOT NULL,
    entity_id VARCHAR(100),
    confidence DECIMAL(3,2) DEFAULT 0.8,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_esg_entities_note_id ON esg_entities(note_id);
CREATE INDEX idx_esg_entities_type ON esg_entities(entity_type);
```

### 搜尋歷史表 (search_history)

```sql
CREATE TABLE search_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(36) NOT NULL,
    query TEXT NOT NULL,
    query_embedding vector(1536),
    results_count INTEGER,
    clicked_note_id VARCHAR(36),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_search_history_user_id ON search_history(user_id);
```

### 語意搜尋函數

```sql
CREATE OR REPLACE FUNCTION search_notes_semantic(
    query_embedding vector(1536),
    match_count INT DEFAULT 10,
    similarity_threshold FLOAT DEFAULT 0.5
)
RETURNS TABLE (
    note_id VARCHAR(36),
    similarity FLOAT,
    created_at TIMESTAMP
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        ne.note_id,
        1 - (ne.embedding <=> query_embedding) AS similarity,
        ne.created_at
    FROM note_embeddings ne
    WHERE 1 - (ne.embedding <=> query_embedding) > similarity_threshold
    ORDER BY ne.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
```

## API 端點

### NoCodeBackend API

| 方法 | 端點 | 說明 |
|------|------|------|
| POST | /notes | 建立筆記 |
| GET | /notes | 取得筆記列表 |
| GET | /notes/:id | 取得單一筆記 |
| PUT | /notes/:id | 更新筆記 |
| DELETE | /notes/:id | 刪除筆記（軟刪除） |
| POST | /tags | 建立標籤 |
| GET | /tags | 取得標籤列表 |
| POST | /note_tags | 建立筆記-標籤關聯 |
| POST | /attachments | 上傳附件 |
| GET | /attachments | 取得附件列表 |

### 自訂 API (Next.js)

| 方法 | 端點 | 說明 |
|------|------|------|
| POST | /api/notes/search | 語意搜尋 |
| POST | /api/notes/:id/summarize | 生成摘要 |
| POST | /api/notes/:id/classify | 自動分類 |
| GET | /api/notes/:id/related | 取得相關筆記 |
| POST | /api/notes/export | 匯出筆記 |
| GET | /api/notes/esg | 取得 ESG 相關筆記 |
| POST | /api/notes/esg/report | 生成 ESG 報告 |

## 環境變數

```bash
# NoCodeBackend
NCB_API_KEY=ncb_xxxxxxxxxxxxx
NCB_BASE_URL=https://api.nocodebackend.com/v1

# PostgreSQL (pgvector)
PGVECTOR_URL=postgresql://user:pass@host:5432/esggo_vectors

# Redis
REDIS_URL=redis://redis:6379

# AI
OPENAI_API_KEY=sk-xxxxxxxxxxxx
```

## 部署架構

### Oracle Always Free

```
┌─────────────────────────────────────────────────────────────┐
│                    Oracle Always Free                       │
│                 VM.Standard.A1.Flex                         │
│              2 OCPUs / 12GB RAM / Ubuntu 22.04              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  Docker Compose                      │   │
│  │                                                      │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │   │
│  │  │  Nginx   │→ │ Next.js  │→ │  Redis   │          │   │
│  │  │  :80/443 │  │  :3000   │  │  :6379   │          │   │
│  │  └──────────┘  └──────────┘  └──────────┘          │   │
│  │                      ↓                               │   │
│  │               ┌──────────────┐                       │   │
│  │               │ PostgreSQL   │                       │   │
│  │               │ + pgvector   │                       │   │
│  │               └──────────────┘                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
         │
         │ 外部服務
         ├─ NoCodeBackend (MySQL)
         ├─ OpenAI (Embeddings)
         └─ Oracle Object Storage (檔案)
```

### 資源分配

| 服務 | CPU | 記憶體 | 說明 |
|------|-----|--------|------|
| Nginx | 0.25 | 256MB | 反向代理 |
| Next.js | 1.5 | 8GB | 應用 + AI 處理 |
| Redis | 0.25 | 1GB | 快取 |
| PostgreSQL | 0.5 | 2GB | 向量搜尋 |
| 系統 | - | 1GB | Ubuntu |
| **合計** | **~2.5** | **~12.25GB** | 在免費配額內 |

## 實作計畫

| 階段 | 時間 | 內容 |
|------|------|------|
| Phase 1 | 1 週 | NoCodeBackend 設定 + 基礎 CRUD API |
| Phase 2 | 1 週 | PostgreSQL pgvector 設定 + 向量搜尋 |
| Phase 3 | 1 週 | AI 分類 + 摘要生成 |
| Phase 4 | 1 週 | ESG 整合 + 報告生成 |
| Phase 5 | 1 週 | 前端 UI + 優化 |

## 優缺點分析

### 優點

1. **開發速度** - NoCodeBackend 自動生成 API，快速 CRUD
2. **效能** - 各司其職，最佳化
3. **成本** - NoCodeBackend 免費方案 + PostgreSQL 免費
4. **擴展性** - 各自獨立擴展

### 缺點

1. **複雜度** - 兩個資料庫，跨庫查詢複雜
2. **一致性** - 資料一致性需自行處理
3. **備份** - 需要同步備份策略
4. **學習成本** - 需要學習 NoCodeBackend API

## 參考資料

- [NoCodeBackend 文件](https://docs.nocodebackend.com/)
- [pgvector GitHub](https://github.com/pgvector/pgvector)
- [Oracle Always Free Resources](https://docs.oracle.com/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm)
