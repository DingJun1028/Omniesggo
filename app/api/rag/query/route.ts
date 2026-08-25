import { db } from '@lib/firebase';
import { collection, getDocs, query, where } from '@lib/firebase';
import { jsonResponse, jsonError, validateParams, jsonErrorInternal } from '@lib/api-utils';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const FREE_TIER_ONLY = process.env.FREE_TIER_ONLY !== 'false';
const HAS_API_KEY = !!process.env.GEMINI_API_KEY;
const USE_REAL_AI = HAS_API_KEY && !FREE_TIER_ONLY;

// Cosine similarity for standard array numbers
function cosineSimilarity(vecA: number[], vecB: number[]) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function POST(req: Request) {
  try {
    const { prompt, userId = 'default_user' } = await req.json();

    const paramValidation = validateParams({ prompt });
    if (!paramValidation.valid) {
      return jsonError('INVALID_PARAMS', 'prompt 為必填參數');
    }

    if (!HAS_API_KEY) {
      return jsonResponse({
        answer: '[OmniRAG 模擬回覆] 尚未配置 GEMINI_API_KEY，請設定後獲得真實 AI 回應。',
        references: [],
        provider: 'mock'
      });
    }

    if (!USE_REAL_AI) {
      return jsonResponse({
        answer: '[OmniRAG 免費層] 根據檢索到的內容，本主題暫無深入分析數據。',
        references: [],
        provider: 'mock'
      });
    }

    // 1. Generate embedding for user prompt
    let promptEmbedding: number[] = [];
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
    
    try {
      const embedRes = await ai.models.embedContent({
        model: 'text-embedding-004',
        contents: prompt
      });
      promptEmbedding = embedRes.embeddings?.[0]?.values || [];
    } catch (e) {
      console.warn('Embedding generation failed:', e);
      return jsonError('EMBEDDING_FAILED', '無法生成查詢向量');
    }

    // 2. Fetch documents (in a real production vector DB this would be a nearest neighbor search)
    // For standard firestore, we fetch and do in-memory search (okay for small village data)
    const ragRef = collection(db, 'rag_knowledge');
    const q = query(ragRef, where('user_id', '==', userId)); 
    // In multi-tenant, it might be where('tenantId', '==', tenantId)
    const snapshot = await getDocs(q);

    const scoredDocs: { content: string, score: number, source: string }[] = [];
    
    for (const doc of snapshot.docs) {
      const data = doc.data() as Record<string, unknown>;
      const embedding = data.embedding as number[] | undefined;
      const content = data.content as string | undefined;
      const source = data.source as string | undefined;
      if (embedding && embedding.length > 0 && promptEmbedding.length > 0 && content && source) {
        const score = cosineSimilarity(promptEmbedding, embedding);
        scoredDocs.push({
          content,
          score,
          source,
        });
      }
    }

    // 3. Sort by similarity and pick top 3
    scoredDocs.sort((a, b) => b.score - a.score);
    const topK = scoredDocs.slice(0, 3);
    const contextStr = topK.map((d, i) => `[Source ${i+1}: ${d.source}]\n${d.content}`).join('\n\n');

    // 4. Generate final answer using Gemini Flash
    const finalPrompt = `你是 OmniCore 的企業智庫助理 (OmniGemini RAG)。請根據以下歷史永續報告內容，回答使用者的問題。如果內容與問題無關，請使用常識回答，但註明未從知識庫找到明確佐證。

【知識庫內容】
${contextStr}

【使用者問題】
${prompt}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: finalPrompt,
    });

    return jsonResponse({
      answer: response.text,
      references: topK.map(d => d.source),
      provider: 'gemini'
    });
  } catch (error) {
    console.error('RAG Query Error:', error);
    return jsonErrorInternal(error, 'RAG_QUERY_FAILED');
  }
}
