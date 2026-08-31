// ============================================================
// PDF Upload & Parse API
// src/app/api/pdf/parse/route.ts
// ============================================================

import { NextRequest } from 'next/server';
import { parsePDFReport } from '../../../../src/core/pdf/pdf-parser';
import { PrismaClient } from '@prisma/client';
import { jsonError, jsonResponse, jsonErrorInternal } from '@lib/api-utils';

const prisma = new PrismaClient();
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;  // 60s timeout for large PDFs

/**
 * POST /api/pdf/parse
 * Accepts multipart/form-data with a PDF file
 * Returns structured ESG data
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return jsonError('INVALID_PARAMS', 'No file provided. Use multipart/form-data with field "file".', 400);
    }

    // Validate file type
    if (!file.name.endsWith('.pdf') && file.type !== 'application/pdf') {
      return jsonError('INVALID_PARAMS', 'File must be a PDF', 400);
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return jsonError('INTERNAL_ERROR', 'File too large. Maximum 50MB.', 413);
    }

    // Parse PDF
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const result = await parsePDFReport(buffer);

    if (!result.success) {
      return jsonError('INVALID_PARAMS', result.error || 'Parse failed', 422);
    }

    // Store parse result in database
    try {
      const dbResult = await prisma.pDFParseResult.create({
        data: {
          fileName: file.name,
          fileSize: file.size,
          title: result.title,
          pageCount: result.pageCount,
          totalWords: result.stats.totalWords,
          esgKeywordDensity: result.stats.esgKeywordDensity,
          companies: JSON.stringify(result.esg.companies),
          metrics: JSON.stringify(result.esg.metrics),
          years: JSON.stringify(result.esg.years),
          sections: JSON.stringify(result.sections.map(s => ({ title: s.title, pageStart: s.pageStart, pageEnd: s.pageEnd, category: s.category }))),
          esgCategories: JSON.stringify(result.esg.categories),
          textPreview: result.text.slice(0, 2000),
          rawText: result.text.slice(0, 100000),  // Cap at 100KB
        },
      });
      console.log(`[PDF Parse] Stored result: ${dbResult.id}`);
    } catch (dbError) {
      console.error('[PDF Parse] DB store failed:', (dbError as Error).message);
      // Non-blocking: return result even if DB store fails
    }

    return jsonResponse({
      title: result.title,
      pageCount: result.pageCount,
      stats: result.stats,
      esg: result.esg,
      sections: result.sections.map(s => ({
        title: s.title,
        pageStart: s.pageStart,
        pageEnd: s.pageEnd,
        category: s.category,
        textPreview: s.text.slice(0, 500),
      })),
      textPreview: result.text.slice(0, 2000),
    });
  } catch (error) {
    console.error('[PDF Parse API] Error:', error);
    return jsonErrorInternal(error, 'INTERNAL_ERROR', 500);
  }
}

/**
 * GET /api/pdf/parse
 * Returns usage info
 */
export async function GET() {
  return jsonResponse({
    usage: 'POST multipart/form-data with field "file" containing a PDF',
    maxFileSize: '50MB',
    supportedFormats: ['application/pdf'],
    returns: {
      title: 'Report title',
      pageCount: 'Number of pages',
      stats: 'Word count, ESG keyword density, etc.',
      esg: 'ESG categories, companies, metrics, years',
      sections: 'Detected report sections',
    },
  });
}
