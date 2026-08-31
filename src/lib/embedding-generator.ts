// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
// ============================================================
// 向量嵌入生成器模組
// ============================================================

import { storeEmbedding, batchStoreEmbeddings } from './pgvector';

export interface EmbeddingOptions {
  model?: string;
  dimensions?: number;
  maxLength?: number;
}

export interface EmbeddingResult {
  embedding: number[];
  model: string;
  dimensions: number;
  tokenCount?: number;
}

export class EmbeddingGenerator {
  private apiKey: string;
  private defaultModel = 'text-embedding-3-small';

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('Missing OPENAI_API_KEY environment variable');
    }
  }

  async generate(text: string, options: EmbeddingOptions = {}): Promise<EmbeddingResult> {
    const { model = this.defaultModel, dimensions, maxLength = 8000 } = options;
    const truncatedText = text.substring(0, maxLength);

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, input: truncatedText, dimensions }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI Embedding API Error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return {
      embedding: data.data[0].embedding,
      model,
      dimensions: data.data[0].embedding.length,
      tokenCount: data.usage?.total_tokens,
    };
  }

  async generateBatch(texts: string[], options: EmbeddingOptions = {}): Promise<EmbeddingResult[]> {
    const { model = this.defaultModel, dimensions, maxLength = 8000 } = options;
    const truncatedTexts = texts.map(text => text.substring(0, maxLength));

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, input: truncatedTexts, dimensions }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI Embedding API Error: ${response.status} - ${error}`);
    }

    const data = await response.json() as {
      data: Array<{ embedding: number[] }>;
      usage?: { total_tokens?: number };
    };
    return data.data.map((item) => ({
      embedding: item.embedding,
      model,
      dimensions: item.embedding.length,
      tokenCount: data.usage?.total_tokens ? Math.ceil(data.usage.total_tokens / texts.length) : undefined,
    }));
  }

  async generateAndStore(noteId: string, text: string, options: EmbeddingOptions = {}): Promise<void> {
    const result = await this.generate(text, options);
    await storeEmbedding(noteId, result.embedding, result.model);
  }

  async generateAndStoreBatch(
    items: Array<{ noteId: string; text: string }>,
    options: EmbeddingOptions = {}
  ): Promise<void> {
    const texts = items.map(item => item.text);
    const results = await this.generateBatch(texts, options);
    const embeddings = items.map((item, index) => ({
      noteId: item.noteId,
      embedding: results[index].embedding,
      model: results[index].model,
    }));
    await batchStoreEmbeddings(embeddings);
  }

  static cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) throw new Error('Vectors must have the same length');
    let dotProduct = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

let generatorInstance: EmbeddingGenerator | null = null;

export function getEmbeddingGenerator(): EmbeddingGenerator {
  if (!generatorInstance) {
    generatorInstance = new EmbeddingGenerator();
  }
  return generatorInstance;
}

export function prepareTextForEmbedding(text: string): string {
  return text.replace(/\s+/g, ' ').replace(/\n+/g, '\n').trim();
}

export function extractEmbeddingText(note: {
  title: string;
  content: string;
  category?: string;
  tags?: string[];
}): string {
  const parts = [note.title];
  if (note.category) parts.push(`分類：${note.category}`);
  if (note.tags?.length) parts.push(`標籤：${note.tags.join('、')}`);
  parts.push(note.content);
  return prepareTextForEmbedding(parts.join('\n'));
}
