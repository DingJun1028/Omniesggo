'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

// ═══════════════════════════════════════════════════════════════
// System Platform Resources — 系統平臺資源項目
// Solid Card Design System (Teal #009EB0 / Gold #D4AF37 / ZKP Blue #3B82F6)
// ═══════════════════════════════════════════════════════════════

interface ModuleResource {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
  route: string;
  description: string;
  category: 'core' | 'report' | 'governance' | 'intelligence' | 'system';
  status: 'active' | 'beta' | 'planned';
  apiEndpoints: string[];
  dependencies: string[];
}

interface AIModel {
  id: string;
  name: string;
  tier: 'free' | 'paid';
  speed: 'fast' | 'medium' | 'slow';
  contextWindow: string;
  specialty: string;
}

interface AIModelResource {
  provider: string;
  models: AIModel[];
  apiKeyEnv: string;
  rateLimit: string;
  status: 'active' | 'configured' | 'unconfigured';
}

interface InfraResource {
  id: string;
  name: string;
  icon: string;
  type: 'database' | 'cache' | 'auth' | 'compute' | 'storage' | 'monitoring';
  provider: string;
  tier: string;
  status: 'healthy' | 'degraded' | 'offline' | 'optional';
  description: string;
  configKey: string;
}

interface ResourcesData {
  timestamp: number;
  platform: string;
  version: string;
  modules: ModuleResource[];
  aiModels: AIModelResource[];
  infrastructure: InfraResource[];
  summary: {
    totalModules: number;
    activeModules: number;
    totalAIModels: number;
    freeAIModels: number;
    totalInfra: number;
    healthyInfra: number;
  };
}

// ── Reusable Components ─────────────────────────────────────

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full ${
        ok
          ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]'
          : 'bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.6)]'
      }`}
    />
  );
}

function Card({
  title,
  icon,
  children,
  accent = 'teal',
  action,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
  accent?: string;
  action?: React.ReactNode;
}) {
  const borderMap: Record<string, string> = {
    teal: 'border-l-[#009EB0]',
    gold: 'border-l-[#D4AF37]',
    blue: 'border-l-[#3B82F6]',
    purple: 'border-l-[#8B5CF6]',
    green: 'border-l-emerald-500',
  };
  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 border-l-4 ${
        borderMap[accent] || borderMap.teal
      } p-5 shadow-sm hover:shadow-md transition-shadow`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <h3 className="font-bold text-sm text-gray-800 dark:text-gray-100">{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function Badge({
  children,
  color = 'teal',
}: {
  children: React.ReactNode;
  color?: string;
}) {
  const colorMap: Record<string, string> = {
    teal: 'bg-[#009EB0]/15 text-[#009EB0]',
    gold: 'bg-[#D4AF37]/15 text-[#D4AF37]',
    blue: 'bg-[#3B82F6]/15 text-[#3B82F6]',
    green: 'bg-emerald-500/15 text-emerald-500',
    red: 'bg-red-500/15 text-red-500',
    gray: 'bg-gray-500/15 text-gray-500',
    purple: 'bg-purple-500/15 text-purple-500',
  };
  return (
    <span
      className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-md ${
        colorMap[color] || colorMap.teal
      }`}
    >
      {children}
    </span>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009EB0] focus-visible:ring-offset-2 sm:px-4 ${
        active
          ? 'bg-[#009EB0] text-white shadow-lg shadow-[#009EB0]/25'
          : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700'
      }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
      <span
        className={`text-[11px] px-1.5 py-0.5 rounded-full ${
          active
            ? 'bg-white/20 text-white'
            : 'bg-gray-200 dark:bg-slate-600 text-gray-500 dark:text-gray-400'
        }`}
      >
        {count}
      </span>
    </button>
  );
}

// ── Category Labels ─────────────────────────────────────────

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  core: { label: '核心', color: 'teal' },
  report: { label: '報告', color: 'green' },
  governance: { label: '治理', color: 'purple' },
  intelligence: { label: '情報', color: 'gold' },
  system: { label: '系統', color: 'blue' },
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: '啟用', color: 'green' },
  beta: { label: 'Beta', color: 'gold' },
  planned: { label: '規劃中', color: 'gray' },
};

const INFRA_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  healthy: { label: '正常', color: 'green' },
  degraded: { label: '降級', color: 'gold' },
  offline: { label: '離線', color: 'red' },
  optional: { label: '可選', color: 'gray' },
};

const INFRA_TYPE_LABELS: Record<string, { label: string; icon: string }> = {
  database: { label: '資料庫', icon: '🗄️' },
  cache: { label: '快取', icon: '⚡' },
  auth: { label: '認證', icon: '🔐' },
  compute: { label: '運算', icon: '🖥️' },
  storage: { label: '儲存', icon: '📦' },
  monitoring: { label: '監控', icon: '📡' },
};

const SPEED_LABELS: Record<string, { label: string; color: string }> = {
  fast: { label: 'Fast', color: 'green' },
  medium: { label: 'Medium', color: 'gold' },
  slow: { label: 'Slow', color: 'red' },
};

// ═══════════════════════════════════════════════════════════════
// Main Page
// ═══════════════════════════════════════════════════════════════

export default function ResourcesPage() {
  const [data, setData] = useState<ResourcesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'modules' | 'ai' | 'infra'>('modules');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [evolution, setEvolution] = useState({ level: 1, xp: 0, nextXp: 120 });
  const [evolving, setEvolving] = useState(false);

  const fetchResources = useCallback(async () => {
    try {
      const res = await fetch('/api/resources', { signal: AbortSignal.timeout(10000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const payload: unknown = await res.json();
      if (!payload || typeof payload !== 'object') {
        throw new Error('資源服務回傳格式不正確');
      }
      const envelope = payload as { success?: boolean; data?: unknown };
      const source = envelope.data && typeof envelope.data === 'object' ? envelope.data : payload;
      const raw = source as Partial<ResourcesData>;
      const modules = Array.isArray(raw.modules) ? raw.modules : [];
      const aiModels = Array.isArray(raw.aiModels) ? raw.aiModels : [];
      const infrastructure = Array.isArray(raw.infrastructure) ? raw.infrastructure : [];
      const d: ResourcesData = {
        timestamp: typeof raw.timestamp === 'number' ? raw.timestamp : Date.now(),
        platform: typeof raw.platform === 'string' ? raw.platform : 'ESGGO',
        version: typeof raw.version === 'string' ? raw.version : '—',
        modules,
        aiModels,
        infrastructure,
        summary: {
          totalModules: modules.length,
          activeModules: modules.filter((item) => item?.status === 'active').length,
          totalAIModels: aiModels.reduce((sum, provider) => sum + (Array.isArray(provider?.models) ? provider.models.length : 0), 0),
          freeAIModels: aiModels.reduce((sum, provider) => sum + (Array.isArray(provider?.models) ? provider.models.filter((model) => model?.tier === 'free').length : 0), 0),
          totalInfra: infrastructure.length,
          healthyInfra: infrastructure.filter((item) => item?.status === 'healthy').length,
        },
      };
      setData(d);
      setLastUpdate(new Date());
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '載入資源資料失敗');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  // ── Modules Tab ─────────────────────────────────────────

  const renderModules = () => {
    if (!data) return null;

    const categories = ['all', ...new Set(data.modules.map(m => m.category))];
    const filtered =
      moduleFilter === 'all'
        ? data.modules
        : data.modules.filter(m => m.category === moduleFilter);

    return (
      <div>
        {/* Filter Bar */}
        <div className="flex flex-wrap gap-2 mb-5">
          {categories.map(cat => {
            const label = cat === 'all' ? '全部' : CATEGORY_LABELS[cat]?.label || cat;
            const count =
              cat === 'all'
                ? data.modules.length
                : data.modules.filter(m => m.category === cat).length;
            return (
              <button
                type="button"
                key={cat}
                aria-pressed={moduleFilter === cat}
                onClick={() => setModuleFilter(cat)}
                className={`min-h-11 rounded-lg px-3 py-2 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009EB0] focus-visible:ring-offset-2 ${
                  moduleFilter === cat
                    ? 'bg-[#009EB0] text-white'
                    : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700'
                }`}
              >
                {label} ({count})
              </button>
            );
          })}
        </div>

        {/* Module Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(mod => {
            const catInfo = CATEGORY_LABELS[mod.category];
            const statusInfo = STATUS_LABELS[mod.status];
            return (
              <Link key={mod.id} href={mod.route} className="block group">
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5 shadow-sm hover:shadow-lg hover:border-[#009EB0]/50 transition-all h-full">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{mod.icon}</span>
                      <div>
                        <h3 className="font-bold text-sm text-gray-800 dark:text-gray-100 group-hover:text-[#009EB0] transition-colors">
                          {mod.name}
                        </h3>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500">
                          {mod.nameEn}
                        </p>
                      </div>
                    </div>
                    <Badge color={statusInfo?.color}>{statusInfo?.label}</Badge>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
                    {mod.description}
                  </p>

                  {/* Category & Route */}
                  <div className="flex items-center gap-2 mb-3">
                    <Badge color={catInfo?.color}>{catInfo?.label}</Badge>
                    <span className="text-[10px] font-mono text-gray-400 dark:text-gray-500">
                      {mod.route}
                    </span>
                  </div>

                  {/* API Endpoints */}
                  {mod.apiEndpoints.length > 0 && (
                    <div className="mb-3">
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-1">
                        API Endpoints ({mod.apiEndpoints.length})
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {mod.apiEndpoints.slice(0, 3).map((ep, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-mono bg-gray-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300"
                          >
                            {ep}
                          </span>
                        ))}
                        {mod.apiEndpoints.length > 3 && (
                          <span className="text-[10px] text-gray-400">
                            +{mod.apiEndpoints.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Dependencies */}
                  <div className="flex flex-wrap gap-1">
                    {mod.dependencies.map((dep, i) => (
                      <span
                        key={i}
                        className="text-[10px] bg-[#009EB0]/10 text-[#009EB0] px-1.5 py-0.5 rounded"
                      >
                        {dep}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    );
  };

  // ── AI Models Tab ───────────────────────────────────────

  const renderAIModels = () => {
    if (!data) return null;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {data.aiModels.map(provider => {
          const isConfigured = provider.status === 'configured';
          return (
            <Card
              key={provider.provider}
              title={provider.provider}
              icon={
                provider.provider === 'Groq'
                  ? '⚡'
                  : provider.provider === 'OpenRouter'
                  ? '🔀'
                  : '💎'
              }
              accent={
                provider.provider === 'Groq'
                  ? 'gold'
                  : provider.provider === 'OpenRouter'
                  ? 'blue'
                  : 'teal'
              }
            >
              {/* Provider Status */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <StatusDot ok={isConfigured} />
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    {isConfigured ? 'Configured' : 'Unconfigured'}
                  </span>
                </div>
                <Badge color={isConfigured ? 'green' : 'red'}>
                  {provider.rateLimit}
                </Badge>
              </div>

              {/* API Key Env */}
              <div className="text-[10px] font-mono text-gray-400 dark:text-gray-500 mb-3 bg-gray-50 dark:bg-slate-900 px-2 py-1 rounded">
                ENV: {provider.apiKeyEnv}
              </div>

              {/* Models List */}
              <div className="space-y-2">
                {provider.models.map(model => {
                  const speedInfo = SPEED_LABELS[model.speed];
                  return (
                    <div
                      key={model.id}
                      className="bg-gray-50 dark:bg-slate-900 rounded-lg p-3 border border-gray-100 dark:border-slate-700"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
                          {model.name}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <Badge color={model.tier === 'free' ? 'green' : 'gold'}>
                            {model.tier}
                          </Badge>
                          <Badge color={speedInfo?.color}>{speedInfo?.label}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">
                          {model.specialty}
                        </span>
                        <span className="text-[10px] font-mono text-gray-500 dark:text-gray-400">
                          {model.contextWindow}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>
    );
  };

  // ── Infrastructure Tab ──────────────────────────────────

  const renderInfrastructure = () => {
    if (!data) return null;

    // Group by type
    const grouped = data.infrastructure.reduce(
      (acc, item) => {
        if (!acc[item.type]) acc[item.type] = [];
        acc[item.type].push(item);
        return acc;
      },
      {} as Record<string, InfraResource[]>,
    );

    return (
      <div className="space-y-6">
        {Object.entries(grouped).map(([type, items]) => {
          const typeInfo = INFRA_TYPE_LABELS[type] || { label: type, icon: '📦' };
          return (
            <div key={type}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base">{typeInfo.icon}</span>
                <h3 className="font-bold text-sm text-gray-800 dark:text-gray-100">
                  {typeInfo.label}
                </h3>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  ({items.length})
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map(infra => {
                  const statusInfo = INFRA_STATUS_LABELS[infra.status];
                  return (
                    <div
                      key={infra.id}
                      className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{infra.icon}</span>
                          <div>
                            <h4 className="text-sm font-bold text-gray-800 dark:text-gray-100">
                              {infra.name}
                            </h4>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500">
                              {infra.provider}
                            </p>
                          </div>
                        </div>
                        <Badge color={statusInfo?.color}>{statusInfo?.label}</Badge>
                      </div>

                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 leading-relaxed">
                        {infra.description}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-slate-700">
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">
                          Tier: {infra.tier}
                        </span>
                        <span className="text-[10px] font-mono text-gray-400 dark:text-gray-500">
                          {infra.configKey}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ── Main Render ─────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-5 dark:bg-slate-900 sm:px-6 sm:py-6">
    <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#009EB0] flex items-center justify-center text-white font-bold text-lg">
              R
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800 dark:text-white sm:text-xl">
                系統平台資源項目 ∞ Evolution
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                System Platform Resources — Modules, AI Models, Infrastructure · 永續發展無限進化
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 sm:justify-end">
            {lastUpdate && (
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {lastUpdate.toLocaleTimeString('zh-TW')}
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                void fetchResources();
              }}
              disabled={loading}
              className="min-h-11 rounded-lg bg-[#009EB0] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#007d8f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009EB0] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
            >
              {loading ? '載入中…' : '重新整理'}
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        {data && (
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 text-center">
              <p className="text-2xl font-bold text-[#009EB0]">{data.summary.totalModules}</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">功能模組</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 text-center">
              <p className="text-2xl font-bold text-emerald-500">{data.summary.activeModules}</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">啟用中</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 text-center">
              <p className="text-2xl font-bold text-[#3B82F6]">{data.summary.totalAIModels}</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">AI 模型</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 text-center">
              <p className="text-2xl font-bold text-[#D4AF37]">{data.summary.freeAIModels}</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">免費模型</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 text-center">
              <p className="text-2xl font-bold text-purple-500">{data.summary.totalInfra}</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">基礎設施</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 text-center">
              <p className="text-2xl font-bold text-emerald-500">{data.summary.healthyInfra}</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">健康狀態</p>
            </div>
          </div>
        )}

        {/* ESGGO Resources 進化 */}
        <div className="mb-6 rounded-xl border border-[#8B5CF6]/40 bg-[#8B5CF6]/10 p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-gray-700 dark:text-gray-200">🧬 ESGGO Resources 進化</div>
            <div className="flex gap-4 mt-1">
              <div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400">LEVEL</div>
                <div className="text-xl font-bold text-[#D4AF37]">{evolution.level}</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400">XP</div>
                <div className="text-xl font-bold text-[#009EB0]">{evolution.xp}/{evolution.nextXp}</div>
              </div>
            </div>
          </div>
          <button
            onClick={async () => {
              if (evolving) return;
              setEvolving(true);
              try {
                await new Promise(r => setTimeout(r, 500));
                setEvolution(prev => {
                  const xp = prev.xp + 20;
                  let level = prev.level;
                  let nextXp = prev.nextXp;
                  while (xp >= nextXp) { level += 1; nextXp = Math.floor(nextXp * 1.2); }
                  return { level, xp: xp % nextXp, nextXp };
                });
              } finally { setEvolving(false); }
            }}
            disabled={evolving}
            className="px-4 py-2 rounded-lg text-xs font-bold border transition-colors disabled:opacity-70"
            style={{
              background: evolving ? '#E2E8F0' : 'rgba(139,92,246,0.15)',
              color: '#8B5CF6',
              borderColor: 'rgba(139,92,246,0.5)',
            }}
          >
            {evolving ? '🧬 進化中...' : '🧬 啟動 Resources 進化'}
          </button>
        </div>

        {/* Tab Navigation */}
        <div role="tablist" aria-label="資源分類" className="mb-6 flex gap-2 overflow-x-auto pb-1 sm:gap-3">
          <TabButton
            active={activeTab === 'modules'}
            onClick={() => setActiveTab('modules')}
            icon="📦"
            label="功能模組"
            count={data?.summary.totalModules || 0}
          />
          <TabButton
            active={activeTab === 'ai'}
            onClick={() => setActiveTab('ai')}
            icon="🧠"
            label="AI 模型"
            count={data?.summary.totalAIModels || 0}
          />
          <TabButton
            active={activeTab === 'infra'}
            onClick={() => setActiveTab('infra')}
            icon="🏗️"
            label="基礎設施"
            count={data?.summary.totalInfra || 0}
          />
        </div>

        {/* Error Banner */}
        {error && (
          <div role="alert" className="mb-4 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200 sm:flex-row sm:items-center sm:justify-between">
            <p>{error}。可重試載入，或先檢查資源 API。</p>
            <button type="button" onClick={() => { setLoading(true); void fetchResources(); }} className="min-h-10 rounded-lg border border-amber-300 px-3 font-semibold hover:bg-amber-100 dark:border-amber-700 dark:hover:bg-amber-900/40">重新載入</button>
          </div>
        )}

        {/* Loading */}
        {loading && !data && (
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 border-2 border-[#009EB0] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm text-gray-400 dark:text-gray-500">Loading resources...</p>
          </div>
        )}

        {/* Content */}
        {data && (
          <>
            {activeTab === 'modules' && renderModules()}
            {activeTab === 'ai' && renderAIModels()}
            {activeTab === 'infra' && renderInfrastructure()}
            {((activeTab === 'modules' && data.modules.length === 0) || (activeTab === 'ai' && data.aiModels.length === 0) || (activeTab === 'infra' && data.infrastructure.length === 0)) && (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-5 py-12 text-center dark:border-slate-700 dark:bg-slate-800">
                <p className="text-base font-semibold text-gray-800 dark:text-white">目前沒有可顯示的資源</p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">資料可能尚未設定，請稍後重新載入。</p>
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-400 dark:text-gray-500">
          System Platform Resources v1.0 | {data?.platform} {data?.version} | {data?.summary.totalModules} modules, {data?.summary.totalAIModels} AI models, {data?.summary.totalInfra} infra components
        </div>
      </div>
    </div>
  );
}
