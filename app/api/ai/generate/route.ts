// ============================================================
// AI Report Generation API
// POST /api/ai/generate
// GET  /api/ai/generate (usage info)
//
// 最佳實踐: 使用 @esggo/errors 統一錯誤回應
// ============================================================

import { NextRequest } from 'next/server';
import { generateAIReport, ReportRequest, ReportSection } from '../../../../src/core/ai/report-generator';
import { jsonResponse, jsonError, validateParams, jsonErrorInternal } from '@lib/api-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;  // 2 min timeout

const VALID_SECTIONS: ReportSection[] = [
  'executive_summary', 'climate_strategy', 'carbon_roadmap',
  'social_impact', 'governance', 'risk_assessment',
  'opportunities', 'kpi_dashboard', 'stakeholder_engagement',
  'supply_chain',
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyName, industry, year, sections, language, data } = body as ReportRequest;

    // Validate required fields using unified validator
    const paramValidation = validateParams({ companyName, industry });
    if (!paramValidation.valid) {
      return jsonError('INVALID_PARAMS', `缺少必要參數: ${paramValidation.missing}`);
    }

    // Validate sections
    const requestedSections: ReportSection[] = sections || [
      'executive_summary', 'climate_strategy', 'carbon_roadmap',
      'social_impact', 'governance',
    ];

    for (const s of requestedSections) {
      if (!VALID_SECTIONS.includes(s)) {
        return jsonError('INVALID_PARAMS', `無效的章節: ${s}。有效值: ${VALID_SECTIONS.join(', ')}`);
      }
    }

    // Generate report
    const result = await generateAIReport({
      companyName,
      industry,
      year: year || '2024',
      sections: requestedSections,
      language: language || 'zh-TW',
      data,
    });

    if (!result.success) {
      return jsonError('INTERNAL_ERROR', result.error || '報告生成失敗');
    }

    return jsonResponse({
      reportId: null,
      companyName,
      sections: result.sections.map(s => ({
        id: s.id,
        title: s.title,
        content: s.content,
        wordCount: s.wordCount,
        model: s.model,
        duration: s.duration,
      })),
      metadata: result.metadata,
    });
  } catch (error) {
    console.error('[AI Report API] Error:', error);
    return jsonErrorInternal(error);
  }
}

export async function GET() {
  return jsonResponse({
    usage: 'POST JSON with { companyName, industry, year?, sections?, language?, data? }',
    sections: VALID_SECTIONS,
    models: 'OpenRouter :free tier (round-robin: Gemma, Llama, Qwen)',
    rateLimit: '200 req/day (OpenRouter free tier)',
    content: 'Report data is generated progressively. Returns when all sections complete.',
  });
}
