'use client';

import { useState, useEffect, useMemo } from 'react';
import { OmniBaseCard } from '@/components/omni-base-card';

interface BestPractice {
  id: string;
  pillar: 'E' | 'S' | 'G';
  category: string;
  subcategory: string;
  name: string;
  nameEn: string;
  description: string;
  level: 'basic' | 'intermediate' | 'advanced';
  kpis: string[];
  references: string[];
}

interface MECEValidation {
  completeness: {
    pillars: Record<string, number>;
    isComplete: boolean;
    gaps: string[];
  };
  exclusivity: {
    totalPractices: number;
    uniqueIds: number;
    isExclusive: boolean;
    duplicates: string[];
  };
  isValid: boolean;
}

export function MECEBestPracticesView() {
  const [practices, setPractices] = useState<BestPractice[]>([]);
  const [validation, setValidation] = useState<MECEValidation | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterPillar, setFilterPillar] = useState<'all' | 'E' | 'S' | 'G'>('all');
  const [filterLevel, setFilterLevel] = useState<'all' | 'basic' | 'intermediate' | 'advanced'>(
    'all',
  );

  const loadData = async () => {
    try {
      const [practicesRes, validationRes] = await Promise.all([
        fetch('/api/esg/best-practices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        }),
        fetch('/api/esg/best-practices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ validate: 'full' }),
        }),
      ]);

      const practicesData = await practicesRes.json();
      const validationData = await validationRes.json();

      if (practicesData.success) setPractices(practicesData.data.practices);
      if (validationData.success) setValidation(validationData.data);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ⚡ Bolt Optimization: Memoized the practices filter to prevent expensive
  // O(n) recalculations during component re-renders unless filter criteria change.
  const filtered = useMemo(() => {
    return practices.filter((p) => {
      if (filterPillar !== 'all' && p.pillar !== filterPillar) return false;
      if (filterLevel !== 'all' && p.level !== filterLevel) return false;
      return true;
    });
  }, [practices, filterPillar, filterLevel]);

  const getPillarColor = (pillar: string) => {
    switch (pillar) {
      case 'E':
        return 'var(--accent-teal)';
      case 'S':
        return 'var(--accent-gold)';
      case 'G':
        return 'var(--accent-blue)';
      default:
        return 'var(--text-secondary)';
    }
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'basic':
        return { label: '基礎', color: 'var(--accent-teal)' };
      case 'intermediate':
        return { label: '進階', color: 'var(--accent-gold)' };
      case 'advanced':
        return { label: '卓越', color: 'var(--accent-purple)' };
      default:
        return { label: level, color: 'var(--text-secondary)' };
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-textSecondary">載入中...</div>;
  }

  return (
    <div className="space-y-6">
      {/* MECE 驗證狀態 */}
      {validation && (
        <OmniBaseCard variant="liquid-glass">
          <div className="flex items-center gap-4">
            <div
              className={`w-3 h-3 rounded-full ${validation.isValid ? 'bg-green-500' : 'bg-red-500'}`}
            />
            <div>
              <h3 className="text-sm font-bold text-textPrimary">
                MECE 驗證：{validation.isValid ? '通過' : '未通過'}
              </h3>
              <p className="text-xs text-textSecondary">
                完備性：{validation.completeness.isComplete ? '✓' : '✗'} | 互斥性：
                {validation.exclusivity.isExclusive ? '✓' : '✗'} | 共{' '}
                {validation.exclusivity.totalPractices} 個實踐
              </p>
            </div>
          </div>
        </OmniBaseCard>
      )}

      {/* 篩選器 */}
      <div className="flex gap-4">
        <div className="flex gap-2">
          {(['all', 'E', 'S', 'G'] as const).map((pillar) => (
            <button
              key={pillar}
              aria-pressed={filterPillar === pillar}
              onClick={() => setFilterPillar(pillar)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                filterPillar === pillar
                  ? 'bg-accentTeal text-white'
                  : 'bg-surface text-textSecondary'
              }`}
            >
              {pillar === 'all' ? '全部' : pillar}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {(['all', 'basic', 'intermediate', 'advanced'] as const).map((level) => (
            <button
              key={level}
              aria-pressed={filterLevel === level}
              onClick={() => setFilterLevel(level)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                filterLevel === level ? 'bg-accentGold text-white' : 'bg-surface text-textSecondary'
              }`}
            >
              {level === 'all' ? '全部' : getLevelBadge(level).label}
            </button>
          ))}
        </div>
      </div>

      {/* 實踐列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((practice) => {
          const levelBadge = getLevelBadge(practice.level);
          return (
            <OmniBaseCard key={practice.id} variant="liquid-glass">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${getPillarColor(practice.pillar)}20`,
                      color: getPillarColor(practice.pillar),
                    }}
                  >
                    {practice.pillar}
                  </span>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${levelBadge.color}20`, color: levelBadge.color }}
                  >
                    {levelBadge.label}
                  </span>
                </div>
                <span className="text-[10px] text-textSecondary font-mono">{practice.id}</span>
              </div>
              <h4 className="text-sm font-bold text-textPrimary mb-1">{practice.name}</h4>
              <p className="text-xs text-textSecondary mb-2">{practice.description}</p>
              <div className="flex flex-wrap gap-1">
                {practice.kpis.slice(0, 3).map((kpi) => (
                  <span
                    key={kpi}
                    className="text-[9px] bg-surface px-2 py-0.5 rounded text-textSecondary"
                  >
                    {kpi}
                  </span>
                ))}
              </div>
            </OmniBaseCard>
          );
        })}
      </div>
    </div>
  );
}
