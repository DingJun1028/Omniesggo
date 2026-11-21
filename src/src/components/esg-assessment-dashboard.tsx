'use client';

import { useState } from 'react';
import { OmniBaseCard } from '@/components/omni-base-card';

interface AssessmentResult {
  company: string;
  overallScore: number;
  pillarScores: { E: number; S: number; G: number };
  levelBreakdown: { basic: number; intermediate: number; advanced: number };
  recommendations: string[];
  actionPlan: Array<{
    practiceId: string;
    name: string;
    pillar: string;
    level: string;
    priority: string;
  }>;
  totalPractices: number;
  assessedPractices: number;
}

export function ESGAssessmentDashboard() {
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);

  const runAssessment = async () => {
    if (!company.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/esg/assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company: company.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.data);
      }
    } catch (err) {
      console.error('Assessment failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'var(--accent-teal)';
    if (score >= 60) return 'var(--accent-gold)';
    return 'var(--accent-purple)';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'var(--accent-purple)';
      case 'medium': return 'var(--accent-gold)';
      case 'low': return 'var(--accent-teal)';
      default: return 'var(--text-secondary)';
    }
  };

  return (
    <div className="space-y-6">
      {/* 輸入區 */}
      <OmniBaseCard variant="liquid-glass">
        <h3 className="text-lg font-bold text-textPrimary mb-4">ESG 評估</h3>
        <div className="flex gap-4">
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="輸入公司名稱..."
            className="flex-1 bg-surface border border-borderColor rounded-lg px-4 py-2 text-sm text-textPrimary focus:outline-none focus:border-accentTeal"
            onKeyDown={(e) => e.key === 'Enter' && runAssessment()}
          />
          <button
            onClick={runAssessment}
            disabled={loading || !company.trim()}
            className="px-6 py-2 bg-accentTeal text-white rounded-lg text-sm font-bold disabled:opacity-50"
          >
            {loading ? '評估中...' : '開始評估'}
          </button>
        </div>
      </OmniBaseCard>

      {/* 結果 */}
      {result && (
        <>
          {/* 總體評分 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <OmniBaseCard variant="liquid-glass">
              <div className="text-center">
                <div className="text-3xl font-bold" style={{ color: getScoreColor(result.overallScore) }}>
                  {result.overallScore}
                </div>
                <div className="text-xs text-textSecondary">總體評分</div>
              </div>
            </OmniBaseCard>
            <OmniBaseCard variant="liquid-glass">
              <div className="text-center">
                <div className="text-3xl font-bold" style={{ color: getScoreColor(result.pillarScores.E) }}>
                  {result.pillarScores.E}
                </div>
                <div className="text-xs text-textSecondary">Environmental</div>
              </div>
            </OmniBaseCard>
            <OmniBaseCard variant="liquid-glass">
              <div className="text-center">
                <div className="text-3xl font-bold" style={{ color: getScoreColor(result.pillarScores.S) }}>
                  {result.pillarScores.S}
                </div>
                <div className="text-xs text-textSecondary">Social</div>
              </div>
            </OmniBaseCard>
            <OmniBaseCard variant="liquid-glass">
              <div className="text-center">
                <div className="text-3xl font-bold" style={{ color: getScoreColor(result.pillarScores.G) }}>
                  {result.pillarScores.G}
                </div>
                <div className="text-xs text-textSecondary">Governance</div>
              </div>
            </OmniBaseCard>
          </div>

          {/* 改善建議 */}
          <OmniBaseCard variant="liquid-glass">
            <h4 className="text-sm font-bold text-textPrimary mb-3">改善建議</h4>
            <ul className="space-y-2">
              {result.recommendations.map((rec, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-textSecondary">
                  <span className="w-1.5 h-1.5 rounded-full bg-accentTeal" />
                  {rec}
                </li>
              ))}
            </ul>
          </OmniBaseCard>

          {/* 行動計畫 */}
          <OmniBaseCard variant="liquid-glass">
            <h4 className="text-sm font-bold text-textPrimary mb-3">行動計畫（前 {result.actionPlan.length} 項）</h4>
            <div className="space-y-2">
              {result.actionPlan.map(item => (
                <div key={item.practiceId} className="flex items-center justify-between p-2 bg-surface rounded">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accentTeal/10 text-accentTeal">
                      {item.pillar}
                    </span>
                    <span className="text-xs text-textPrimary">{item.name}</span>
                  </div>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${getPriorityColor(item.priority)}20`, color: getPriorityColor(item.priority) }}
                  >
                    {item.priority}
                  </span>
                </div>
              ))}
            </div>
          </OmniBaseCard>
        </>
      )}
    </div>
  );
}
