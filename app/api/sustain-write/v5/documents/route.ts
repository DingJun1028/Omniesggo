import { NextRequest } from 'next/server';
import { processDocumentWithOcr } from '@/core/services/document-processor';
import { getCompanyById } from '@/core/repositories/sustain-write-answer-database';
import { setCompanyDocument } from '@lib/redis';
import { jsonError, jsonErrorInternal, jsonResponse } from '@lib/api-utils';

export const runtime = 'nodejs';
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['application/pdf', 'text/csv', 'text/plain', 'application/vnd.ms-excel']);

export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return jsonError('INVALID_PARAMS', 'Expected multipart form data', 400);
  }

  const file = formData.get('file');
  const companyId = formData.get('companyId');
  const rawYear = formData.get('reportingYear');
  if (!(file instanceof File) || typeof companyId !== 'string' || !companyId.trim()) {
    return jsonError('INVALID_PARAMS', 'file and companyId are required', 400);
  }
  if (!getCompanyById(companyId)) {
    return jsonError('INVALID_PARAMS', 'Unknown companyId', 400);
  }
  if (file.size === 0) {
    return jsonError('INVALID_PARAMS', 'File must not be empty', 400);
  }
  if (file.size > MAX_FILE_BYTES) {
    return jsonError('INVALID_PARAMS', `File must be no larger than ${MAX_FILE_BYTES} bytes`, 413);
  }
  const extension = file.name.toLowerCase().split('.').pop();
  const typeMatchesExtension = extension === 'pdf'
    ? file.type === 'application/pdf'
    : extension === 'csv'
      ? file.type === 'text/csv' || file.type === 'application/vnd.ms-excel'
      : extension === 'txt' && file.type === 'text/plain';
  if (!ALLOWED_TYPES.has(file.type) || !typeMatchesExtension) {
    return jsonError('INVALID_PARAMS', 'File extension and MIME type must match: PDF, CSV, or UTF-8 TXT', 415);
  }

  const currentYear = new Date().getFullYear();
  const reportingYear = rawYear === null || rawYear === '' ? null : Number(rawYear);
  if (reportingYear !== null && (!Number.isInteger(reportingYear) || reportingYear < 2000 || reportingYear > currentYear)) {
    return jsonError('INVALID_PARAMS', 'Invalid reportingYear', 400);
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    if (extension === 'pdf' && !buffer.subarray(0, 5).equals(Buffer.from('%PDF-'))) {
      return jsonError('INVALID_PARAMS', 'The uploaded file does not have a valid PDF signature', 415);
    }
    const document = await processDocumentWithOcr(buffer, file.name, companyId);
    const extractedText = document.ocrResult.text.trim();
    if (!extractedText || /\[Fallback OCR\]/i.test(extractedText)) {
      return jsonError('INTERNAL_ERROR', 'OCR is unavailable or returned placeholder text; document was not recorded as evidence', 503);
    }

    const snapshot = {
      id: document.id,
      companyId,
      fileName: file.name.slice(0, 180),
      mimeType: file.type,
      reportingYear,
      uploadedAt: new Date(document.timestamp).toISOString(),
      document,
    };
    await setCompanyDocument(snapshot);
    return jsonResponse({
      id: snapshot.id,
      companyId,
      fileName: snapshot.fileName,
      reportingYear,
      uploadedAt: snapshot.uploadedAt,
      confidence: document.ocrResult.confidence,
      hashLock: document.hashLock,
      storageTtlDays: 7,
      permanentArchive: false,
    }, 201);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('OCR_UNAVAILABLE:')) {
      return jsonError('INTERNAL_ERROR', 'PDF OCR is currently unavailable; no evidence was stored', 503);
    }
    if (error instanceof TypeError || (error instanceof Error && /UTF-8|empty|valid/i.test(error.message))) {
      return jsonError('INVALID_PARAMS', 'Text file must contain non-empty valid UTF-8 content', 400);
    }
    return jsonErrorInternal(error, 'INTERNAL_ERROR');
  }
}
