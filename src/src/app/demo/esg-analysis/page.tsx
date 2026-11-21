'use client';

/**
 * ==========================================
 * ESG 資料分析引擎 - Next.js Demo 頁面
 * ==========================================
 */

import React, { useState, useEffect, useCallback } from 'react';

// ==========================================
// 類型定義
// ==========================================

interface ESGScores {
  overall: number;
  environmental: number;
  social: number;
  governance: number;
}

interface Insight {
  type: 'positive' | 'negative' | 'warning' | 'neutral';
  title: string;
  description: string;
}

interface Recommendation {
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  expectedImpact: string;
}

interface Benchmark {
  metric: string;
  value: string;
  industryAverage: string;
  industryBest: string;
  status: boolean;
}

// ==========================================
// Demo 頁面組件
// ==========================================

export default function ESGAnalysisDemo() {
  // 狀態管理
  const [scores, setScores] = useState<ESGScores>({
    overall: 0,
    environmental: 0,
    social: 0,
    governance: 0,
  });
  const [insights, setInsights] = useState<Insight[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([]);

  // 輸入參數
  const [params, setParams] = useState({
    carbonEmissions: 1000,
    renewableRatio: 60,
    recyclingRate: 75,
    waterEfficiency: 80,
    turnoverRate: 12,
    femaleRatio: 45,
    safetyIncidents: 2.5,
    satisfaction: 75,
    independentDirectors: 70,
    femaleDirectors: 35,
    disclosureScore: 80,
    cyberSecurity: 85,
  });

  // ==========================================
  // 計算函數
  // ==========================================

  const calculateScores = useCallback(() => {
    // 環境分數
    let eScore = 0;
    if (params.carbonEmissions < 500) eScore += 30;
    else if (params.carbonEmissions < 1000) eScore += 25;
    else if (params.carbonEmissions < 2000) eScore += 20;
    else if (params.carbonEmissions < 3000) eScore += 15;
    else eScore += 10;

    eScore += (params.renewableRatio / 100) * 25;
    eScore += (params.recyclingRate / 100) * 25;
    eScore += (params.waterEfficiency / 100) * 20;
    eScore = Math.min(100, Math.round(eScore));

    // 社會分數
    let sScore = 0;
    sScore += (params.satisfaction / 100) * 30;
    if (params.turnoverRate < 10) sScore += 25;
    else if (params.turnoverRate < 15) sScore += 20;
    else if (params.turnoverRate < 20) sScore += 15;
    else sScore += 10;
    sScore += (params.femaleRatio / 100) * 25;
    if (params.safetyIncidents < 1) sScore += 20;
    else if (params.safetyIncidents < 2) sScore += 16;
    else if (params.safetyIncidents < 3) sScore += 12;
    else sScore += 8;
    sScore = Math.min(100, Math.round(sScore));

    // 治理分數
    let gScore = 0;
    gScore += (params.independentDirectors / 100) * 30;
    gScore += (params.femaleDirectors / 100) * 25;
    gScore += (params.disclosureScore / 100) * 25;
    gScore += (params.cyberSecurity / 100) * 20;
    gScore = Math.min(100, Math.round(gScore));

    const overall = Math.round((eScore + sScore + gScore) / 3);

    setScores({ overall, environmental: eScore, social: sScore, governance: gScore });

    // 生成洞察
    const newInsights: Insight[] = [];
    if (params.renewableRatio > 70) {
      newInsights.push({ type: 'positive', title: '可再生能源表現優異', description: `可再生能源比例達到 ${params.renewableRatio}%` });
    } else if (params.renewableRatio < 30) {
      newInsights.push({ type: 'negative', title: '可再生能源比例偏低', description: `可再生能源比例僅 ${params.renewableRatio}%` });
    }
    if (params.carbonEmissions > 2000) {
      newInsights.push({ type: 'warning', title: '碳排放偏高', description: `碳排放量 ${params.carbonEmissions} tCO2e` });
    }
    if (params.turnoverRate > 20) {
      newInsights.push({ type: 'negative', title: '員工流動率過高', description: `流動率 ${params.turnoverRate}%` });
    } else if (params.turnoverRate < 10) {
      newInsights.push({ type: 'positive', title: '員工穩定性良好', description: `流動率僅 ${params.turnoverRate}%` });
    }
    if (params.femaleRatio > 45) {
      newInsights.push({ type: 'positive', title: '性別多元性優良', description: `女性員工比例 ${params.femaleRatio}%` });
    }
    if (params.independentDirectors > 70) {
      newInsights.push({ type: 'positive', title: '董事會獨立性良好', description: `獨立董事比例 ${params.independentDirectors}%` });
    }
    setInsights(newInsights);

    // 生成建議
    const newRecs: Recommendation[] = [];
    if (eScore < 60) {
      newRecs.push({ priority: 'high', title: '提升環境表現', description: '建議制定碳中和路線圖', expectedImpact: '提升環境分數 15-20 分' });
    }
    if (sScore < 60) {
      newRecs.push({ priority: 'high', title: '改善社會表現', description: '加強員工培訓和多元性政策', expectedImpact: '提升社會分數 10-15 分' });
    }
    if (gScore < 70) {
      newRecs.push({ priority: 'medium', title: '強化公司治理', description: '增加獨立董事比例', expectedImpact: '提升治理分數 10-15 分' });
    }
    setRecommendations(newRecs);

    // 生成基準
    setBenchmarks([
      { metric: '碳排放強度', value: `${params.carbonEmissions} tCO2e`, industryAverage: '1500 tCO2e', industryBest: '500 tCO2e', status: params.carbonEmissions < 1500 },
      { metric: '可再生能源比例', value: `${params.renewableRatio}%`, industryAverage: '35%', industryBest: '100%', status: params.renewableRatio > 35 },
      { metric: '回收率', value: `${params.recyclingRate}%`, industryAverage: '45%', industryBest: '95%', status: params.recyclingRate > 45 },
      { metric: '員工流動率', value: `${params.turnoverRate}%`, industryAverage: '15%', industryBest: '5%', status: params.turnoverRate < 15 },
      { metric: '性別多元性', value: `${params.femaleRatio}%`, industryAverage: '40%', industryBest: '55%', status: params.femaleRatio > 40 },
      { metric: '安全事件率', value: String(params.safetyIncidents), industryAverage: '3.0', industryBest: '0.5', status: params.safetyIncidents < 3 },
      { metric: '獨立董事比例', value: `${params.independentDirectors}%`, industryAverage: '60%', industryBest: '90%', status: params.independentDirectors > 60 },
      { metric: '披露分數', value: String(params.disclosureScore), industryAverage: '65', industryBest: '95', status: params.disclosureScore > 65 },
    ]);
  }, [params]);

  useEffect(() => {
    calculateScores();
  }, [calculateScores]);

  // ==========================================
  // 工具函數
  // ==========================================

  const getRank = (score: number) => {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B+';
    if (score >= 60) return 'B';
    if (score >= 50) return 'C+';
    if (score >= 40) return 'C';
    if (score >= 30) return 'D';
    return 'F';
  };

  const getGaugeColor = (score: number) => {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#06b6d4';
    if (score >= 40) return '#eab308';
    return '#ef4444';
  };

  const updateParam = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  // ==========================================
  // 渲染
  // ==========================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-900 to-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* 標題 */}
        <header className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            ESG 資料分析引擎 Demo
          </h1>
          <p className="text-gray-400">互動式 ESG 資料分析與視覺化展示</p>
        </header>

        {/* 控制面板 */}
        <div className="glass rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 text-emerald-400">輸入參數</h2>
          <div className="grid grid-cols-3 gap-6">
            {/* 環境參數 */}
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-3">環境 (Environmental)</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">碳排放 (tCO2e)</label>
                  <input type="number" value={params.carbonEmissions} onChange={(e) => updateParam('carbonEmissions', parseInt(e.target.value) || 0)} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">可再生能源比例 (%)</label>
                  <input type="number" value={params.renewableRatio} onChange={(e) => updateParam('renewableRatio', parseInt(e.target.value) || 0)} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">回收率 (%)</label>
                  <input type="number" value={params.recyclingRate} onChange={(e) => updateParam('recyclingRate', parseInt(e.target.value) || 0)} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">水資源效率 (%)</label>
                  <input type="number" value={params.waterEfficiency} onChange={(e) => updateParam('waterEfficiency', parseInt(e.target.value) || 0)} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400" />
                </div>
              </div>
            </div>

            {/* 社會參數 */}
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-3">社會 (Social)</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">員工流動率 (%)</label>
                  <input type="number" value={params.turnoverRate} onChange={(e) => updateParam('turnoverRate', parseInt(e.target.value) || 0)} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-400" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">女性員工比例 (%)</label>
                  <input type="number" value={params.femaleRatio} onChange={(e) => updateParam('femaleRatio', parseInt(e.target.value) || 0)} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-400" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">安全事件率</label>
                  <input type="number" value={params.safetyIncidents} step="0.1" onChange={(e) => updateParam('safetyIncidents', parseFloat(e.target.value) || 0)} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-400" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">員工滿意度 (0-100)</label>
                  <input type="number" value={params.satisfaction} onChange={(e) => updateParam('satisfaction', parseInt(e.target.value) || 0)} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-400" />
                </div>
              </div>
            </div>

            {/* 治理參數 */}
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-3">治理 (Governance)</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">獨立董事比例 (%)</label>
                  <input type="number" value={params.independentDirectors} onChange={(e) => updateParam('independentDirectors', parseInt(e.target.value) || 0)} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">女性董事比例 (%)</label>
                  <input type="number" value={params.femaleDirectors} onChange={(e) => updateParam('femaleDirectors', parseInt(e.target.value) || 0)} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">披露分數 (0-100)</label>
                  <input type="number" value={params.disclosureScore} onChange={(e) => updateParam('disclosureScore', parseInt(e.target.value) || 0)} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">網路安全分數 (0-100)</label>
                  <input type="number" value={params.cyberSecurity} onChange={(e) => updateParam('cyberSecurity', parseInt(e.target.value) || 0)} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 分數儀錶板 */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="glass rounded-xl p-6 text-center">
            <div className="relative inline-block">
              <svg className="w-28 h-28" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="8" />
                <circle cx="50" cy="50" r="40" fill="none" stroke={getGaugeColor(scores.overall)} stroke-width="8"
                  stroke-dasharray={`${(scores.overall / 100) * 251.2} 251.2`} strokeLinecap="round" className="gauge-ring" transform="rotate(-90 50 50)" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold">{scores.overall}</span>
              </div>
            </div>
            <div className="text-gray-400 mt-2">整體分數</div>
            <div className="text-sm text-emerald-400">{getRank(scores.overall)}</div>
          </div>

          <div className="glass rounded-xl p-6 text-center">
            <div className="relative inline-block">
              <svg className="w-28 h-28" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="8" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#22c55e" stroke-width="8"
                  stroke-dasharray={`${(scores.environmental / 100) * 251.2} 251.2`} strokeLinecap="round" className="gauge-ring" transform="rotate(-90 50 50)" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold text-green-400">{scores.environmental}</span>
              </div>
            </div>
            <div className="text-gray-400 mt-2">環境 (E)</div>
            <div className="text-sm text-green-400">{getRank(scores.environmental)}</div>
          </div>

          <div className="glass rounded-xl p-6 text-center">
            <div className="relative inline-block">
              <svg className="w-28 h-28" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="8" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#06b6d4" stroke-width="8"
                  stroke-dasharray={`${(scores.social / 100) * 251.2} 251.2`} strokeLinecap="round" className="gauge-ring" transform="rotate(-90 50 50)" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold text-cyan-400">{scores.social}</span>
              </div>
            </div>
            <div className="text-gray-400 mt-2">社會 (S)</div>
            <div className="text-sm text-cyan-400">{getRank(scores.social)}</div>
          </div>

          <div className="glass rounded-xl p-6 text-center">
            <div className="relative inline-block">
              <svg className="w-28 h-28" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="8" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#a855f7" stroke-width="8"
                  stroke-dasharray={`${(scores.governance / 100) * 251.2} 251.2`} strokeLinecap="round" className="gauge-ring" transform="rotate(-90 50 50)" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold text-purple-400">{scores.governance}</span>
              </div>
            </div>
            <div className="text-gray-400 mt-2">治理 (G)</div>
            <div className="text-sm text-purple-400">{getRank(scores.governance)}</div>
          </div>
        </div>

        {/* 洞察與建議 */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div className="glass rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4 text-emerald-400">主要洞察</h2>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {insights.length === 0 ? (
                <div className="text-gray-500 text-center py-8">暫無洞察</div>
              ) : (
                insights.map((insight, i) => (
                  <div key={i} className={`bg-white/5 rounded-lg p-4 border-l-4 ${
                    insight.type === 'positive' ? 'border-green-500' :
                    insight.type === 'negative' ? 'border-red-500' :
                    insight.type === 'warning' ? 'border-yellow-500' : 'border-gray-500'
                  }`}>
                    <div className="font-medium">{insight.title}</div>
                    <div className="text-sm text-gray-400 mt-1">{insight.description}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="glass rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4 text-cyan-400">改善建議</h2>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {recommendations.length === 0 ? (
                <div className="text-gray-500 text-center py-8">暫無建議</div>
              ) : (
                recommendations.map((rec, i) => (
                  <div key={i} className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        rec.priority === 'high' ? 'bg-red-500/30 text-red-400' : 'bg-yellow-500/30 text-yellow-400'
                      }`}>
                        {rec.priority.toUpperCase()}
                      </span>
                      <span className="font-medium">{rec.title}</span>
                    </div>
                    <div className="text-sm text-gray-400">{rec.description}</div>
                    <div className="text-xs text-gray-500 mt-2">預期效果: {rec.expectedImpact}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 基準比較 */}
        <div className="glass rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 text-purple-400">基準詳細比較</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left py-3 px-4 text-gray-400">指標</th>
                  <th className="text-right py-3 px-4 text-gray-400">公司表現</th>
                  <th className="text-right py-3 px-4 text-gray-400">行業平均</th>
                  <th className="text-right py-3 px-4 text-gray-400">行業最佳</th>
                  <th className="text-center py-3 px-4 text-gray-400">狀態</th>
                </tr>
              </thead>
              <tbody>
                {benchmarks.map((bm, i) => (
                  <tr key={i} className="border-b border-white/10 hover:bg-white/5">
                    <td className="py-3 px-4">{bm.metric}</td>
                    <td className="py-3 px-4 text-right font-medium">{bm.value}</td>
                    <td className="py-3 px-4 text-right text-gray-400">{bm.industryAverage}</td>
                    <td className="py-3 px-4 text-right text-gray-400">{bm.industryBest}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={bm.status ? 'text-green-400' : 'text-red-400'}>
                        {bm.status ? '✓ 高於平均' : '✗ 低於平均'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <footer className="text-center text-gray-500 text-sm">
          ESG GO Platform - 資料分析引擎 Demo
        </footer>
      </div>
    </div>
  );
}
