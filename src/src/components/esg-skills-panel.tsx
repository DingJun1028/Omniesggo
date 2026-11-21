'use client';

import { useState, useEffect } from 'react';
import { OmniBaseCard } from '@/components/omni-base-card';

interface ESGSkill {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  taskType: string;
}

interface ESGSkillsPanelProps {
  onSelectSkill?: (taskType: string) => void;
}

const getPillarColor = (taskType: string) => {
  if (taskType.includes('carbon') || taskType.includes('tcfd') || taskType.includes('sdg')) {
    return 'var(--accent-teal)'; // E
  }
  if (taskType.includes('compliance') || taskType.includes('stakeholder')) {
    return 'var(--accent-gold)'; // S
  }
  return 'var(--accent-blue)'; // G
};

const getPillarLabel = (taskType: string) => {
  if (taskType.includes('carbon') || taskType.includes('tcfd') || taskType.includes('sdg'))
    return 'E';
  if (taskType.includes('compliance') || taskType.includes('stakeholder')) return 'S';
  return 'G';
};

export function ESGSkillsPanel({ onSelectSkill }: ESGSkillsPanelProps) {
  const [skills, setSkills] = useState<ESGSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPillar, setSelectedPillar] = useState<'all' | 'E' | 'S' | 'G'>('all');

  const fetchSkills = async () => {
    try {
      const res = await fetch('/api/esg/skills', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSkills(data.data.skills);
      }
    } catch (err) {
      console.error('Failed to fetch skills:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  // ⚡ Bolt Optimization: Memoized the skills filter to avoid O(n) recalculations
  // on every render, ensuring filtering only occurs when the pillar selection changes.
  const filteredSkills = useMemo(() => {
    return selectedPillar === 'all'
      ? skills
      : skills.filter((s) => getPillarLabel(s.taskType) === selectedPillar);
  }, [skills, selectedPillar]);

  return (
    <div className="space-y-4">
      {/* 標題 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-textPrimary">ESG 技能面板</h3>
        <div className="flex gap-2">
          {(['all', 'E', 'S', 'G'] as const).map((pillar) => (
            <button
              key={pillar}
              aria-pressed={selectedPillar === pillar}
              onClick={() => setSelectedPillar(pillar)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                selectedPillar === pillar
                  ? 'bg-accentTeal text-white'
                  : 'bg-surface text-textSecondary hover:bg-surface/80'
              }`}
            >
              {pillar === 'all' ? '全部' : pillar}
            </button>
          ))}
        </div>
      </div>

      {/* 技能列表 */}
      {loading ? (
        <div className="text-center py-8 text-textSecondary">載入中...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSkills.map((skill) => (
            <OmniBaseCard
              key={skill.id}
              variant="liquid-glass"
              className="cursor-pointer hover:scale-[1.02] transition-transform"
              onClick={() => onSelectSkill?.(skill.taskType)}
            >
              <div className="flex items-start justify-between mb-2">
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: `${getPillarColor(skill.taskType)}20`,
                    color: getPillarColor(skill.taskType),
                  }}
                >
                  {getPillarLabel(skill.taskType)}
                </span>
                <span className="text-[10px] text-textSecondary font-mono">{skill.id}</span>
              </div>
              <h4 className="text-sm font-bold text-textPrimary mb-1">{skill.name}</h4>
              <p className="text-xs text-textSecondary">{skill.description}</p>
            </OmniBaseCard>
          ))}
        </div>
      )}
    </div>
  );
}
