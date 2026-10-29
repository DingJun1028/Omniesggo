import type { Company, EvidenceCard } from '../../../src/types/sustain-write';
/**
 * app/sustain-write/v5/types.ts — Sustain Write v5 共用型別
 */

export type FiveTGate = 'traceable' | 'transparent' | 'tangible' | 'trustworthy' | 'trackable';
export type V5TaskStatus = 'idle' | 'pending' | 'running' | 'completed' | 'failed';
// ts-matrix: 對外相容別名 (API 不變)
export type { V5TaskStatus as TaskStatus };
export type TemplateType = '' | 'gri-standard' | 'tcfd-special' | 'investor-minimal';

// ts-matrix: 收斂至規範型別 (canonical: src/types/sustain-write)
export type { Company };

export interface NoteData {
  id: string;
  title: string;
  content: string;
  tags: string[];
  fiveTGate?: string;
  createdAt: number;
}

export interface CustomCompanyForm {
  name: string;
  industry: string;
  employees: number;
  annualRevenue: string;
  scope1Tco2e: number;
  scope2Tco2e: number;
}

export interface V5TaskProgress {
  taskId: string;
  status: V5TaskStatus;
  templateId?: string;
  currentChapter: number;
  totalChapters: number;
  chapterTitle: string;
  wordsSoFar: number;
  fiveTGate: string;
  tagsCreated: number;
  decisionsCount: number;
  percent: number;
  noteIds?: string[];
  customCompany?: CustomCompanyForm;
  result?: {
    totalWords: number;
    totalTags: number;
    trinityHash: string;
    durationMs: number;
    companyId: string;
  };
}
// ts-matrix: 對外相容別名 (API 不變)
export type { V5TaskProgress as TaskProgress };

// ts-matrix: 收斂至規範型別 (canonical: src/types/sustain-write)
export type { EvidenceCard };

// ── Constants ─────────────────────────────────────────────────

export const GATE_COLORS: Record<FiveTGate, string> = {
  traceable: 'bg-accentBlue',
  transparent: 'bg-accentGreen',
  tangible: 'bg-accentGold',
  trustworthy: 'bg-accentPurple',
  trackable: 'bg-accentTeal',
};

export const GATE_LABELS: Record<FiveTGate, string> = {
  traceable: '真',
  transparent: '善',
  tangible: '美',
  trustworthy: '信',
  trackable: '通',
};

export const GATE_BG: Record<FiveTGate, string> = {
  traceable: 'bg-accentBlue/10 border-accentBlue/30',
  transparent: 'bg-accentGreen/10 border-accentGreen/30',
  tangible: 'bg-accentGold/10 border-accentGold/30',
  trustworthy: 'bg-accentPurple/10 border-accentPurple/30',
  trackable: 'bg-accentTeal/10 border-accentTeal/30',
};

export const CUSTOM_COMPANY_ID = '__custom__';

export const EMPTY_CUSTOM_COMPANY: CustomCompanyForm = {
  name: '',
  industry: '',
  employees: 0,
  annualRevenue: '',
  scope1Tco2e: 0,
  scope2Tco2e: 0,
};
