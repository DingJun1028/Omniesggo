// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
// ============================================================
// PostgreSQL pgvector 連接與操作模組
// ============================================================

import { Pool, PoolClient } from 'pg';

// ========== 連接池設定 ==========

const pool = new Pool({
  connectionString: process.env.PGVECTOR_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected pgvector pool error:', err);
});

// ========== 基礎操作 ==========

export async function query<T = unknown>(
  text: string,
  params?: unknown[]
): Promise<{ rows: T[]; rowCount: number }> {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return { rows: result.rows as T[], rowCount: result.rowCount || 0 };
  } finally {
    client.release();
  }
}

export async function getClient(): Promise<PoolClient> {
  return pool.connect();
}

// ========== 向量操作 ==========

export interface NoteEmbeddingRow {
  id: string;
  note_id: string;
  embedding: string;
  model: string;
  created_at: Date;
  updated_at: Date;
}

export interface SearchResult {
  note_id: string;
  similarity: number;
  created_at: Date;
}

export async function storeEmbedding(
  noteId: string,
  embedding: number[],
  model: string = 'text-embedding-3-small'
): Promise<NoteEmbeddingRow> {
  const result = await query<NoteEmbeddingRow>(
    `INSERT INTO note_embeddings (note_id, embedding, model)
     VALUES ($1, $2, $3)
     ON CONFLICT (note_id) 
     DO UPDATE SET embedding = $2, model = $3, updated_at = NOW()
     RETURNING *`,
    [noteId, JSON.stringify(embedding), model]
  );
  return result.rows[0];
}

export async function getEmbedding(noteId: string): Promise<NoteEmbeddingRow | null> {
  const result = await query<NoteEmbeddingRow>(
    'SELECT * FROM note_embeddings WHERE note_id = $1',
    [noteId]
  );
  return result.rows[0] || null;
}

export async function deleteEmbedding(noteId: string): Promise<boolean> {
  const result = await query('DELETE FROM note_embeddings WHERE note_id = $1', [noteId]);
  return (result.rowCount || 0) > 0;
}

export async function semanticSearch(
  queryEmbedding: number[],
  options: { limit?: number; threshold?: number; excludeNoteIds?: string[] } = {}
): Promise<SearchResult[]> {
  const { limit = 10, threshold = 0.5, excludeNoteIds = [] } = options;
  const result = await query<SearchResult>(
    `SELECT * FROM search_notes_semantic($1, $2, $3) WHERE note_id != ALL($4)`,
    [JSON.stringify(queryEmbedding), limit, threshold, excludeNoteIds]
  );
  return result.rows;
}

export async function findRelatedNotes(
  noteId: string,
  limit: number = 10,
  threshold: number = 0.7
): Promise<SearchResult[]> {
  const original = await getEmbedding(noteId);
  if (!original) return [];
  const embedding = JSON.parse(original.embedding);
  return semanticSearch(embedding, { limit: limit + 1, threshold, excludeNoteIds: [noteId] })
    .then(r => r.slice(0, limit));
}

export async function batchStoreEmbeddings(
  embeddings: Array<{ noteId: string; embedding: number[]; model?: string }>
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const item of embeddings) {
      await client.query(
        `INSERT INTO note_embeddings (note_id, embedding, model)
         VALUES ($1, $2, $3)
         ON CONFLICT (note_id) DO UPDATE SET embedding = $2, model = $3, updated_at = NOW()`,
        [item.noteId, JSON.stringify(item.embedding), item.model || 'text-embedding-3-small']
      );
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// ========== ESG 實體 ==========

export interface ESGEntityRow {
  id: string;
  note_id: string;
  entity_type: string;
  entity_name: string;
  entity_id: string | null;
  confidence: number;
  metadata: Record<string, unknown> | null;
  created_at: Date;
}

export async function storeESGEntity(entity: {
  noteId: string;
  entityType: string;
  entityName: string;
  entityId?: string;
  confidence?: number;
  metadata?: Record<string, unknown>;
}): Promise<ESGEntityRow> {
  const result = await query<ESGEntityRow>(
    `INSERT INTO esg_entities (note_id, entity_type, entity_name, entity_id, confidence, metadata)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [entity.noteId, entity.entityType, entity.entityName, entity.entityId || null,
     entity.confidence || 0.8, entity.metadata ? JSON.stringify(entity.metadata) : null]
  );
  return result.rows[0];
}

export async function getNoteESGEntities(noteId: string): Promise<ESGEntityRow[]> {
  const result = await query<ESGEntityRow>(
    'SELECT * FROM esg_entities WHERE note_id = $1 ORDER BY confidence DESC',
    [noteId]
  );
  return result.rows;
}

// ========== 搜尋歷史 ==========

export async function recordSearchHistory(params: {
  userId: string;
  query: string;
  queryEmbedding?: number[];
  resultsCount: number;
  clickedNoteId?: string;
}): Promise<void> {
  await query(
    `INSERT INTO search_history (user_id, query, query_embedding, results_count, clicked_note_id)
     VALUES ($1, $2, $3, $4, $5)`,
    [params.userId, params.query, params.queryEmbedding ? JSON.stringify(params.queryEmbedding) : null,
     params.resultsCount, params.clickedNoteId || null]
  );
}

// ========== 統計與健康檢查 ==========

export async function getEmbeddingStats() {
  const result = await query<{
    total_embeddings: number;
    models_used: string[];
    oldest_embedding: Date | null;
    newest_embedding: Date | null;
  }>(
    `SELECT COUNT(*) as total_embeddings, ARRAY_AGG(DISTINCT model) as models_used,
     MIN(created_at) as oldest_embedding, MAX(created_at) as newest_embedding
     FROM note_embeddings`
  );
  const row = result.rows[0];
  return {
    totalEmbeddings: parseInt(String(row.total_embeddings), 10) || 0,
    modelsUsed: row.models_used || [],
    oldestEmbedding: row.oldest_embedding,
    newestEmbedding: row.newest_embedding,
  };
}

export async function checkHealth(): Promise<boolean> {
  try {
    await query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}
