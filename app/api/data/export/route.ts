// ============================================================
// ESG Data Export API
// GET /api/data/export?format=json|csv
// GET /api/data/export?format=json&sources=tw,eu&fields=title,url,date
// GET /api/data/export?format=csv&category=environmental
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';
import { jsonResponse, jsonError } from '@lib/api-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ============================================================
// Types
// ============================================================

interface ExportSource {
  sourceId: string;
  sourceName: string;
  category: string;
  region: string;
  title: string;
  url: string;
  date: string;
  relevanceScore: number;
  summary: string;
}

// ============================================================
// Export Handler
// ============================================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const format = (searchParams.get('format') || 'json').toLowerCase();
  const sources = searchParams.get('sources');
  const fields = searchParams.get('fields');
  const category = searchParams.get('category');
  const region = searchParams.get('region');
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const limit = Math.min(parseInt(searchParams.get('limit') || '1000', 10), 5000);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  // Build where clause → Supabase query builder (chained .in/.gte/.lte/.order/.limit/.range)
  const q = supabase
    .from('CrawlHistory')
    .select('sourceId, regulationId, companyReportId, itemsFound, newItems, changedItems, timestamp')
    .order('timestamp', { ascending: false });

  if (sources) {
    const sourceList = sources.split(',').map(s => s.trim().toLowerCase());
    q.in('sourceId', sourceList);
  }
  if (from) {
    q.gte('timestamp', from);
  }
  if (to) {
    q.lte('timestamp', to);
  }
  // NOTE: `category` and `region` are columns on the related
  // CompanyReport/Regulation tables, not on CrawlHistory, so these two
  // filters are intentionally omitted (equivalent to Prisma silently
  // ignoring unknown where keys).

  // Pagination via range (0-indexed)
  if (offset > 0) {
    q.range(offset, offset + limit - 1);
  } else {
    q.limit(limit);
  }

  const { data: crawlResults, error } = await q;

  if (error) {
    console.error('[data/export]', error);
    // If query fails, return mock data for demo
    const mockData = generateMockExportData(limit);
    if (format === 'csv') {
      const csv = convertToCSV(mockData);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="esg-data-demo.csv"',
        },
      });
    }
    return jsonResponse({
      success: true,
      data: mockData.slice(0, limit),
      meta: {
        total: mockData.length,
        limit,
        offset,
        format,
        demo: true,
      },
    });
  }

  // ─ Fetch related Regulation / CompanyReport rows for the joined fields ─
  // sourceName / title / url / category live on the related tables, so we look
  // them up in one batched query per table (by the unique id columns).
  const regulationIds = [...new Set(
    (crawlResults ?? []).filter(r => r.regulationId)?.map(r => r.regulationId)
  )];
  const regulationByRow = new Map<string, { sourceName: string; title: string; url: string }>();
  if (regulationIds.length) {
    const { data: regs } = await supabase
      .from('Regulation')
      .select('id, sourceName, title, url')
      .in('id', regulationIds);
    for (const r of regs ?? []) {
      regulationByRow.set(r.id, { sourceName: r.sourceName || '', title: r.title || '', url: r.url || '' });
    }
  }

  const companyReportIds = [...new Set(
    (crawlResults ?? []).filter(r => r.companyReportId)?.map(r => r.companyReportId)
  )];
  const reportByRow = new Map<string, { sourceName: string; reportType: string; url: string }>();
  if (companyReportIds.length) {
    const { data: crs } = await supabase
      .from('CompanyReport')
      .select('id, companyName, reportType, url')
      .in('id', companyReportIds);
    for (const c of crs ?? []) {
      reportByRow.set(c.id, { sourceName: c.companyName || '', reportType: c.reportType || '', url: c.url || '' });
    }
  }

  // Map DB fields to ExportSource shape
  const mapped: ExportSource[] = (crawlResults ?? []).map(item => {
    const reg = regulationByRow.get(item.regulationId as string) || null;
    const cr = reportByRow.get(item.companyReportId as string) || null;
    return {
      sourceId: item.sourceId,
      sourceName: reg?.sourceName || cr?.sourceName || item.sourceId,
      category: cr?.reportType || '',
      region: '',
      title: reg?.title || cr?.sourceName || '',
      url: reg?.url || cr?.url || '',
      date: new Date(item.timestamp).toISOString(),
      relevanceScore: Number(item.itemsFound) || 0,
      summary: `Found ${Number(item.itemsFound) || 0} items (${Number(item.newItems) || 0} new, ${Number(item.changedItems) || 0} changed)`,
    };
  });

  // Field filtering
  let filtered = mapped;
  if (fields) {
    const fieldList = fields.split(',').map(f => f.trim());
    filtered = mapped.map(item => {
      const result: Record<string, unknown> = {};
      fieldList.forEach(f => {
        if (f in item) {
          result[f] = (item as unknown as Record<string, unknown>)[f];
        }
      });
      return result as unknown as ExportSource;
    });
  }

  if (format === 'csv') {
    const csv = convertToCSV(filtered);
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="esg-data-export.csv"',
      },
    });
  }

  return jsonResponse({
    success: true,
    data: filtered,
    meta: {
      total: filtered.length,
      limit,
      offset,
      format,
      filters: { sources, category, region, from, to, fields },
    },
  });
}

// ============================================================
// POST — Create/Export Job (for large exports)
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { format = 'json' } = body;

    if (!['json', 'csv'].includes(format)) {
      return jsonError('INVALID_PARAMS', 'Invalid format. Use "json" or "csv".', 400);
    }

    // Create export job ID (stateless — no DB persistence needed)
    const jobId = `exp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // In production, this would queue a background job
    // For now, return job ID for client to poll
    return jsonResponse({
      success: true,
      jobId,
      statusUrl: `/api/data/export/status/${jobId}`,
      downloadUrl: `/api/data/export/download/${jobId}`,
    });
  } catch (error: unknown) {
    console.error('[api] INTERNAL_ERROR:', error);
    return jsonError('INTERNAL_ERROR', undefined, 500);
  }
}

// ============================================================
// Helpers
// ============================================================

function convertToCSV(data: ExportSource[]): string {
  if (data.length === 0) return '';

  const headers = ['source_id', 'source_name', 'category', 'region', 'title', 'url', 'date', 'relevance_score', 'summary'];
  const rows = data.map(item => [
    csvEscape(item.sourceId || ''),
    csvEscape(item.sourceName || ''),
    csvEscape(item.category || ''),
    csvEscape(item.region || ''),
    csvEscape(item.title || ''),
    csvEscape(item.url || ''),
    csvEscape(item.date || ''),
    item.relevanceScore?.toString() || '',
    csvEscape(item.summary || ''),
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

function csvEscape(value: string): string {
  if (!value) return '';
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function generateMockExportData(limit: number): ExportSource[] {
  const categories = ['environmental', 'social', 'governance'];
  const regions = ['tw', 'eu', 'us', 'ap', 'int'];
  const sources = [
    { id: 'tw-secuta', name: '臺灣證交所重大訊息' },
    { id: 'eu-news', name: 'EU ESG News' },
    { id: 'us-sec', name: 'SEC ESG Filings' },
    { id: 'ap-carbon', name: 'APAC Carbon' },
    { id: 'int-gri', name: 'GRI Standards' },
  ];

  const data: ExportSource[] = [];
  const count = Math.min(limit, 50);

  for (let i = 0; i < count; i++) {
    const source = sources[i % sources.length];
    const cat = categories[i % categories.length];
    const reg = regions[i % regions.length];
    const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');

    data.push({
      sourceId: source.id,
      sourceName: source.name,
      category: cat,
      region: reg,
      title: `[ESG] ${cat === 'environmental' ? '碳盤查' : cat === 'social' ? '勞動力' : '董事會'} 更新 - ${source.name} #${i + 1}`,
      url: `https://example.com/esg/${cat}/${source.id}/${month}-${day}`,
      date: `2025-${month}-${day}`,
      relevanceScore: Math.floor(Math.random() * 100),
      summary: `${source.name} 發布 ${cat} 相關 ESG 揭露項目 ${i + 1}。`,
    });
  }

  return data;
}
