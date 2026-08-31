/**
 * POST /api/evidence/parse — 單據解析 API
 */

import { NextRequest } from 'next/server';
import { jsonResponse, jsonError, jsonErrorInternal } from '@lib/api-utils';

export const dynamic = 'force-dynamic';

// ── Types ─────────────────────────────────────────────────────

interface ParseBody {
  documentId?: string;
  content?: string;
  type?: 'receipt' | 'invoice' | 'certificate' | 'report';
}

interface ParsedEvidence {
  id: string;
  type: string;
  extractedAt: number;
  fields: Record<string, string>;
  tags: string[];
  summary: string;
  confidence: number;
}

// ── Mock Data (for demo) ──────────────────────────────────────

const MOCK_EVIDENCES: Record<string, ParsedEvidence> = {
  default: {
    id: 'EVD-default',
    type: 'receipt',
    extractedAt: Date.now(),
    fields: {
      date: '2025-06-15',
      vendor: '臺灣電力公司',
      amount: '125,000',
      category: '電費',
      period: '2025年5月',
    },
    tags: ['電費', '能源', '碳排放'],
    summary: '2025年5月電費單據，金額125,000元，可作為Scope 2碳排放計算依據。',
    confidence: 0.92,
  },
};

// ── Helper Functions ──────────────────────────────────────────

function generateId(): string {
  return `EVD-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

function generateTags(type: string, fields: Record<string, string>): string[] {
  const tags: string[] = [];
  
  if (type === 'receipt' || type === 'invoice') {
    tags.push('單據');
    if (fields.category) tags.push(fields.category);
    if (fields.vendor) tags.push(fields.vendor);
  } else if (type === 'certificate') {
    tags.push('認證');
    tags.push('證書');
  } else if (type === 'report') {
    tags.push('報告');
  }
  
  return tags;
}

function generateSummary(type: string, fields: Record<string, string>): string {
  const date = fields.date || '未知日期';
  const vendor = fields.vendor || '未知供應商';
  const amount = fields.amount || '未知金額';
  const category = fields.category || '未知類別';
  
  return `${date} ${vendor} ${category}單據，金額${amount}。`;
}

// ── POST Handler ──────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ParseBody;

    // Use provided data or mock
    const type = body.type || 'receipt';
    const fields = body.content 
      ? { content: body.content }
      : MOCK_EVIDENCES.default.fields;

    const result: ParsedEvidence = {
      id: body.documentId || generateId(),
      type,
      extractedAt: Date.now(),
      fields,
      tags: generateTags(type, fields),
      summary: generateSummary(type, fields),
      confidence: 0.85 + Math.random() * 0.15,
    };

    return jsonResponse({
      success: true,
      data: result,
    });
  } catch (error) {
    return jsonErrorInternal(error);
  }
}

// ── GET Handler ───────────────────────────────────────────────

export async function GET() {
  return jsonResponse({
    service: 'Evidence Parser',
    version: '1.0.0',
    supportedTypes: ['receipt', 'invoice', 'certificate', 'report'],
  });
}
