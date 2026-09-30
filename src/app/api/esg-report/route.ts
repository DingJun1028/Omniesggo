// ═══════════════════════════════════════════════════════════════
// ESGGO ESG Report API
// 報告生成 REST API
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { generateESGReport, exportReportAsMarkdown } from '@/core/ai/skills/report-generator';
import { getAllTemplates, getTemplate } from '@/core/ai/skills/report-templates';
import type { ReportFramework, ReportLanguage } from '@/core/ai/skills/report-templates';
import { ERROR_CODES } from '@esggo/errors';

interface ReportRequestBody {
  action: 'list_templates' | 'get_template' | 'generate' | 'export';
  framework?: ReportFramework;
  language?: ReportLanguage;
  year?: number;
  companyData?: {
    name: string;
    industry: string;
    size: 'small' | 'medium' | 'large';
    employees?: number;
    revenue?: number;
    location?: string;
    esgData?: {
      energyConsumption?: number;
      renewableEnergy?: number;
      ghgScope1?: number;
      ghgScope2?: number;
      ghgScope3?: number;
      waterWithdrawal?: number;
      wasteGenerated?: number;
      recyclingRate?: number;
      turnoverRate?: number;
      trainingHours?: number;
      workplaceInjuries?: number;
    };
  };
  sections?: string[];
  reportId?: string;
}

// POST /api/esg-report
export async function POST(request: NextRequest) {
  try {
    const body: ReportRequestBody = await request.json();
    const { action } = body;

    switch (action) {
      case 'list_templates': {
        const templates = getAllTemplates().map(t => ({
          id: t.id,
          framework: t.framework,
          name: t.name,
          nameEn: t.nameEn,
          description: t.description,
          version: t.version,
          sectionsCount: t.sections.length,
        }));
        return NextResponse.json({ success: true, data: templates });
      }

      case 'get_template': {
        if (!body.framework) {
          return NextResponse.json({ success: false, error: 'framework is required' }, { status: 400 });
        }
        const template = getTemplate(body.framework);
        if (!template) {
          return NextResponse.json({ success: false, error: 'Template not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: template });
      }

      case 'generate': {
        if (!body.framework || !body.companyData) {
          return NextResponse.json(
            { success: false, error: 'framework and companyData are required' },
            { status: 400 }
          );
        }

        const report = await generateESGReport({
          framework: body.framework,
          language: body.language || 'zh-TW',
          companyData: body.companyData,
          year: body.year || new Date().getFullYear(),
          sections: body.sections,
        });

        return NextResponse.json({ success: true, data: report });
      }

      case 'export': {
        if (!body.framework || !body.companyData) {
          return NextResponse.json(
            { success: false, error: 'framework and companyData are required' },
            { status: 400 }
          );
        }

        const exportReport = await generateESGReport({
          framework: body.framework,
          language: body.language || 'zh-TW',
          companyData: body.companyData,
          year: body.year || new Date().getFullYear(),
          sections: body.sections,
        });

        const markdown = exportReportAsMarkdown(exportReport);

        return new NextResponse(markdown, {
          headers: {
            'Content-Type': 'text/markdown; charset=utf-8',
            'Content-Disposition': `attachment; filename="${exportReport.title}.md"`,
          },
        });
      }

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('[ESG Report API] Error:', error);
    return NextResponse.json(
      { success: false, error: ERROR_CODES.INTERNAL_ERROR.message, code: ERROR_CODES.INTERNAL_ERROR.code },
      { status: 500 }
    );
  }
}

// GET /api/esg-report - 健康檢查
export async function GET() {
  return NextResponse.json({
    service: 'ESG Report API',
    version: '1.0.0',
    frameworks: ['GRI', 'TCFD', 'CSRD', 'SDG'],
    status: 'healthy',
  });
}
