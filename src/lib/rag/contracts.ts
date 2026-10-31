// =====================================================================
// src/lib/rag/contracts.ts — RAG 向量層型別契約
// 對接: OmniMemory（語義檢索）· OmniBus（rag.indexed 事件，R4 冪等）
// De-Google: 嵌入一律自架 Ollama（nomic-embed-text），不使用 Google 服務
// =====================================================================

export interface RagChunk {
  docId: string;
  ownerId: string;
  chunkIndex: number;
  content: string;
}

export interface RagIndexedEvent {
  type: "rag.indexed";
  docId: string;
  chunkCount: number;
  model: string;
  at: string;
}

export interface RagSearchResult {
  docId: string;
  chunkIndex: number;
  content: string;
  distance: number;
  trustScore?: number;
}

export interface RagClientConfig {
  weaviateUrl: string;
  weaviateApiKey: string;
  ollamaUrl: string;
  embeddingModel: string;
  className: string;
  timeoutMs: number;
}

export interface SupabaseChunkRepo {
  saveVectorRef(docId: string, chunkIndex: number, vectorRef: string): Promise<void>;
}
