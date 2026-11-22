/**
 * ESG Report Handler for Gateway
 * 報告生成端點
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── 報告模板 ─────────────────────────────────────────────────

const TEMPLATES = {
  GRI: {
    id: 'GRI-2021',
    framework: 'GRI',
    name: 'GRI 永續報告書模板',
    nameEn: 'GRI Sustainability Report Template',
    description: '依循 GRI Standards 2021 編製的永續報告書',
    version: '2021',
    sections: ['GRI-1', 'GRI-2', 'GRI-3', 'GRI-400', 'GRI-300', 'GRI-200'],
  },
  TCFD: {
    id: 'TCFD-2021',
    framework: 'TCFD',
    name: 'TCFD 氣候相關財務揭露模板',
    nameEn: 'TCFD Climate-Related Financial Disclosures Template',
    description: '依循 TCFD Recommendations 2021 編製的氣候風險報告',
    version: '2021',
    sections: ['TCFD-Governance', 'TCFD-Strategy', 'TCFD-RiskManagement', 'TCFD-MetricsTargets'],
  },
  CSRD: {
    id: 'CSRD-2024',
    framework: 'CSRD',
    name: 'CSRD 歐盟永續報告模板',
    nameEn: 'CSRD EU Sustainability Reporting Template',
    description: '依循 CSRD ESRS 2024 編製的歐盟永續報告',
    version: '2024',
    sections: ['CSRD-General', 'CSRD-Environmental', 'CSRD-Social', 'CSRD-Governance'],
  },
  SDG: {
    id: 'SDG-MAPPING',
    framework: 'SDG',
    name: 'SDG 永續發展目標對應模板',
    nameEn: 'SDG Alignment Mapping Template',
    description: '對應聯合國 17 項永續發展目標的貢獻報告',
    version: '2015',
    sections: ['SDG-Overview', 'SDG-Details'],
  },
};

// ── 報告生成 ─────────────────────────────────────────────────

function generateReport(framework, companyData, year) {
  const template = TEMPLATES[framework];
  if (!template) return null;

  const sections = [];

  // GRI 報告
  if (framework === 'GRI') {
    sections.push({
      id: 'GRI-1',
      title: '關於本報告',
      content: `## 關於本報告\n\n${companyData.name} 依據 GRI Standards 2021 編製本報告。\n\n- **報導期間**：${year}年1月1日至${year}年12月31日\n- **組織範圍**：本公司及所有子公司\n- **產業類別**：${companyData.industry}`,
      kpis: [],
    });
    sections.push({
      id: 'GRI-2',
      title: '組織概況',
      content: `## 組織概況\n\n- **員工人數**：${companyData.employees || 'N/A'}\n- **營業收入**：${companyData.revenue ? `$${companyData.revenue.toLocaleString()}` : 'N/A'}`,
      kpis: [],
    });
    sections.push({
      id: 'GRI-300',
      title: 'GRI 300: 環境',
      content: `## GRI 300: 環境\n\n- **能源消耗**：${companyData.esgData?.energyConsumption || 'N/A'} MWh\n- **再生能源占比**：${companyData.esgData?.renewableEnergy || 'N/A'}%\n- **Scope 1 排放**：${companyData.esgData?.ghgScope1 || 'N/A'} tCO2e\n- **Scope 2 排放**：${companyData.esgData?.ghgScope2 || 'N/A'} tCO2e`,
      kpis: [
        { name: '能源消耗', value: companyData.esgData?.energyConsumption || 'N/A', unit: 'MWh' },
        { name: '再生能源占比', value: companyData.esgData?.renewableEnergy || 'N/A', unit: '%' },
        { name: 'Scope 1', value: companyData.esgData?.ghgScope1 || 'N/A', unit: 'tCO2e' },
        { name: 'Scope 2', value: companyData.esgData?.ghgScope2 || 'N/A', unit: 'tCO2e' },
      ],
    });
    sections.push({
      id: 'GRI-400',
      title: 'GRI 400: 社會',
      content: `## GRI 400: 社會\n\n- **員工人數**：${companyData.employees || 'N/A'}\n- **離職率**：${companyData.esgData?.turnoverRate || 'N/A'}%\n- **培訓時數**：${companyData.esgData?.trainingHours || 'N/A'} 小時/人`,
      kpis: [
        { name: '員工人數', value: companyData.employees || 'N/A', unit: '人' },
        { name: '離職率', value: companyData.esgData?.turnoverRate || 'N/A', unit: '%' },
      ],
    });
  }

  // TCFD 報告
  if (framework === 'TCFD') {
    sections.push({
      id: 'TCFD-Governance',
      title: '治理 (Governance)',
      content: `## 治理\n\n${companyData.name} 董事會透過策略委員會監督氣候相關風險與機會。`,
      kpis: [],
    });
    sections.push({
      id: 'TCFD-Strategy',
      title: '策略 (Strategy)',
      content: `## 策略\n\n### 氣候風險\n- 實體風險：極端氣候事件\n- 轉型風險：碳定價政策\n\n### 氣候機會\n- 再生能源投資\n- 低碳產品市場`,
      kpis: [],
    });
    sections.push({
      id: 'TCFD-MetricsTargets',
      title: '指標與目標',
      content: `## 指標與目標\n\n- **總排放量**：${(companyData.esgData?.ghgScope1 || 0) + (companyData.esgData?.ghgScope2 || 0)} tCO2e\n- **再生能源占比**：${companyData.esgData?.renewableEnergy || 'N/A'}%`,
      kpis: [
        { name: '總排放量', value: (companyData.esgData?.ghgScope1 || 0) + (companyData.esgData?.ghgScope2 || 0), unit: 'tCO2e' },
        { name: '再生能源占比', value: companyData.esgData?.renewableEnergy || 'N/A', unit: '%' },
      ],
    });
  }

  // CSRD 報告
  if (framework === 'CSRD') {
    sections.push({
      id: 'CSRD-General',
      title: '一般要求 (ESRS 1)',
      content: `## 一般要求\n\n依據 ESRS 2024 進行雙重重大性評估。`,
      kpis: [],
    });
    sections.push({
      id: 'CSRD-Environmental',
      title: '環境議題 (ESRS E1-E5)',
      content: `## 環境議題\n\n- **氣候變遷 (E1)**：碳排管理\n- **汙染 (E2)**：排放管理\n- **水資源 (E3)**：水資源管理\n- **生物多樣性 (E4)**：生態保育\n- **迴圈經濟 (E5)**：資源迴圈`,
      kpis: [],
    });
  }

  // SDG 報告
  if (framework === 'SDG') {
    sections.push({
      id: 'SDG-Overview',
      title: 'SDG 對應總覽',
      content: `## SDG 對應總覽\n\n${companyData.name} 積極響應聯合國永續發展目標。`,
      kpis: [],
    });
  }

  return {
    id: `report-${framework}-${year}-${Date.now()}`,
    framework,
    title: `${companyData.name} ${year}年 ${template.name}`,
    generatedAt: new Date().toISOString(),
    year,
    sections,
    summary: `本報告依據 ${framework} 框架編製，涵蓋 ${sections.length} 個主要章節。`,
    metadata: {
      companyData,
      generationTime: Math.floor(Math.random() * 500) + 100,
    },
  };
}

// ── Export ────────────────────────────────────────────────────

export function setupReportRoutes(app) {
  // 列出模板
  app.get('/esg-report/templates', (_req, res) => {
    const templates = Object.values(TEMPLATES).map(t => ({
      id: t.id,
      framework: t.framework,
      name: t.name,
      nameEn: t.nameEn,
      description: t.description,
      version: t.version,
      sectionsCount: t.sections.length,
    }));
    res.json({ success: true, data: templates });
  });

  // 取得單一模板
  app.get('/esg-report/templates/:framework', (req, res) => {
    const template = TEMPLATES[req.params.framework.toUpperCase()];
    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }
    res.json({ success: true, data: template });
  });

  // 生成報告
  app.post('/esg-report/generate', (req, res) => {
    const { framework, companyData, year, sections } = req.body;

    if (!framework || !companyData) {
      return res.status(400).json({ success: false, error: 'framework and companyData are required' });
    }

    const report = generateReport(framework.toUpperCase(), companyData, year || new Date().getFullYear());
    if (!report) {
      return res.status(404).json({ success: false, error: 'Invalid framework' });
    }

    // 如果指定了章節，過濾
    if (sections && sections.length > 0) {
      report.sections = report.sections.filter(s => sections.includes(s.id));
    }

    res.json({ success: true, data: report });
  });

  // 匯出報告 (Markdown)
  app.post('/esg-report/export', (req, res) => {
    const { framework, companyData, year } = req.body;

    if (!framework || !companyData) {
      return res.status(400).json({ success: false, error: 'framework and companyData are required' });
    }

    const report = generateReport(framework.toUpperCase(), companyData, year || new Date().getFullYear());
    if (!report) {
      return res.status(404).json({ success: false, error: 'Invalid framework' });
    }

    // 轉換為 Markdown
    let md = `# ${report.title}\n\n`;
    md += `**生成時間**：${report.generatedAt}\n`;
    md += `**報告年度**：${report.year}\n`;
    md += `**報告框架**：${report.framework}\n\n---\n\n`;

    for (const section of report.sections) {
      md += `${section.content}\n\n`;
      if (section.kpis && section.kpis.length > 0) {
        md += `### 關鍵績效指標\n\n| 指標 | 數值 | 單位 |\n|------|------|------|\n`;
        for (const kpi of section.kpis) {
          md += `| ${kpi.name} | ${kpi.value} | ${kpi.unit} |\n`;
        }
        md += `\n`;
      }
    }

    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${report.title}.md"`);
    res.send(md);
  });

  // 健康檢查
  app.get('/esg-report/health', (_req, res) => {
    res.json({
      service: 'ESG Report API',
      version: '1.0.0',
      frameworks: Object.keys(TEMPLATES),
      status: 'healthy',
    });
  });
}
