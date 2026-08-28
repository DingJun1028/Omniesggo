import pdfParse from 'pdf-parse';
import { agnesApi } from '@/lib/agnes-api';
import { db } from '@lib/firebase';
import { collection, addDoc } from '@lib/firebase';
import { jsonResponse, jsonError, jsonErrorInternal } from '@lib/api-utils';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const FREE_TIER_ONLY = process.env.FREE_TIER_ONLY !== 'false';
const HAS_API_KEY = !!process.env.GEMINI_API_KEY;
const USE_REAL_AI = HAS_API_KEY && !FREE_TIER_ONLY;

function chunkText(text: string, chunkSize = 1000, overlap = 200): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + chunkSize));
    i += chunkSize - overlap;
  }
  return chunks;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string || 'default_user';

    if (!file) {
      return jsonError('INVALID_PARAMS', '未提供 PDF 檔案');
    }

    // 將 File 轉換為 Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. 解析 PDF
    const pdfData = await pdfParse(buffer);
    const rawText = pdfData.text.replace(/\n+/g, '\n').trim();

    // 1.5 AGNES 預處理 (擷取前 2000 字元進行摘要分析)
    let summaryContext = '';
    try {
      const sampleText = rawText.substring(0, 2000);
      const agnesRes = await agnesApi.processRequest(`請分析以下文本並提取摘要：\n${sampleText}`);
      if (agnesRes.success) {
        summaryContext = agnesRes.data.output as string;
      }
    } catch (e) {
      console.warn('[AGNES_API] 預處理失敗，繼續執行標準流程', e);
    }

    // 2. 切片 (Chunking)
    const chunks = chunkText(rawText, 1000, 200);

    // 3. 寫入 Firebase Firestore
    const promises = chunks.map(async (chunk, index) => {
      const finalContent = summaryContext 
        ? `[Global Context: ${summaryContext}]\n\n${chunk}` 
        : chunk;

      let embedding = null;
      if (USE_REAL_AI) {
        try {
          const { GoogleGenAI } = await import('@google/genai');
          const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
          const embedRes = await ai.models.embedContent({
            model: 'text-embedding-004',
            contents: finalContent
          });
          embedding = embedRes.embeddings?.[0]?.values || null;
        } catch (e) {
          console.warn('Embedding generation failed:', e);
        }
      }

      return addDoc(collection(db, 'rag_knowledge'), {
        user_id: userId,
        content: finalContent,
        source: file.name,
        chunk_index: index,
        embedding: embedding,
        created_at: new Date().toISOString(),
        provider: USE_REAL_AI ? 'gemini' : 'mock'
      });
    });
    
    await Promise.all(promises);

    return jsonResponse({
      success: true,
      message: 'PDF 解析與 Chunking 寫入成功',
      totalChunks: chunks.length,
      pageCount: pdfData.numpages,
      provider: USE_REAL_AI ? 'gemini' : 'mock'
    });

  } catch (error) {
    console.error('PDF Ingestion Error:', error);
    return jsonErrorInternal(error, 'INTERNAL_ERROR');
  }
}
