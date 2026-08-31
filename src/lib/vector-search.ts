// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================================
// 向量搜尋服務 - 整合 NCB + pgvector
// ============================================================

import { getNCBClient } from './ncb-client';
import {
  getEmbedding, deleteEmbedding, semanticSearch,
  findRelatedNotes, getNoteESGEntities, storeESGEntity,
  recordSearchHistory, getEmbeddingStats,
  type NoteEmbeddingRow, type ESGEntityRow,
} from './pgvector';
import {
  getEmbeddingGenerator, extractEmbeddingText, type EmbeddingOptions,
} from './embedding-generator';
import type { NoteWithTags } from '@/types/notes';

export interface VectorSearchOptions {
  limit?: number;
  threshold?: number;
  userId?: string;
  includeMetadata?: boolean;
}

export interface EnrichedSearchResult {
  noteId: string;
  similarity: number;
  note?: NoteWithTags;
  esgEntities?: ESGEntityRow[];
}

export interface NoteWithVector {
  id: string;
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  embedding?: NoteEmbeddingRow;
  esgEntities?: ESGEntityRow[];
}

export class VectorSearchService {
  private ncb = getNCBClient();
  private generator = getEmbeddingGenerator();

  async indexNote(noteId: string, options: EmbeddingOptions = {}): Promise<void> {
    const noteWithTags = await this.ncb.getNoteWithTags(noteId);
    const embeddingText = extractEmbeddingText({
      title: noteWithTags.title,
      content: noteWithTags.content,
      category: noteWithTags.category,
      tags: noteWithTags.tags?.map(t => t.name),
    });
    await this.generator.generateAndStore(noteId, embeddingText, options);
  }

  async indexNotes(noteIds: string[], options: EmbeddingOptions = {}): Promise<void> {
    const items = await Promise.all(
      noteIds.map(async (noteId) => {
        const noteWithTags = await this.ncb.getNoteWithTags(noteId);
        return {
          noteId,
          text: extractEmbeddingText({
            title: noteWithTags.title,
            content: noteWithTags.content,
            category: noteWithTags.category,
            tags: noteWithTags.tags?.map(t => t.name),
          }),
        };
      })
    );
    await this.generator.generateAndStoreBatch(items, options);
  }

  async removeNote(noteId: string): Promise<void> {
    await deleteEmbedding(noteId);
  }

  async search(query: string, options: VectorSearchOptions = {}): Promise<EnrichedSearchResult[]> {
    const { limit = 10, threshold = 0.5, userId, includeMetadata = true } = options;
    const queryResult = await this.generator.generate(query);
    const searchResults = await semanticSearch(queryResult.embedding, { limit, threshold });

    if (!includeMetadata) {
      return searchResults.map(r => ({ noteId: r.note_id, similarity: r.similarity }));
    }

    const enrichedResults = await Promise.all(
      searchResults.map(async (result) => {
        try {
          const [note, esgEntities] = await Promise.all([
            this.ncb.getNoteWithTags(result.note_id),
            getNoteESGEntities(result.note_id),
          ]);
          return {
            noteId: result.note_id,
            similarity: result.similarity,
            note,
            esgEntities: esgEntities.length > 0 ? esgEntities : undefined,
          } as unknown as EnrichedSearchResult;
        } catch {
          return { noteId: result.note_id, similarity: result.similarity, note: undefined } as unknown as EnrichedSearchResult;
        }
      })
    );

    if (userId) {
      await recordSearchHistory({
        userId, query,
        queryEmbedding: queryResult.embedding,
        resultsCount: enrichedResults.length,
      }).catch(console.error);
    }

    return enrichedResults;
  }

  async findRelated(noteId: string, limit: number = 5, threshold: number = 0.7): Promise<EnrichedSearchResult[]> {
    const relatedNotes = await findRelatedNotes(noteId, limit, threshold);
    return Promise.all(
      relatedNotes.map(async (result) => {
        try {
          const note = await this.ncb.getNoteWithTags(result.note_id);
          return { noteId: result.note_id, similarity: result.similarity, note } as EnrichedSearchResult;
        } catch {
          return { noteId: result.note_id, similarity: result.similarity, note: undefined } as EnrichedSearchResult;
        }
      })
    );
  }

  async getNoteWithVector(noteId: string): Promise<NoteWithVector | null> {
    try {
      const [note, embedding, esgEntities] = await Promise.all([
        this.ncb.getNoteWithTags(noteId),
        getEmbedding(noteId),
        getNoteESGEntities(noteId),
      ]);
      return {
        id: note.id, title: note.title, content: note.content,
        category: note.category, tags: note.tags?.map(t => t.name),
        embedding: embedding || undefined,
        esgEntities: esgEntities.length > 0 ? esgEntities : undefined,
      };
    } catch {
      return null;
    }
  }

  async storeESGEntities(noteId: string, entities: Array<{
    entityType: string; entityName: string; entityId?: string;
    confidence?: number; metadata?: Record<string, any>;
  }>): Promise<void> {
    for (const entity of entities) {
      await storeESGEntity({ noteId, ...entity });
    }
  }

  async getStats() {
    return getEmbeddingStats();
  }
}

let serviceInstance: VectorSearchService | null = null;

export function getVectorSearchService(): VectorSearchService {
  if (!serviceInstance) {
    serviceInstance = new VectorSearchService();
  }
  return serviceInstance;
}
