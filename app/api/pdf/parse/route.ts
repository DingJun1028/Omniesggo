import { NextRequest } from 'next/server';
import { parsePDFReport } from '../../../../src/core/pdf/pdf-parser';
import { JSONB } from '../../../../src/lib/supabase-omni';
import { jsonError, jsonResponse, jsonErrorInternal } from '@lib/api-utils';
import { supabase } from '@/lib/supabase-omni';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return jsonError('INVALID_PARAMS', 'No file provided. Use multipart/form-data with field "file".', 400);
    }
    if (!file.name.endsWith('.pdf') && file.type !== 'application/pdf') {
      return jsonError('INVALID_PARAMS', 'File must be a PDF', 400);
    }
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return jsonError('INTERNAL_ERROR', 'File too large. Maximum 50MB.', 413);
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const result = await parsePDFReport(buffer);
    if (!result.success) {
      return jsonError('INVALID_PARAMS', result.error || 'Parse failed', 422);
    }

    try {
      await supabase.from('PDFParseResult').insert({
        id: crypto.randomUUID(),
        fileName: file.name,
        fileSize: file.size,
        title: result.title,
        pageCount: result.pageCount,
        totalWords: result.stats.totalWords,
        esgKeywordDensity: result.stats.esgKeywordDensity,
        companies: JSON.stringify(result.esg.companies),
        metrics: JSON.stringify(result.esg.metrics),
        years: JSON.stringify(result.esg.years),
        sections: JSON.stringify(result.sections.map((s: any) => ({ title: s.title, pageStart: s.pageStart, pageEnd: s.pageEnd, category: s.category }))),
        esgCategories: JSON.stringify(result.esg.categories),
        textPreview: result.text.slice(0, 2000),
        rawText: result.text.slice(0, 100000),
      });
    } catch (dbError) {
      console.error('[PDF Parse] DB store failed:', (dbError as Error).message);
    }

    return jsonResponse({
      title: result.title,
      pageCount: result.pageCount,
      stats: result.stats,
      esg: result.esg,
      sections: result.sections.map((s: any) => ({ title: s.title, pageStart: s.pageStart, pageEnd: s.pageEnd, category: s.category, textPreview: s.text.slice(0, 500) })),
      textPreview: result.text.slice(0, 2000),
    });
  } catch (error) {
    console.error('[PDF Parse API] Error:', error);
    return jsonErrorInternal(error, 'INTERNAL_ERROR', 500);
  }
}

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
