// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
/**
 * ==========================================
 * ESG 資料分析引擎 - 核心引擎
 * ==========================================
 *
 * 根據環境 / 社會 / 治理三大維度指標，計算 ESG 分數、
 * 產生洞察、改善建議、產業基準與趨勢，並生成分析報告。
 */

import { randomUUID } from 'crypto';
import {
  EnvironmentalMetrics,
  SocialMetrics,
  GovernanceMetrics,
  ESGAnalysisResult,
  ESGScores,
  ScoreBreakdown,
  ESGInsight,
  ESGRecommendation,
  ESGBenchmark,
  ESGTrend,
  ESGDataPoint,
  ESGCategory,
} from './types';

// ==========================================
// 分數輔助函數
// ==========================================

/**
 * 將 0-100 分數對應到等級
 */
function scoreToRank(score: number): ScoreBreakdown['rank'] {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B+';
  if (score >= 60) return 'B';
  if (score >= 50) return 'C+';
  if (score >= 40) return 'C';
  if (score >= 30) return 'D';
  return 'F';
}

/**
 * 將任意數值夾在 [min, max] 範圍內
 */
function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * 平均一組數值
 */
function average(values: number[]): number {
  const finite = values.filter((v) => Number.isFinite(v));
  if (finite.length === 0) return 0;
  return finite.reduce((sum, v) => sum + v, 0) / finite.length;
}

// ==========================================
// 維度分數計算
// ==========================================

function calculateEnvironmentalScore(env: EnvironmentalMetrics): number {
  const parts: number[] = [
    env.energyConsumption.renewableRatio,
    env.wasteManagement.recyclingRate,
    env.waterUsage.efficiency,
    env.carbonEmissions.reductionProgress ?? 50,
    env.biodiversityImpact.netPositive ? 100 : 50,
    env.biodiversityImpact.score,
  ];
  return clamp(Math.round(average(parts)));
}

function calculateSocialScore(social: SocialMetrics): number {
  const parts: number[] = [
    social.workforce.satisfactionScore,
    social.diversity.payEquityRatio * 100,
    clamp(100 - social.healthSafety.incidentRate * 10),
    social.humanRights.supplierAuditRate,
    clamp(100 - social.workforce.turnoverRate * 2),
    clamp(100 - social.healthSafety.fatalityCount * 20),
  ];
  return clamp(Math.round(average(parts)));
}

function calculateGovernanceScore(gov: GovernanceMetrics): number {
  const booleanScore = (
    (gov.riskManagement.esgRiskAssessment ? 100 : 0) +
    (gov.riskManagement.climateRiskAssessment ? 100 : 0) +
    (gov.riskManagement.businessContinuityPlan ? 100 : 0)
  ) / 3;

  const parts: number[] = [
    gov.boardComposition.independentDirectors,
    gov.boardComposition.femaleDirectors,
    gov.ethics.trainingCompletionRate,
    gov.transparency.disclosureScore,
    gov.riskManagement.cyberSecurityScore,
    booleanScore,
  ];
  return clamp(Math.round(average(parts)));
}

// ==========================================
// 洞察與建議生成
// ==========================================

function buildInsights(
  envScore: number,
  socialScore: number,
  govScore: number
): ESGInsight[] {
  const insights: ESGInsight[] = [];
  const categories: Array<{ cat: ESGCategory; score: number; label: string }> = [
    { cat: 'environmental', score: envScore, label: '環境' },
    { cat: 'social', score: socialScore, label: '社會' },
    { cat: 'governance', score: govScore, label: '治理' },
  ];

  for (const { cat, score, label } of categories) {
    if (score >= 80) {
      insights.push({
        id: `insight-${cat}-positive`,
        category: cat,
        type: 'positive',
        title: `${label}表現優異`,
        description: `${label}維度得分達 ${score} 分，優於一般水準。`,
        impact: 'low',
        dataPoints: [`${label}分數:${score}`],
      });
    } else if (score < 60) {
      insights.push({
        id: `insight-${cat}-warning`,
        category: cat,
        type: 'warning',
        title: `${label}表現待加強`,
        description: `${label}維度得分僅 ${score} 分，低於合格門檻，建議優先改善。`,
        impact: 'high',
        dataPoints: [`${label}分數:${score}`],
      });
    } else {
      insights.push({
        id: `insight-${cat}-neutral`,
        category: cat,
        type: 'neutral',
        title: `${label}表現持平`,
        description: `${label}維度得分 ${score} 分，維持在合格區間。`,
        impact: 'medium',
        dataPoints: [`${label}分數:${score}`],
      });
    }
  }

  return insights;
}

function buildRecommendations(
  envScore: number,
  socialScore: number,
  govScore: number
): ESGRecommendation[] {
  const recommendations: ESGRecommendation[] = [];
  const entries: Array<{ cat: ESGCategory; score: number; label: string; title: string }> = [
    { cat: 'environmental', score: envScore, label: '環境', title: '提升環境績效' },
    { cat: 'social', score: socialScore, label: '社會', title: '強化社會影響力' },
    { cat: 'governance', score: govScore, label: '治理', title: '優化公司治理' },
  ];

  for (const { cat, score, label, title } of entries) {
    const priority: ESGRecommendation['priority'] =
      score < 60 ? 'high' : score < 75 ? 'medium' : 'low';

    recommendations.push({
      id: `rec-${cat}`,
      category: cat,
      priority,
      title,
      description: `針對${label}維度（當前 ${score} 分）制定改善路線圖，設定可量測目標。`,
      expectedImpact: `預期提升${label}分數 10-20 分`,
      implementationCost: score < 60 ? 'high' : 'medium',
      timeframe: score < 60 ? 'short' : 'medium',
    });
  }

  return recommendations;
}

function buildBenchmarks(
  env: EnvironmentalMetrics,
  social: SocialMetrics,
  gov: GovernanceMetrics
): ESGBenchmark[] {
  return [
    {
      category: 'environmental',
      metric: '碳排放總量 (tCO2e)',
      value: env.carbonEmissions.total,
      industryAverage: 1500,
      industryBest: 500,
      unit: 'tCO2e',
    },
    {
      category: 'environmental',
      metric: '可再生能源比例 (%)',
      value: env.energyConsumption.renewableRatio,
      industryAverage: 35,
      industryBest: 100,
      unit: '%',
    },
    {
      category: 'social',
      metric: '員工滿意度 (/100)',
      value: social.workforce.satisfactionScore,
      industryAverage: 70,
      industryBest: 95,
      unit: '/100',
    },
    {
      category: 'social',
      metric: '性別多元性-女性 (%)',
      value: social.diversity.genderDiversity.female,
      industryAverage: 40,
      industryBest: 55,
      unit: '%',
    },
    {
      category: 'governance',
      metric: '獨立董事比例 (%)',
      value: gov.boardComposition.independentDirectors,
      industryAverage: 60,
      industryBest: 90,
      unit: '%',
    },
    {
      category: 'governance',
      metric: '資訊披露分數 (/100)',
      value: gov.transparency.disclosureScore,
      industryAverage: 65,
      industryBest: 95,
      unit: '/100',
    },
  ];
}

function buildTrends(
  env: EnvironmentalMetrics,
  social: SocialMetrics,
  gov: GovernanceMetrics
): ESGTrend[] {
  const carbonChange = env.carbonEmissions.reductionProgress != null
    ? -env.carbonEmissions.reductionProgress / 2
    : 0;
  const disclosureChange = gov.transparency.disclosureScore - 65;

  return [
    {
      category: 'environmental',
      metric: '碳排放強度',
      direction: carbonChange < 0 ? 'improving' : 'stable',
      changeRate: Number(carbonChange.toFixed(2)),
      period: '近一年',
    },
    {
      category: 'social',
      metric: '員工滿意度',
      direction: 'stable',
      changeRate: 0,
      period: '近一年',
    },
    {
      category: 'governance',
      metric: '資訊披露',
      direction: disclosureChange >= 0 ? 'improving' : 'declining',
      changeRate: Number(disclosureChange.toFixed(2)),
      period: '近一年',
    },
  ];
}

// ==========================================
// ESG 分析引擎
// ==========================================

export class ESGAnalysisEngine {
  private static instance: ESGAnalysisEngine;

  private _dataPoints: ESGDataPoint[] = [];

  private constructor() {}

  static getInstance(): ESGAnalysisEngine {
    if (!ESGAnalysisEngine.instance) {
      ESGAnalysisEngine.instance = new ESGAnalysisEngine();
    }
    return ESGAnalysisEngine.instance;
  }

  // ==========================================
  // 核心分析
  // ==========================================

  /**
   * 執行完整的 ESG 分析
   */
  async analyze(
    environmental: EnvironmentalMetrics,
    social: SocialMetrics,
    governance: GovernanceMetrics,
    period: { start: Date; end: Date }
  ): Promise<ESGAnalysisResult> {
    const envScore = calculateEnvironmentalScore(environmental);
    const socialScore = calculateSocialScore(social);
    const govScore = calculateGovernanceScore(governance);
    const overall = Math.round((envScore + socialScore + govScore) / 3);

    const scores: ESGScores = {
      environmental: this.toScoreBreakdown(envScore),
      social: this.toScoreBreakdown(socialScore),
      governance: this.toScoreBreakdown(govScore),
      overall,
    };

    const insights = buildInsights(envScore, socialScore, govScore);
    const recommendations = buildRecommendations(envScore, socialScore, govScore);
    const benchmarks = buildBenchmarks(environmental, social, governance);
    const trends = buildTrends(environmental, social, governance);

    return {
      id: `analysis-${Date.now()}-${randomUUID().substring(0, 8)}`,
      timestamp: new Date(),
      period,
      scores,
      insights,
      recommendations,
      benchmarks,
      trends,
    };
  }

  /**
   * 將單一分數轉換為 ScoreBreakdown
   */
  private toScoreBreakdown(score: number): ScoreBreakdown {
    return {
      score,
      rank: scoreToRank(score),
      percentile: clamp(Math.round(score)),
      change: 0,
    };
  }

  // ==========================================
  // 報告生成
  // ==========================================

  /**
   * 生成文字 / HTML 分析報告
   */
  generateReport(result: ESGAnalysisResult): string {
    const { scores } = result;

    const lines: string[] = [];
    lines.push('ESG 分析報告');
    lines.push('='.repeat(40));
    lines.push(`分析期間: ${result.period.start.toLocaleDateString()} - ${result.period.end.toLocaleDateString()}`);
    lines.push('');
    lines.push(`整體分數: ${scores.overall} (${scoreToRank(scores.overall)})`);
    lines.push(`環境 (E): ${scores.environmental.score} (${scores.environmental.rank})`);
    lines.push(`社會 (S): ${scores.social.score} (${scores.social.rank})`);
    lines.push(`治理 (G): ${scores.governance.score} (${scores.governance.rank})`);
    lines.push('');
    lines.push('主要洞察');
    lines.push('-'.repeat(40));
    for (const insight of result.insights) {
      lines.push(`[${insight.type}] ${insight.title}: ${insight.description}`);
    }
    lines.push('');
    lines.push('改善建議');
    lines.push('-'.repeat(40));
    for (const rec of result.recommendations) {
      lines.push(`[${rec.priority}] ${rec.title}: ${rec.description}`);
    }

    return lines.join('\n');
  }

  // ==========================================
  // 資料點管理
  // ==========================================

  /**
   * 新增單筆資料點
   */
  addDataPoint(dataPoint: ESGDataPoint): void {
    this._dataPoints.push(dataPoint);
  }

  /**
   * 批次新增資料點
   */
  addDataPoints(dataPoints: ESGDataPoint[]): void {
    this._dataPoints.push(...dataPoints);
  }

  /**
   * 取得已收集的資料點
   */
  getDataPoints(): ESGDataPoint[] {
    return [...this._dataPoints];
  }

  /**
   * 清除已收集的資料點
   */
  clearDataPoints(): void {
    this._dataPoints = [];
  }
}

// ==========================================
// 匯出單例
// ==========================================

export const esgAnalysisEngine = ESGAnalysisEngine.getInstance();
