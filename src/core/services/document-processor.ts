// src/core/services/document-processor.ts
import { randomUUID, createHash } from 'crypto';
import { sonnarClient } from './esg-sonnar-client';

export interface DocumentOcrResult {
  text: string;
  confidence: number;
}

export interface EsgKnowledgePoint {
  why: string;
  what: string;
  how: string;
  tags: string[];
}

export interface ProcessedDocument {
  id: string;
  sourceFile: string;
  ocrResult: DocumentOcrResult;
  knowledgePoint: EsgKnowledgePoint;
  timestamp: number;
  hashLock: string; // 5T: Trustworthy marker
}

export async function processDocumentWithOcr(fileBuffer: Buffer, fileName: string, companyId: string): Promise<ProcessedDocument> {
  const timestamp = Date.now();
  const id = randomUUID();
  const extension = fileName.toLowerCase().split('.').pop();
  let extractedText: string;
  let confidence: number;
  let knowledgePoint: EsgKnowledgePoint;

  if (extension === 'txt' || extension === 'csv') {
    // Plain text and CSV are already machine-readable; preserve their submitted contents verbatim.
    extractedText = new TextDecoder('utf-8', { fatal: true }).decode(fileBuffer).replace(/^\uFEFF/, '').trim();
    if (!extractedText || extractedText.includes('\u0000')) throw new Error('Text document is empty or not valid UTF-8');
    confidence = 1;
    knowledgePoint = { why: '直接擷取上傳文字；未推論企業事實。', what: '原始文字內容，請以原始單據覆核。', how: '需人工確認內容、計量單位與報導期間。', tags: ['raw-text', 'human-review-required'] };
  } else {
    // PDF requires a configured OCR service. The Sonnar client has a demo fallback; reject it below.
    const ocrExtract = await sonnarClient.query({
      companyId,
      queryType: 'ocr_extract',
      payload: { fileName, bufferBase64: fileBuffer.toString('base64'), mimeType: 'application/pdf' },
    });
    extractedText = ocrExtract.text;
    confidence = ocrExtract.confidence;
    if (!extractedText?.trim() || /\[Fallback OCR\]/i.test(extractedText)) {
      throw new Error('OCR_UNAVAILABLE: PDF OCR service is unavailable or returned placeholder text');
    }
    // Keep AI analysis out of report facts; it is advisory only and may itself use demo fallback data.
    knowledgePoint = { why: '由 OCR 擷取；待人工覆核。', what: '僅保留 OCR 原文作為來源材料。', how: '請核對原始 PDF、數值與報導期間。', tags: ['ocr', 'human-review-required'] };
  }

  const hashLock = createHash('sha256').update(fileBuffer).digest('hex');
  return {
    id,
    sourceFile: fileName,
    ocrResult: { text: extractedText, confidence },
    knowledgePoint,
    timestamp,
    hashLock,
  };
}
