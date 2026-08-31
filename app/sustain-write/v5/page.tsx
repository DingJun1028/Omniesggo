'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { FileText, ChevronDown, ChevronUp, X, Wand2 } from 'lucide-react';
import { UniversalOmniConsole } from '../../omni-center/universal-omni-console';
import { db } from '@lib/firebase';
import { doc, setDoc } from '@lib/firebase';
import { createFiveTComponent, type OmniResult } from '@lib/esggo';

/**
 * ESGGO v5.2 — OmniBase Style Frontend
 * Design: White background, no glass, left Gold border accent
 * Grid stats, chapter navigation, 5T badges, ZKP seal row
 * Integrates with async task API + OmniAgent + OmniNote + Custom Company
 *
 * New in v5.2:
 * - OmniNote integration: reference notes in report generation
 * - Custom company: users can create and save their own company profiles
 */

// ─── Types ───────────────────────────────────────────────────────────
type FiveTGate = 'traceable' | 'transparent' | 'tangible' | 'trustworthy' | 'trackable';
type TaskStatus = 'idle' | 'pending' | 'running' | 'completed' | 'failed';
type TemplateType = '' | 'gri-standard' | 'tcfd-special' | 'investor-minimal';

interface Company {
  id: string;
  name: string;
  shortName: string;
  industry: string;
}

interface NoteData {
  id: string;
  title: string;
  content: string;
  tags: string[];
  fiveTGate?: string;
  createdAt: number;
}

interface CustomCompanyForm {
  name: string;
  industry: string;
  employees: number;
  annualRevenue: string;
  scope1Tco2e: number;
  scope2Tco2e: number;
}

interface TaskProgress {
  taskId: string;
  status: TaskStatus;
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

interface EvidenceCard {
  id: string;
  chapter: string;
  receiptName: string;
  why: string;
  what: string;
  how: string;
  tags: string[];
  hashLock: string;
}

// ─── Constants ───────────────────────────────────────────────────────
const GATE_COLORS: Record<FiveTGate, string> = {
  traceable: 'bg-accentBlue',
  transparent: 'bg-accentGreen',
  tangible: 'bg-accentGold',
  trustworthy: 'bg-accentPurple',
  trackable: 'bg-accentTeal',
};

const GATE_LABELS: Record<FiveTGate, string> = {
  traceable: '真',
  transparent: '善',
  tangible: '美',
  trustworthy: '信',
  trackable: '通',
};

const _GATE_BG: Record<FiveTGate, string> = {
  traceable: 'bg-accentBlue/10 border-accentBlue/30',
  transparent: 'bg-accentGreen/10 border-accentGreen/30',
  tangible: 'bg-accentGold/10 border-accentGold/30',
  trustworthy: 'bg-accentPurple/10 border-accentPurple/30',
  trackable: 'bg-accentTeal/10 border-accentTeal/30',
};

const CUSTOM_COMPANY_ID = '__custom__';

const EMPTY_CUSTOM_COMPANY: CustomCompanyForm = {
  name: '',
  industry: '',
  employees: 0,
  annualRevenue: '',
  scope1Tco2e: 0,
  scope2Tco2e: 0,
};

// ─── localStorage Helpers ────────────────────────────────────────────
const CUSTOM_COMPANIES_KEY = 'esggo_custom_companies';

function loadCustomCompanies(): CustomCompanyForm[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CUSTOM_COMPANIES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCustomCompanies(companies: CustomCompanyForm[]) {
  try {
    localStorage.setItem(CUSTOM_COMPANIES_KEY, JSON.stringify(companies));
  } catch { /* ignore */ }
}

// ─── API Helpers ─────────────────────────────────────────────────────
async function fetchCompanies(): Promise<Company[]> {
  try {
    const res = await fetch('/api/sustain-write/v5');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data || !Array.isArray(data.companies)) {
      throw new Error('回應格式不正確：缺少 companies 陣列');
    }
    return data.companies;
  } catch (err) {
    const msg = err instanceof Error ? err.message : '無法載入公司列表';
    throw new Error(msg);
  }
}

async function fetchNotes(): Promise<NoteData[]> {
  try {
    const res = await fetch('/api/notes');
    if (!res.ok) return [];
    const data = await res.json();
    return data?.data?.notes || [];
  } catch {
    return [];
  }
}

async function startAsyncReport(
  companyId: string,
  templateId: string,
  noteIds?: string[],
  customCompany?: CustomCompanyForm
): Promise<{ taskId: string }> {
  const res = await fetch('/api/sustain-write/v5/async', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      companyId,
      templateId,
      ...(noteIds && noteIds.length > 0 ? { noteIds } : {}),
      ...(companyId === CUSTOM_COMPANY_ID && customCompany ? { customCompany } : {}),
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`啟動失敗: HTTP ${res.status} ${body.slice(0, 100)}`);
  }
  const data = await res.json();
  if (!data?.taskId) {
    throw new Error('回應格式不正確：缺少 taskId');
  }
  return data;
}

async function fetchTaskProgress(taskId: string): Promise<TaskProgress> {
  const res = await fetch(`/api/sustain-write/v5/progress/${taskId}`);
  if (!res.ok) {
    throw new Error(`查詢進度失敗: HTTP ${res.status}`);
  }
  const data = await res.json();
  if (!data || typeof data.status !== 'string') {
    throw new Error('進度回應格式不正確');
  }
  return data;
}

// ─── Components ──────────────────────────────────────────────────────

function StatCard({ value, label, accent }: { value: string | number; label: string; accent: string }) {
  return (
    <div className="bg-primary rounded-lg border border-borderColor p-4 text-center">
      <div className={`text-2xl font-bold ${accent}`}>{value}</div>
      <div className="text-xs text-textSecondary mt-1">{label}</div>
    </div>
  );
}

function FiveTBadge({ gate }: { gate: FiveTGate }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white ${GATE_COLORS[gate]}`}>
      {GATE_LABELS[gate]}
    </span>
  );
}

function ProgressBar({ progress }: { progress: TaskProgress }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-textSecondary">
          第 {progress.currentChapter}/{progress.totalChapters} 章：{progress.chapterTitle}
        </span>
        <span className="font-medium text-accentTeal">{progress.percent}%</span>
      </div>
      <div className="w-full bg-secondary rounded-full h-2">
        <div
          className="bg-accentTeal h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress.percent}%` }}
        />
      </div>
      <div className="grid grid-cols-4 gap-3 text-xs text-textSecondary">
        <div><span className="font-medium text-textPrimary">{progress.wordsSoFar.toLocaleString()}</span> 字</div>
        <div><span className="font-medium text-textPrimary">{progress.tagsCreated}</span> 標籤</div>
        <div><span className="font-medium text-textPrimary">{progress.decisionsCount}</span> 決策</div>
        <div>
          <FiveTBadge gate={progress.fiveTGate as FiveTGate | undefined ?? 'traceable'} />
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────

export default function SustainWriteV5Page() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [customCompanies, setCustomCompanies] = useState<CustomCompanyForm[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [taskProgress, setTaskProgress] = useState<TaskProgress | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewFormat, setPreviewFormat] = useState<'html' | 'md' | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [evidenceCards, setEvidenceCards] = useState<EvidenceCard[]>([]);
  const [loadingEvidence, setLoadingEvidence] = useState(false);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  // 5T 知識結晶（報告封裝結果）
  const [evolution, setEvolution] = useState({ level: 1, xp: 0, nextXp: 120 });
  const [evolving, setEvolving] = useState(false);

  // Notes state
  const [notes, setNotes] = useState<NoteData[]>([]);
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [notesExpanded, setNotesExpanded] = useState(false);
  const [noteSearchQuery, setNoteSearchQuery] = useState('');

  // Custom company state
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customCompany, setCustomCompany] = useState<CustomCompanyForm>(EMPTY_CUSTOM_COMPANY);

  // Initialize theme from system or saved preference
  useEffect(() => {
    if (document.documentElement.classList.contains('dark')) {
      setIsDarkMode(true);
    }
    setCustomCompanies(loadCustomCompanies());
  }, []);

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return next;
    });
  };

  // Load companies on mount
  useEffect(() => {
    fetchCompanies()
      .then(setCompanies)
      .catch(() => setError('無法載入公司列表'));
  }, []);

  // Load notes when expanded
  useEffect(() => {
    if (notesExpanded && notes.length === 0) {
      setLoadingNotes(true);
      fetchNotes()
        .then(setNotes)
        .catch(() => { /* silent */ })
        .finally(() => setLoadingNotes(false));
    }
  }, [notesExpanded, notes.length]);

  // Poll task progress
  const startPolling = useCallback((taskId: string) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    pollIntervalRef.current = setInterval(async () => {
      try {
        const progress = await fetchTaskProgress(taskId);
        setTaskProgress(progress);

        if (progress.status === 'completed' || progress.status === 'failed') {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          setLoading(false);
        }
      } catch {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        setLoading(false);
        setError('查詢進度失敗');
      }
    }, 500);
  }, []);

  // Load evidence when company selected
  useEffect(() => {
    if (!selectedCompany || selectedCompany === CUSTOM_COMPANY_ID) {
      setEvidenceCards([]);
      return;
    }
    setLoadingEvidence(true);
    fetch(`/api/sustain-write/v5/evidence?companyId=${selectedCompany}`)
      .then(res => res.json())
      .then(data => {
        if (data.evidence) setEvidenceCards(data.evidence);
      })
      .catch(console.error)
      .finally(() => setLoadingEvidence(false));
  }, [selectedCompany]);

  const handleGenerate = async () => {
    if (!selectedCompany || !selectedTemplate) return;
    if (selectedCompany === CUSTOM_COMPANY_ID && !customCompany.name) {
      setError('請填寫自訂公司名稱');
      return;
    }
    setLoading(true);
    setError(null);
    setTaskProgress(null);

    try {
      const effectiveCompanyId = selectedCompany === CUSTOM_COMPANY_ID
        ? `custom-${Date.now()}`
        : selectedCompany;
      const { taskId } = await startAsyncReport(
        effectiveCompanyId,
        selectedTemplate,
        selectedNoteIds.length > 0 ? selectedNoteIds : undefined,
        selectedCompany === CUSTOM_COMPANY_ID ? customCompany : undefined
      );
      startPolling(taskId);
    } catch {
      setLoading(false);
      setError('啟動任務失敗');
    }
  };

  const handleDownload = (format: 'html' | 'md') => {
    if (!taskProgress?.result?.companyId) return;
    window.open(`/api/sustain-write/v5/download?companyId=${taskProgress.result.companyId}&format=${format}`, '_blank');
  };

  const handlePreview = async (format: 'html' | 'md') => {
    if (!taskProgress?.result?.companyId) return;
    
    if (previewFormat === format && previewContent) {
      setPreviewContent(null);
      setPreviewFormat(null);
      return;
    }

    setPreviewLoading(true);
    setPreviewFormat(format);
    try {
      const res = await fetch(`/api/sustain-write/v5/preview?companyId=${taskProgress.result.companyId}&format=${format}`);
      if (!res.ok) throw new Error('Preview failed');
      const text = await res.text();
      setPreviewContent(text);
    } catch (err) {
      console.error(err);
      alert('無法載入預覽');
    } finally {
      setPreviewLoading(false);
    }
  };

  /**
   * 報告產出後，自動以 omni({ kind: 'component' }) 封裝為 5T 知識結晶，
   * 並將 hash_lock 寫入 ZKP Vault（Firestore votes 集合）。
   */
  const toggleNoteSelection = (noteId: string) => {
    setSelectedNoteIds(prev =>
      prev.includes(noteId) ? prev.filter(id => id !== noteId) : [...prev, noteId]
    );
  };

  const evolveReport = async () => {
    if (!taskProgress?.result?.companyId || evolving) return;
    setEvolving(true);
    try {
      await new Promise(r => setTimeout(r, 700));
      setEvolution(prev => {
        const xp = prev.xp + 45;
        let level = prev.level;
        let nextXp = prev.nextXp;
        while (xp >= nextXp) {
          level += 1;
          nextXp = Math.floor(nextXp * 1.25);
        }
        return { level, xp: xp % nextXp, nextXp };
      });
    } finally {
      setEvolving(false);
    }
  };

  const saveCustomCompany = () => {
    if (!customCompany.name) return;
    const updated = [...customCompanies, customCompany];
    setCustomCompanies(updated);
    saveCustomCompanies(updated);
    setShowCustomForm(false);
    setCustomCompany(EMPTY_CUSTOM_COMPANY);
  };

  const removeCustomCompany = (index: number) => {
    const updated = customCompanies.filter((_, i) => i !== index);
    setCustomCompanies(updated);
    saveCustomCompanies(updated);
  };

  const filteredNotes = notes.filter(n => {
    if (!noteSearchQuery) return true;
    const q = noteSearchQuery.toLowerCase();
    return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q) || n.tags.some(t => t.toLowerCase().includes(q));
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  // All companies including custom ones and the "Custom" option
  const _allCompanies: (Company & { isCustom?: boolean })[] = [
    ...companies,
    ...customCompanies.map((c, i) => ({
      id: `custom-saved-${i}`,
      name: c.name,
      shortName: c.name,
      industry: c.industry,
      isCustom: true as const,
    })),
    { id: CUSTOM_COMPANY_ID, name: '+ 新增自訂公司', shortName: '自訂', industry: '' },
  ];

  return (
    <div className="min-h-screen bg-primary transition-colors duration-300">
      {/* Header */}
      <header className="bg-secondary border-b border-borderColor sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-accentTeal rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">E</span>
            </div>
            <h1 className="text-lg font-semibold text-textPrimary">ESGGO 永續發展無限進化</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-md border border-borderColor text-textSecondary hover:text-textPrimary hover:bg-primary transition-colors"
              title="切換深淺色模式"
            >
              {isDarkMode ? '🌙' : '☀️'}
            </button>
            <span className="text-xs text-textSecondary bg-primary px-2 py-1 rounded border border-borderColor">
              OmniBase · 零算力報告 (繁體中文)
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard value={28} label="章節數" accent="text-accentTeal" />
          <StatCard value="280K" label="總字數目標" accent="text-accentGold" />
          <StatCard value="5T" label="真善美信通" accent="text-accentBlue" />
          <StatCard value="ZKP" label="零知識證明" accent="text-accentPurple" />
        </div>

        {/* Control Panel */}
        <div className="bg-secondary rounded-lg border border-borderColor p-6 mb-8 shadow-sm">
          <div className="border-l-4 border-accentGold pl-4 mb-4">
            <h2 className="text-base font-semibold text-textPrimary">模板選擇閘門 (Template Selection Gate)</h2>
            <p className="text-sm text-textSecondary mt-1">選擇報告模板與對象，以解鎖報告生成引擎</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1">
              <label className="block text-xs font-medium text-textSecondary mb-1">企業實體</label>
              <select
                value={selectedCompany}
                onChange={(e) => {
                  setSelectedCompany(e.target.value);
                  if (e.target.value === CUSTOM_COMPANY_ID) {
                    setShowCustomForm(true);
                  }
                }}
                className="w-full border border-borderColor rounded-lg px-4 py-2.5 text-sm bg-primary text-textPrimary focus:ring-2 focus:ring-accentTeal focus:border-accentTeal outline-none transition-colors"
              >
                <option value="">選擇公司...</option>
                <optgroup label="Demo 公司">
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}（{c.industry}）
                    </option>
                  ))}
                </optgroup>
                {customCompanies.length > 0 && (
                  <optgroup label="自訂公司">
                    {customCompanies.map((c, i) => (
                      <option key={`custom-saved-${i}`} value={`custom-saved-${i}`}>
                        {c.name}（{c.industry}）
                      </option>
                    ))}
                  </optgroup>
                )}
                <option value={CUSTOM_COMPANY_ID}>+ 新增自訂公司</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-textSecondary mb-1">報告模板</label>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value as TemplateType)}
                className="w-full border border-borderColor rounded-lg px-4 py-2.5 text-sm bg-primary text-textPrimary focus:ring-2 focus:ring-accentGold focus:border-accentGold outline-none transition-colors"
              >
                <option value="">選擇模板以解鎖...</option>
                <option value="gri-standard">GRI 永續準則標準版 (28章)</option>
                <option value="tcfd-special">TCFD 氣候專項版 (12章)</option>
                <option value="investor-minimal">投資人摘要精簡版 (5章)</option>
              </select>
            </div>
          </div>

          {/* Custom Company Form */}
          {showCustomForm && selectedCompany === CUSTOM_COMPANY_ID && (
            <div className="mt-4 p-4 bg-primary rounded-lg border border-accentTeal/30">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-textPrimary">新增自訂公司</h3>
                <button
                  onClick={() => { setShowCustomForm(false); setSelectedCompany(''); }}
                  className="text-textSecondary hover:text-textPrimary"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-textSecondary mb-1">公司名稱 *</label>
                  <input
                    type="text"
                    value={customCompany.name}
                    onChange={(e) => setCustomCompany(c => ({ ...c, name: e.target.value }))}
                    placeholder="例：我的公司股份有限公司"
                    className="w-full border border-borderColor rounded-lg px-3 py-2 text-sm bg-secondary text-textPrimary focus:ring-2 focus:ring-accentTeal outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-textSecondary mb-1">產業類型</label>
                  <input
                    type="text"
                    value={customCompany.industry}
                    onChange={(e) => setCustomCompany(c => ({ ...c, industry: e.target.value }))}
                    placeholder="例：科技製造"
                    className="w-full border border-borderColor rounded-lg px-3 py-2 text-sm bg-secondary text-textPrimary focus:ring-2 focus:ring-accentTeal outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-textSecondary mb-1">員工人數</label>
                  <input
                    type="number"
                    value={customCompany.employees || ''}
                    onChange={(e) => setCustomCompany(c => ({ ...c, employees: Number(e.target.value) }))}
                    placeholder="例：100"
                    className="w-full border border-borderColor rounded-lg px-3 py-2 text-sm bg-secondary text-textPrimary focus:ring-2 focus:ring-accentTeal outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-textSecondary mb-1">年度營收</label>
                  <input
                    type="text"
                    value={customCompany.annualRevenue}
                    onChange={(e) => setCustomCompany(c => ({ ...c, annualRevenue: e.target.value }))}
                    placeholder="例：新臺幣5億元"
                    className="w-full border border-borderColor rounded-lg px-3 py-2 text-sm bg-secondary text-textPrimary focus:ring-2 focus:ring-accentTeal outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-textSecondary mb-1">Scope 1 碳排 (tCO2e)</label>
                  <input
                    type="number"
                    value={customCompany.scope1Tco2e || ''}
                    onChange={(e) => setCustomCompany(c => ({ ...c, scope1Tco2e: Number(e.target.value) }))}
                    placeholder="例：500"
                    className="w-full border border-borderColor rounded-lg px-3 py-2 text-sm bg-secondary text-textPrimary focus:ring-2 focus:ring-accentTeal outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-textSecondary mb-1">Scope 2 碳排 (tCO2e)</label>
                  <input
                    type="number"
                    value={customCompany.scope2Tco2e || ''}
                    onChange={(e) => setCustomCompany(c => ({ ...c, scope2Tco2e: Number(e.target.value) }))}
                    placeholder="例：1200"
                    className="w-full border border-borderColor rounded-lg px-3 py-2 text-sm bg-secondary text-textPrimary focus:ring-2 focus:ring-accentTeal outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => { setShowCustomForm(false); setSelectedCompany(''); }}
                  className="px-4 py-2 text-sm rounded-lg border border-borderColor text-textSecondary hover:bg-secondary transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={saveCustomCompany}
                  disabled={!customCompany.name}
                  className="px-4 py-2 text-sm rounded-lg bg-accentTeal text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  儲存公司
                </button>
              </div>
            </div>
          )}

          {/* Selected custom company info */}
          {selectedCompany && selectedCompany !== CUSTOM_COMPANY_ID && selectedCompany.startsWith('custom-saved-') && (
            <div className="mt-3 p-3 bg-accentTeal/5 border border-accentTeal/20 rounded-lg text-xs text-textSecondary">
              {(() => {
                const idx = parseInt(selectedCompany.replace('custom-saved-', ''), 10);
                const c = customCompanies[idx];
                if (!c) return null;
                return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div><span className="text-textSecondary">產業：</span><span className="font-medium text-textPrimary">{c.industry || '-'}</span></div>
                    <div><span className="text-textSecondary">員工人數：</span><span className="font-medium text-textPrimary">{c.employees || '-'}</span></div>
                    <div><span className="text-textSecondary">營收：</span><span className="font-medium text-textPrimary">{c.annualRevenue || '-'}</span></div>
                    <div>
                      <button
                        onClick={() => removeCustomCompany(idx)}
                        className="text-red-500 hover:text-red-600 text-xs"
                      >
                        刪除
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          <div className="flex justify-end mt-6 pt-4 border-t border-borderColor">
            <button
              onClick={handleGenerate}
              disabled={!selectedCompany || !selectedTemplate || loading}
              className={`px-8 py-3 text-sm font-medium rounded-lg transition-all ${
                !selectedCompany || !selectedTemplate
                  ? 'bg-borderColor text-textSecondary cursor-not-allowed opacity-60'
                  : 'bg-accentTeal text-white hover:opacity-90 shadow-md'
              }`}
            >
              {loading ? '生成中...' : '一鍵生成報告'}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-900/10 border border-red-500/20 rounded-lg text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
        </div>

        {/* OmniNote Reference Panel */}
        <div className="bg-secondary rounded-lg border border-borderColor p-6 mb-8 shadow-sm">
          <div
            className="border-l-4 border-accentPurple pl-4 mb-4 cursor-pointer flex items-center justify-between"
            onClick={() => setNotesExpanded(!notesExpanded)}
          >
            <div>
              <h2 className="text-base font-semibold text-textPrimary flex items-center gap-2">
                <FileText size={18} className="text-accentPurple" />
                萬能筆記參考 (OmniNote Reference)
              </h2>
              <p className="text-sm text-textSecondary mt-1">
                選擇萬能筆記作為報告生成的參考資料，AI 將融合筆記內容於 ESG 報告中
              </p>
            </div>
            <div className="flex items-center gap-2">
              {selectedNoteIds.length > 0 && (
                <span className="text-xs bg-accentPurple/20 text-accentPurple px-2 py-1 rounded-full font-medium">
                  已選 {selectedNoteIds.length} 則
                </span>
              )}
              {notesExpanded ? <ChevronUp size={18} className="text-textSecondary" /> : <ChevronDown size={18} className="text-textSecondary" />}
            </div>
          </div>

          {notesExpanded && (
            <div>
              {/* Search */}
              <div className="mb-3">
                <input
                  type="text"
                  value={noteSearchQuery}
                  onChange={(e) => setNoteSearchQuery(e.target.value)}
                  placeholder="搜尋筆記（標題、內容、標籤）..."
                  className="w-full border border-borderColor rounded-lg px-4 py-2 text-sm bg-primary text-textPrimary focus:ring-2 focus:ring-accentPurple focus:border-accentPurple outline-none transition-colors"
                />
              </div>

              {/* Selected notes summary */}
              {selectedNoteIds.length > 0 && (
                <div className="mb-3 p-3 bg-accentPurple/5 border border-accentPurple/20 rounded-lg">
                  <div className="text-xs font-medium text-accentPurple mb-2">已選取的參考筆記：</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedNoteIds.map(id => {
                      const note = notes.find(n => n.id === id);
                      return note ? (
                        <span key={id} className="inline-flex items-center gap-1 text-xs bg-accentPurple/10 text-accentPurple px-2 py-1 rounded-full">
                          {note.title}
                          <button onClick={(e) => { e.stopPropagation(); toggleNoteSelection(id); }} className="hover:text-red-500">
                            <X size={12} />
                          </button>
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {/* Notes list */}
              {loadingNotes ? (
                <div className="text-sm text-textSecondary text-center py-6">載入萬能筆記中...</div>
              ) : filteredNotes.length === 0 ? (
                <div className="text-sm text-textSecondary text-center py-6">
                  {notes.length === 0 ? '尚無筆記，請先至萬能中心建立筆記' : '無符合搜尋條件的筆記'}
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {filteredNotes.map((note) => {
                    const isSelected = selectedNoteIds.includes(note.id);
                    return (
                      <div
                        key={note.id}
                        onClick={() => toggleNoteSelection(note.id)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-accentPurple/10 border-accentPurple/40 shadow-sm'
                            : 'bg-primary border-borderColor hover:border-accentPurple/30'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleNoteSelection(note.id)}
                            className="mt-1 accent-accentPurple"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold text-textPrimary">{note.title}</span>
                              {note.fiveTGate && (
                                <span className="text-[10px] bg-accentBlue/10 text-accentBlue px-1.5 py-0.5 rounded font-medium">
                                  {note.fiveTGate}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-textSecondary line-clamp-2 mb-1.5">{note.content}</div>
                            <div className="flex gap-1 flex-wrap">
                              {note.tags.map(tag => (
                                <span key={tag} className="text-[10px] bg-accentGold/20 text-accentGold px-1.5 py-0.5 rounded-full">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Progress Panel */}
        {taskProgress && (
          <div className="bg-secondary rounded-lg border border-borderColor p-6 mb-8 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-textPrimary">生成進度</h3>
              <span className={`text-xs px-2 py-1 rounded font-medium ${
                taskProgress.status === 'completed' ? 'bg-accentGreen/20 text-accentGreen' :
                taskProgress.status === 'failed' ? 'bg-red-500/20 text-red-500' :
                'bg-accentBlue/20 text-accentBlue'
              }`}>
                {taskProgress.status === 'completed' ? '已完成' :
                 taskProgress.status === 'failed' ? '失敗' : '生成中'}
              </span>
            </div>

            <ProgressBar progress={taskProgress} />

            {/* Show reference notes info */}
            {taskProgress.noteIds && taskProgress.noteIds.length > 0 && (
              <div className="mt-3 text-xs text-accentPurple">
                參考筆記：{taskProgress.noteIds.length} 則已融合
              </div>
            )}

            {taskProgress.result && (
              <div className="mt-4 p-4 bg-primary rounded-lg border border-borderColor">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <span className="text-textSecondary">總字數</span>
                    <div className="font-semibold text-textPrimary">{taskProgress.result.totalWords.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-textSecondary">標籤數</span>
                    <div className="font-semibold text-textPrimary">{taskProgress.result.totalTags}</div>
                  </div>
                  <div>
                    <span className="text-textSecondary">耗時</span>
                    <div className="font-semibold text-textPrimary">{(taskProgress.result.durationMs / 1000).toFixed(1)}s</div>
                  </div>
                  <div>
                    <span className="text-textSecondary">Trinity Hash</span>
                    <div className="font-mono text-xs text-textPrimary truncate">{taskProgress.result.trinityHash}</div>
                  </div>
                </div>

                {taskProgress.status === 'completed' && (
                  <div className="mt-6 pt-4 border-t border-borderColor flex flex-wrap gap-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePreview('html')}
                        className={`px-4 py-2 text-sm font-medium rounded border transition-colors ${
                          previewFormat === 'html' && previewContent
                            ? 'bg-accentTeal text-white border-accentTeal'
                            : 'bg-primary border-borderColor text-textPrimary hover:bg-secondary'
                        }`}
                      >
                        {previewLoading && previewFormat === 'html' ? '載入中...' : '👁️ 預覽 HTML'}
                      </button>
                      <button
                        onClick={() => handlePreview('md')}
                        className={`px-4 py-2 text-sm font-medium rounded border transition-colors ${
                          previewFormat === 'md' && previewContent
                            ? 'bg-accentTeal text-white border-accentTeal'
                            : 'bg-primary border-borderColor text-textPrimary hover:bg-secondary'
                        }`}
                      >
                        {previewLoading && previewFormat === 'md' ? '載入中...' : '👁️ 預覽 Markdown'}
                      </button>
                    </div>
                    <div className="h-6 w-px bg-borderColor hidden sm:block self-center mx-2"></div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDownload('html')}
                        className="px-4 py-2 text-sm font-medium rounded bg-secondary border border-borderColor text-textPrimary hover:border-accentTeal transition-colors"
                      >
                        ⬇️ 下載 HTML
                      </button>
                      <button
                        onClick={() => handleDownload('md')}
                        className="px-4 py-2 text-sm font-medium rounded bg-secondary border border-borderColor text-textPrimary hover:border-accentTeal transition-colors"
                      >
                        ⬇️ 下載 Markdown
                      </button>
                      <button
                        onClick={() => {
                          if (!taskProgress?.result?.companyId) return;
                          const data = {
                            taskId: taskProgress.taskId,
                            companyId: taskProgress.result.companyId,
                            templateId: taskProgress.templateId,
                            status: taskProgress.status,
                            totalWords: taskProgress.result.totalWords,
                            totalTags: taskProgress.result.totalTags,
                            trinityHash: taskProgress.result.trinityHash,
                            durationMs: taskProgress.result.durationMs,
                            noteIds: taskProgress.noteIds,
                            customCompany: taskProgress.customCompany,
                            exportedAt: new Date().toISOString(),
                          };
                          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `sustain-report-${taskProgress.result.companyId}.json`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                        className="px-4 py-2 text-sm font-medium rounded bg-secondary border border-borderColor text-accentBlue hover:border-accentBlue transition-colors"
                      >
                        JSON
                      </button>
                      <button
                        onClick={() => {
                          if (!taskProgress?.result?.companyId) return;
                          const headers = ['task_id', 'company_id', 'template', 'status', 'total_words', 'total_tags', 'trinity_hash', 'duration_ms', 'exported_at'];
                          const row = [
                            taskProgress.taskId,
                            taskProgress.result.companyId,
                            taskProgress.templateId || 'gri',
                            taskProgress.status,
                            taskProgress.result.totalWords.toString(),
                            taskProgress.result.totalTags.toString(),
                            taskProgress.result.trinityHash,
                            taskProgress.result.durationMs.toString(),
                            new Date().toISOString(),
                          ];
                          const csv = [headers.join(','), row.join(',')].join('\n');
                          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `sustain-report-${taskProgress.result.companyId}.csv`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                        className="px-4 py-2 text-sm font-medium rounded bg-secondary border border-borderColor text-accentGold hover:border-accentGold transition-colors"
                      >
                        CSV
                      </button>
                      <button
                        onClick={evolveReport}
                        disabled={evolving}
                        className="px-4 py-2 text-sm font-medium rounded bg-secondary border border-borderColor text-accentPurple hover:border-accentPurple transition-colors disabled:opacity-50"
                      >
                        {evolving ? '進化中...' : '🧬 啟動無限進化'}
                      </button>
                    </div>
                  </div>
                )}

                {taskProgress?.result && (
                  <div className="mt-4 p-4 bg-primary rounded-lg border border-accentPurple/30">
                    <div className="text-xs font-semibold text-accentPurple mb-2">ESGGO 進化狀態</div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <div className="text-[11px] text-textSecondary">LEVEL</div>
                        <div className="text-xl font-bold text-accentGold">{evolution.level}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-textSecondary">XP</div>
                        <div className="text-xl font-bold text-accentTeal">{evolution.xp}/{evolution.nextXp}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-textSecondary">STATUS</div>
                        <div className="text-xs font-bold mt-1">{evolving ? '🧬 進化中...' : '∞ READY'}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Evidence & Knowledge Panel */}
        {selectedCompany && selectedCompany !== CUSTOM_COMPANY_ID && !selectedCompany.startsWith('custom-saved-') && evidenceCards.length > 0 && (
          <div className="bg-secondary rounded-lg border border-borderColor p-6 mb-8 shadow-sm">
            <div className="border-l-4 border-accentGold pl-4 mb-4">
              <h2 className="text-base font-semibold text-textPrimary flex items-center gap-2">
                <FileText size={18} className="text-accentGold" /> 
                企業知識庫與單據解析 (Omni-Knowledge Base)
              </h2>
              <p className="text-sm text-textSecondary mt-1">匯入的佐證資料清單與 ESGSonnar 萃取的知識小卡 (Why, What, How)</p>
            </div>
            
            <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {loadingEvidence ? (
                <div className="text-sm text-textSecondary text-center py-4">載入單據與知識點中...</div>
              ) : (
                evidenceCards.map((card) => (
                  <div key={card.id} className="bg-primary p-4 rounded-xl border border-borderColor shadow-sm transition-all hover:border-accentTeal/50">
                    <div 
                      className="flex justify-between items-center cursor-pointer"
                      onClick={() => setExpandedCardId(expandedCardId === card.id ? null : card.id)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold bg-accentTeal/10 text-accentTeal px-2 py-1 rounded">
                          {card.chapter.split(' ')[0]}
                        </span>
                        <span className="text-sm font-semibold text-textPrimary">{card.receiptName}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="hidden sm:flex gap-1">
                          {card.tags.map(tag => (
                            <span key={tag} className="text-[10px] bg-accentGold/20 text-accentGold px-2 py-[2px] rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                        {expandedCardId === card.id ? <ChevronUp size={16} className="text-textSecondary" /> : <ChevronDown size={16} className="text-textSecondary" />}
                      </div>
                    </div>

                    {expandedCardId === card.id && (
                      <div className="mt-4 pt-3 border-t border-borderColor/50 animate-in fade-in slide-in-from-top-2">
                        <div className="grid gap-3 text-[13px]">
                          <div className="bg-primary/50 p-3 rounded-lg border-l-2 border-accentTeal">
                            <span className="font-bold text-accentTeal block mb-1">Why 為什麼重要？</span>
                            <span className="text-textPrimary">{card.why}</span>
                          </div>
                          <div className="bg-primary/50 p-3 rounded-lg border-l-2 border-accentBlue">
                            <span className="font-bold text-accentBlue block mb-1">What 紀錄了什麼？</span>
                            <span className="text-textPrimary">{card.what}</span>
                          </div>
                          <div className="bg-primary/50 p-3 rounded-lg border-l-2 border-accentPurple">
                            <span className="font-bold text-accentPurple block mb-1">How 如何改善？</span>
                            <span className="text-textPrimary">{card.how}</span>
                          </div>
                        </div>
                        <div className="mt-3 text-xs font-mono text-textSecondary bg-secondary px-2 py-1 rounded inline-block">
                          HashLock: {card.hashLock.substring(0, 24)}...
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Preview Panel */}
        {previewContent && taskProgress?.status === 'completed' && (
          <div className="bg-secondary rounded-lg border border-borderColor p-6 mb-8 shadow-sm transition-all">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-borderColor">
              <h3 className="text-base font-semibold text-textPrimary">
                報告預覽 ({previewFormat === 'html' ? 'HTML' : 'Markdown'})
              </h3>
              <button
                onClick={() => {
                  setPreviewContent(null);
                  setPreviewFormat(null);
                }}
                className="text-textSecondary hover:text-textPrimary"
              >
                ✕ 關閉
              </button>
            </div>
            
            <div className="w-full bg-primary rounded border border-borderColor overflow-hidden" style={{ minHeight: '600px', maxHeight: '800px', overflowY: 'auto' }}>
              {previewFormat === 'html' ? (
                <iframe
                  srcDoc={previewContent}
                  title="HTML Preview"
                  className="w-full h-[600px] sm:h-[800px] border-none"
                  sandbox="allow-same-origin allow-scripts"
                />
              ) : (
                <pre className="p-6 text-sm font-mono text-textPrimary whitespace-pre-wrap">
                  {previewContent}
                </pre>
              )}
            </div>
          </div>
        )}

        {/* 5T Protocol Overview */}
        <div className="bg-secondary rounded-lg border border-borderColor p-6 shadow-sm">
          <h3 className="text-base font-semibold text-textPrimary mb-4">5T 協議閘門</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {(['traceable', 'transparent', 'tangible', 'trustworthy', 'trackable'] as FiveTGate[]).map((gate, i) => (
              <div key={gate} className="p-3 rounded-lg border border-borderColor bg-primary">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg font-bold text-textPrimary">{i + 1}</span>
                  <FiveTBadge gate={gate} />
                </div>
                <div className="text-xs text-textSecondary">
                  {gate === 'traceable' && '數據可溯源追蹤'}
                  {gate === 'transparent' && '算法公開可驗算'}
                  {gate === 'tangible' && '抽象願景具體化'}
                  {gate === 'trustworthy' && 'Hash Lock 不可篡改'}
                  {gate === 'trackable' && '生命週期即時記錄'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 萬能函數控制檯 */}
        <div className="bg-secondary rounded-lg border border-borderColor p-6 shadow-sm">
          <div className="border-l-4 border-accentPurple pl-4 mb-4">
            <h2 className="text-base font-semibold text-textPrimary flex items-center gap-2">
              <Wand2 size={18} className="text-accentPurple" />
              萬能函數控制檯 (Omni Function Console)
            </h2>
            <p className="text-sm text-textSecondary mt-1">
              直接呼叫 omni() 萬能函數與 omniFn 函數庫，亦可一鍵建立 5T 組件寫入 Vault
            </p>
          </div>
          <UniversalOmniConsole />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-borderColor bg-secondary mt-12 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-xs text-textSecondary">
          ESGGO v5.2 · OmniBase 萬能系統 · 深色模式 / 淺色模式無縫支援
        </div>
      </footer>
    </div>
  );
}
