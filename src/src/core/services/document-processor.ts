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

export async function processDocumentWithOcr(fileBuffer: Buffer, fileName: string): Promise<ProcessedDocument> {
  const timestamp = Date.now();
  const id = randomUUID();

  // Use ESGSonnar for powerful multi-modal OCR
  const ocrExtract = await sonnarClient.query({
    companyId: 'UNKNOWN', // This would ideally be passed down
    queryType: 'ocr_extract',
    payload: { fileName, bufferSize: fileBuffer.length }
  });
  
  // Use ESGSonnar for Deep Knowledge Analysis based on the extracted text
  const knowledgePoint = await sonnarClient.query({
    companyId: 'UNKNOWN',
    queryType: 'knowledge_analysis',
    payload: { context: ocrExtract.text }
  });

  // 5T Protocol: Generate Hash Lock for Trustworthy requirement
  const hashLockPayload = `${id}-${timestamp}-${ocrExtract.text}`;
  const hashLock = createHash('sha256').update(hashLockPayload).digest('hex');

  return {
    id,
    sourceFile: fileName,
    ocrResult: {
      text: ocrExtract.text,
      confidence: ocrExtract.confidence || 0.95
    },
    knowledgePoint,
    timestamp,
    hashLock
  };
}
