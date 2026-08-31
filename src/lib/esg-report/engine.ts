// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
/**
 * ==========================================
 * ESG 合規報告自動生成 - 核心引擎
 * ==========================================
 */

import {
  ReportConfig,
  GeneratedReport,
  ReportSection,
  GRIReport,
  SASBReport,
  TCFDReport,
} from './types';

// ==========================================
// ESG 報告生成引擎
// ==========================================

export class ESGReportEngine {
  private static instance: ESGReportEngine;

  private constructor() {}

  static getInstance(): ESGReportEngine {
    if (!ESGReportEngine.instance) {
      ESGReportEngine.instance = new ESGReportEngine();
    }
    return ESGReportEngine.instance;
  }

  // ==========================================
  // 報告生成
  // ==========================================

  /**
   * 生成合規報告
   */
  async generateReport(
    config: ReportConfig,
    data: Record<string, unknown>
  ): Promise<GeneratedReport> {
    let content: string;

    switch (config.standard) {
      case 'GRI':
        content = await this.generateGRIReport(config, data as unknown as GRIReport);
        break;
      case 'SASB':
        content = await this.generateSASBReport(config, data as unknown as SASBReport);
        break;
      case 'TCFD':
        content = await this.generateTCFDReport(config, data as unknown as TCFDReport);
        break;
      default:
        throw new Error(`Unsupported standard: ${config.standard}`);
    }

    return {
      id: `report-${Date.now()}`,
      standard: config.standard,
      generatedAt: new Date(),
      period: config.period,
      content,
      sections: this.extractSections(content),
      metadata: {
        language: config.language,
        format: config.format,
      },
    };
  }

  // ==========================================
  // GRI 報告生成
  // ==========================================

  private async generateGRIReport(
    config: ReportConfig,
    data: GRIReport
  ): Promise<string> {
    const lines: string[] = [];

    // 標題
    lines.push('═══════════════════════════════════════════════════════════════');
    lines.push('                    GRI 可持續發展報告');
    lines.push('═══════════════════════════════════════════════════════════════');
    lines.push('');

    // 元資料
    if (data.metadata) {
      lines.push('【報告元資料】');
      lines.push(`  報告標題: ${data.metadata.reportTitle}`);
      lines.push(`  報告期間: ${data.metadata.reportingPeriod}`);
      lines.push(`  報告組織: ${data.metadata.reportingOrganization}`);
      lines.push(`  報告日期: ${data.metadata.reportDate}`);
      lines.push(`  報告類型: ${data.metadata.reportType}`);
      lines.push('');
    }

    // 一般披露
    if (data.generalDisclosures) {
      lines.push('═══════════════════════════════════════════════════════════════');
      lines.push('                    一般披露');
      lines.push('═══════════════════════════════════════════════════════════════');
      lines.push('');

      const gd = data.generalDisclosures;

      // 組織概況
      if (gd.organizationalProfile) {
        lines.push('【組織概況】');
        lines.push(`  名稱: ${gd.organizationalProfile.name}`);
        lines.push(`  性質: ${gd.organizationalProfile.nature}`);
        lines.push(`  總部: ${gd.organizationalProfile.headquarters}`);
        lines.push(`  營運國家: ${gd.organizationalProfile.countriesOfOperation.join(', ')}`);
        lines.push(`  所有權結構: ${gd.organizationalProfile.ownershipStructure}`);
        lines.push('');
      }

      // 策略倡議
      if (gd.strategicInitiatives) {
        lines.push('【策略倡議】');
        lines.push(`  策略描述: ${gd.strategicInitiatives.strategyDescription}`);
        lines.push(`  策略優先事項: ${gd.strategicInitiatives.strategicPriority.join(', ')}`);
        lines.push('');
      }

      // 利益相關者參與
      if (gd.stakeholderEngagement) {
        lines.push('【利益相關者參與】');
        lines.push(`  利益相關者羣體: ${gd.stakeholderEngagement.stakeholderGroups.join(', ')}`);
        lines.push(`  參與方法: ${gd.stakeholderEngagement.engagementMethods.join(', ')}`);
        lines.push('');
      }
    }

    // 材料主題
    if (data.materialTopics && data.materialTopics.length > 0) {
      lines.push('═══════════════════════════════════════════════════════════════');
      lines.push('                    材料主題');
      lines.push('═══════════════════════════════════════════════════════════════');
      lines.push('');

      for (const topic of data.materialTopics) {
        lines.push(`【${topic.name}】`);
        lines.push(`  類別: ${topic.category}`);
        lines.push(`  材料性分數: ${topic.materialityScore}`);
        lines.push(`  描述: ${topic.description}`);
        lines.push('');

        if (topic.disclosures && topic.disclosures.length > 0) {
          for (const disclosure of topic.disclosures) {
            lines.push(`  [${disclosure.code}] ${disclosure.title}`);
            lines.push(`    ${disclosure.description}`);
            lines.push(`    數據: ${disclosure.data} ${disclosure.unit || ''}`);
            if (disclosure.notes) {
              lines.push(`    備註: ${disclosure.notes}`);
            }
            lines.push('');
          }
        }
      }
    }

    lines.push('═══════════════════════════════════════════════════════════════');

    return lines.join('\n');
  }

  // ==========================================
  // SASB 報告生成
  // ==========================================

  private async generateSASBReport(
    config: ReportConfig,
    data: SASBReport
  ): Promise<string> {
    const lines: string[] = [];

    lines.push('═══════════════════════════════════════════════════════════════');
    lines.push('                    SASB 可持續發展報告');
    lines.push('═══════════════════════════════════════════════════════════════');
    lines.push('');

    // 元資料
    if (data.metadata) {
      lines.push('【報告元資料】');
      lines.push(`  報告標題: ${data.metadata.reportTitle}`);
      lines.push(`  報告期間: ${data.metadata.reportingPeriod}`);
      lines.push(`  組織名稱: ${data.metadata.organizationName}`);
      lines.push(`  業務分類: ${data.metadata.industryClassification}`);
      lines.push('');
    }

    // 業務資訊
    if (data.industry) {
      lines.push('【業務資訊】');
      lines.push(`  部門: ${data.industry.sector}`);
      lines.push(`  業務羣組: ${data.industry.industryGroup}`);
      lines.push(`  業務: ${data.industry.industry}`);
      lines.push(`  子業務: ${data.industry.subIndustry}`);
      lines.push('');
    }

    // 維度與指標
    if (data.dimensions && data.dimensions.length > 0) {
      lines.push('═══════════════════════════════════════════════════════════════');
      lines.push('                    維度與指標');
      lines.push('═══════════════════════════════════════════════════════════════');
      lines.push('');

      for (const dimension of data.dimensions) {
        lines.push(`【${dimension.name}】`);
        lines.push(`  描述: ${dimension.description}`);
        lines.push('');

        if (dimension.metrics && dimension.metrics.length > 0) {
          lines.push('  指標列表:');
          for (const metric of dimension.metrics) {
            lines.push(`    [${metric.code}] ${metric.name}`);
            lines.push(`      數值: ${metric.value} ${metric.unit}`);
            if (metric.yearOverYearChange !== undefined) {
              const change = metric.yearOverYearChange >= 0 ? `+${metric.yearOverYearChange}%` : `${metric.yearOverYearChange}%`;
              lines.push(`      年度變化: ${change}`);
            }
            lines.push('');
          }
        }
      }
    }

    // 直接指標
    if (data.metrics && data.metrics.length > 0) {
      lines.push('═══════════════════════════════════════════════════════════════');
      lines.push('                    直接指標');
      lines.push('═══════════════════════════════════════════════════════════════');
      lines.push('');

      for (const metric of data.metrics) {
        lines.push(`[${metric.code}] ${metric.name}`);
        lines.push(`  數值: ${metric.value} ${metric.unit}`);
        if (metric.notes) {
          lines.push(`  備註: ${metric.notes}`);
        }
        lines.push('');
      }
    }

    lines.push('═══════════════════════════════════════════════════════════════');

    return lines.join('\n');
  }

  // ==========================================
  // TCFD 報告生成
  // ==========================================

  private async generateTCFDReport(
    config: ReportConfig,
    data: TCFDReport
  ): Promise<string> {
    const lines: string[] = [];

    lines.push('═══════════════════════════════════════════════════════════════');
    lines.push('                    TCFD 氣候相關財務披露報告');
    lines.push('═══════════════════════════════════════════════════════════════');
    lines.push('');

    // 元資料
    if (data.metadata) {
      lines.push('【報告元資料】');
      lines.push(`  報告標題: ${data.metadata.reportTitle}`);
      lines.push(`  報告期間: ${data.metadata.reportingPeriod}`);
      lines.push(`  組織名稱: ${data.metadata.organizationName}`);
      lines.push(`  對齊等級: ${data.metadata.alignmentLevel}`);
      lines.push('');
    }

    // 治理
    if (data.governance) {
      lines.push('═══════════════════════════════════════════════════════════════');
      lines.push('                    一、治理');
      lines.push('═══════════════════════════════════════════════════════════════');
      lines.push('');

      lines.push('【董事會監督】');
      lines.push(`  描述: ${data.governance.boardOversight.description}`);
      lines.push(`  氣候職責: ${data.governance.boardOversight.climateResponsibilities.join(', ')}`);
      lines.push(`  能力要求: ${data.governance.boardOversight.competencies.join(', ')}`);
      lines.push('');

      lines.push('【管理層角色】');
      lines.push(`  描述: ${data.governance.managementRole.description}`);
      lines.push(`  委員會: ${data.governance.managementRole.committees.join(', ')}`);
      lines.push(`  整合方式: ${data.governance.managementRole.integration}`);
      lines.push('');
    }

    // 策略
    if (data.strategy) {
      lines.push('═══════════════════════════════════════════════════════════════');
      lines.push('                    二、策略');
      lines.push('═══════════════════════════════════════════════════════════════');
      lines.push('');

      lines.push('【氣候相關風險與機會】');

      if (data.strategy.climateRisksAndOpportunities.shortTerm.length > 0) {
        lines.push('  短期 (0-3 年):');
        for (const risk of data.strategy.climateRisksAndOpportunities.shortTerm) {
          lines.push(`    - [${risk.type}] ${risk.category}: ${risk.description}`);
          lines.push(`      潛在影響: ${risk.potentialImpact}`);
        }
        lines.push('');
      }

      if (data.strategy.climateRisksAndOpportunities.mediumTerm.length > 0) {
        lines.push('  中期 (3-10 年):');
        for (const risk of data.strategy.climateRisksAndOpportunities.mediumTerm) {
          lines.push(`    - [${risk.type}] ${risk.category}: ${risk.description}`);
          lines.push(`      潛在影響: ${risk.potentialImpact}`);
        }
        lines.push('');
      }

      if (data.strategy.climateRisksAndOpportunities.longTerm.length > 0) {
        lines.push('  長期 (10 年以上):');
        for (const risk of data.strategy.climateRisksAndOpportunities.longTerm) {
          lines.push(`    - [${risk.type}] ${risk.category}: ${risk.description}`);
          lines.push(`      潛在影響: ${risk.potentialImpact}`);
        }
        lines.push('');
      }

      lines.push('【對業務的影響】');
      lines.push(`  描述: ${data.strategy.impactOnBusiness.description}`);
      lines.push(`  財務影響: ${data.strategy.impactOnBusiness.financialImpact}`);
      lines.push(`  策略回應: ${data.strategy.impactOnBusiness.strategicResponse}`);
      lines.push('');

      lines.push('【韌性】');
      lines.push(`  描述: ${data.strategy.resilience.description}`);
      if (data.strategy.resilience.scenarios.length > 0) {
        lines.push('  情景分析:');
        for (const scenario of data.strategy.resilience.scenarios) {
          lines.push(`    - ${scenario.name}: ${scenario.description}`);
          lines.push(`      溫度路徑: ${scenario.temperaturePath}`);
          lines.push(`      假設: ${scenario.assumptions.join(', ')}`);
        }
      }
      lines.push('');
    }

    // 風險管理
    if (data.riskManagement) {
      lines.push('═══════════════════════════════════════════════════════════════');
      lines.push('                    三、風險管理');
      lines.push('═══════════════════════════════════════════════════════════════');
      lines.push('');

      lines.push('【風險管理流程】');
      lines.push(`  描述: ${data.riskManagement.process.description}`);
      lines.push(`  識別流程: ${data.riskManagement.process.identificationProcess}`);
      lines.push(`  評估流程: ${data.riskManagement.process.assessmentProcess}`);
      lines.push(`  優先級流程: ${data.riskManagement.process.prioritizationProcess}`);
      lines.push('');

      lines.push('【風險整合】');
      lines.push(`  描述: ${data.riskManagement.integration.description}`);
      lines.push(`  風險管理流程: ${data.riskManagement.integration.riskManagementProcess}`);
      lines.push(`  策略規劃: ${data.riskManagement.integration.strategicPlanning}`);
      lines.push('');
    }

    // 指標與目標
    if (data.metricsAndTargets) {
      lines.push('═══════════════════════════════════════════════════════════════');
      lines.push('                    四、指標與目標');
      lines.push('═══════════════════════════════════════════════════════════════');
      lines.push('');

      if (data.metricsAndTargets.metrics.length > 0) {
        lines.push('【指標】');
        for (const metric of data.metricsAndTargets.metrics) {
          lines.push(`  [${metric.category}] ${metric.name}`);
          lines.push(`    數值: ${metric.value} ${metric.unit}`);
          if (metric.scope) lines.push(`    範圍: ${metric.scope}`);
          if (metric.method) lines.push(`    方法: ${metric.method}`);
          lines.push('');
        }
      }

      if (data.metricsAndTargets.targets.length > 0) {
        lines.push('【目標】');
        for (const target of data.metricsAndTargets.targets) {
          lines.push(`  ${target.name}`);
          lines.push(`    描述: ${target.description}`);
          lines.push(`    目標年份: ${target.targetYear}`);
          lines.push(`    基線年份: ${target.baselineYear}`);
          lines.push(`    基線數值: ${target.baselineValue} ${target.unit}`);
          lines.push(`    目標數值: ${target.targetValue} ${target.unit}`);
          lines.push(`    進度: ${target.progress}%`);
          lines.push('');
        }
      }
    }

    lines.push('═══════════════════════════════════════════════════════════════');

    return lines.join('\n');
  }

  // ==========================================
  // 輔助方法
  // ==========================================

  private extractSections(content: string): ReportSection[] {
    const sections: ReportSection[] = [];
    const lines = content.split('\n');
    let currentSection: ReportSection | null = null;
    let order = 0;

    for (const line of lines) {
      if (line.startsWith('【') && line.endsWith('】')) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          id: `section-${order}`,
          title: line.replace(/[【】]/g, ''),
          content: '',
          order: order++,
        };
      } else if (currentSection) {
        currentSection.content += line + '\n';
      }
    }

    if (currentSection) {
      sections.push(currentSection);
    }

    return sections;
  }
}

// ==========================================
// 匯出單例
// ==========================================

export const esgReportEngine = ESGReportEngine.getInstance();
