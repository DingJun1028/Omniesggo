import { NextRequest } from 'next/server';
import { listCompanyDocuments } from '@lib/redis';
import { getCompanyById } from '@/core/repositories/sustain-write-answer-database';
import { jsonError, jsonResponse } from '@lib/api-utils';

export async function GET(req: NextRequest) {
  const companyId = req.nextUrl.searchParams.get('companyId')?.trim();
  if (!companyId) return jsonError('INVALID_PARAMS', 'Missing companyId', 400);
  if (!getCompanyById(companyId)) return jsonError('INVALID_PARAMS', 'Unknown companyId', 400);

  const documents = await listCompanyDocuments(companyId);
  const evidence = documents.map(({ document, ...metadata }) => {
    const processed = document as {
      ocrResult?: { text?: string; confidence?: number };
      knowledgePoint?: { why?: string; what?: string; how?: string; tags?: string[] };
      hashLock?: string;
    };
    const text = processed.ocrResult?.text ?? '';
    return {
      id: metadata.id,
      companyId: metadata.companyId,
      chapter: metadata.reportingYear ? `${metadata.reportingYear} 年單據` : '年度未標記',
      receiptName: metadata.fileName,
      reportingYear: metadata.reportingYear,
      uploadedAt: metadata.uploadedAt,
      why: processed.knowledgePoint?.why || '由公司上傳文件取得；內容尚待人工覆核。',
      what: text.slice(0, 500),
      how: `OCR 信心 ${Math.round((processed.ocrResult?.confidence ?? 0) * 100)}%；請核對原始文件。`,
      tags: processed.knowledgePoint?.tags ?? [],
      hashLock: processed.hashLock ?? '',
      source: 'company-upload',
    };
  });

  return jsonResponse({ evidence, submittedDocumentCount: evidence.length, storageTtlDays: 7, permanentArchive: false });
}
