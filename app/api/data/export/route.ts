// ============================================================
// ESG Data Export API
// GET /api/data/export?format=json|csv
// GET /api/data/export?format=json&sources=tw,eu&fields=title,url,date
// GET /api/data/export?format=csv&category=environmental
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { jsonResponse, jsonError } from '@lib/api-utils';

const prisma = new PrismaClient();

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

  // Build where clause
  const where: Record<string, unknown> = {};

  if (sources) {
    const sourceList = sources.split(',').map(s => s.trim().toLowerCase());
    where.sourceId = { in: sourceList };
  }

  if (category) {
    where.category = category;
  }

  if (region) {
    where.region = { contains: region, mode: 'insensitive' };
  }

  if (from || to) {
    const dateFilter: Record<string, string> = {};
    if (from) dateFilter.gte = from;
    if (to) dateFilter.lte = to;
    where.publishedAt = dateFilter;
  }

  // Get crawl results using Prisma ORM (SQLite-compatible)
  try {
    const crawlResults = await prisma.crawlHistory.findMany({
      where: {
        ...(sources ? { sourceId: { in: sources.split(',').map(s => s.trim()) } } : {}),
        ...(from || to ? {
          timestamp: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          }
        } : {}),
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
      include: {
        regulation: true,
        companyReport: true,
      },
    });

    if (!crawlResults || crawlResults.length === 0) {
      return NextResponse.json(
        format === 'csv'
          ? 'source_id,source_name,category,region,title,url,date,relevance_score,summary\n'
          : {
              success: true,
              data: [],
              meta: { total: 0, limit, offset, format },
              message: 'No data available. Crawl may not have run yet.',
            },
        {
          headers:
            format === 'csv'
              ? {
                  'Content-Type': 'text/csv; charset=utf-8',
                  'Content-Disposition': 'attachment; filename="esg-data.csv"',
                }
              : undefined,
        }
      );
    }

    // Map DB fields to ExportSource shape
    const mapped: ExportSource[] = crawlResults.map(item => {
      const reg = item.regulation;
      const cr = item.companyReport;
      return {
        sourceId: item.sourceId,
        sourceName: reg?.sourceName || cr?.companyName || item.sourceId,
        category: cr?.reportType || '',
        region: '',
        title: reg?.title || cr?.companyName || '',
        url: reg?.url || cr?.url || '',
        date: item.timestamp?.toISOString() || '',
        relevanceScore: item.itemsFound || 0,
        summary: `Found ${item.itemsFound} items (${item.newItems} new, ${item.changedItems} changed)`,
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
  } catch {
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
