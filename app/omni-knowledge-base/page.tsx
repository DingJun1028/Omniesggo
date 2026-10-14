'use client';

// ═══════════════════════════════════════════════════════════════
// /omni-knowledge-base — 萬能知識庫管理頁面
// 5T 協定: Traceable / Trackable / Tangible / Transparent / Trustworthy
// ═══════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback } from 'react';
import {
  Database, Lock, ShieldCheck, Copy, Check, RefreshCw,
  Plus, X, Eye, FileText, Server, GitBranch,
  Activity, Layers, Tag, Clock
} from 'lucide-react';

// ── 型別定義 ──
interface KnowledgeBase {
  uuid: string;
  name: string;
  description: string;
  version: string;
  status: 'draft' | 'active' | 'archived' | 'sealed';
  locked: boolean;
  tags: string[];
  source_origin: string;
  createdAt: number;
  updatedAt: number;
  sealedAt?: number;
  hashLock?: string;
  evidence: Record<string, string>;
}

interface KnowledgeSource {
  uuid: string;
  name: string;
  storage: string;
  path: string;
  source_origin: string;
  version: string;
  registeredAt: number;
  contentHash: string;
}

interface DeploymentTarget {
  uuid: string;
  type: string;
  path: string;
  registeredAt: number;
  contentHash: string;
}

interface RegistryEntry {
  base: KnowledgeBase;
  sources: KnowledgeSource[];
  targets: DeploymentTarget[];
  lifecycle: Array<{
    action: string;
    timestamp: number;
    detail: string;
  }>;
}

interface Metrics {
  totalBases: number;
  sealedBases: number;
  activeBases: number;
  draftBases: number;
  totalSources: number;
  totalTargets: number;
  lifecycleEvents: number;
}

// ── API 客戶端 ──
async function fetchBases(): Promise<{ bases: KnowledgeBase[]; metrics: Metrics; lifecycleCount: number }> {
  const res = await fetch('/api/omni-knowledge-base');
  if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
  const json = await res.json();
  return { bases: json.bases || [], metrics: json.metrics, lifecycleCount: json.lifecycleCount || 0 };
}

async function fetchRegistry(uuid: string): Promise<RegistryEntry> {
  const res = await fetch(`/api/omni-knowledge-base/${uuid}`);
  if (!res.ok) throw new Error(`Failed to fetch registry: ${res.status}`);
  const json = await res.json();
  return json.registry;
}

async function sealBase(uuid: string): Promise<{ hashLock: string; sealedAt: number }> {
  const res = await fetch(`/api/omni-knowledge-base/${uuid}/seal`, { method: 'POST' });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Seal failed');
  }
  const json = await res.json();
  return { hashLock: json.hashLock, sealedAt: json.sealedAt };
}

async function verifyBase(uuid: string): Promise<{ verified: boolean; hashLock: string }> {
  const res = await fetch(`/api/omni-knowledge-base/${uuid}/verify`);
  if (!res.ok) throw new Error('Verify failed');
  const json = await res.json();
  return { verified: json.verified, hashLock: json.hashLock };
}

async function registerBase(data: {
  name: string;
  description: string;
  source_origin: string;
  version?: string;
  sources?: Array<{ name: string; storage: string; path: string; source_origin: string }>;
  targets?: Array<{ type: string; path: string }>;
}): Promise<KnowledgeBase> {
  const res = await fetch('/api/omni-knowledge-base', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Register failed');
  }
  const json = await res.json();
  return json;
}

// ── 工具函式 ──
function truncateHash(hash: string): string {
  if (!hash || hash.length < 20) return hash;
  return `${hash.slice(0, 10)}...${hash.slice(-6)}`;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleString('zh-TW', { hour12: false });
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  draft: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400', label: '草稿' },
  active: { bg: 'bg-emerald-50 dark:bg-emerald-950/50', text: 'text-emerald-700 dark:text-emerald-300', label: '活躍' },
  archived: { bg: 'bg-amber-50 dark:bg-amber-950/50', text: 'text-amber-700 dark:text-amber-300', label: '歸檔' },
  sealed: { bg: 'bg-teal-50 dark:bg-teal-950/50', text: 'text-teal-700 dark:text-teal-300', label: '已封存' },
};

// ═══════════════════════════════════════════════════════════════
// 主元件
// ═══════════════════════════════════════════════════════════════
export default function OmniKnowledgeBasePage() {
  const [bases, setBases] = useState<KnowledgeBase[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [lifecycleCount, setLifecycleCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);
  const [registry, setRegistry] = useState<RegistryEntry | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [verifyResult, setVerifyResult] = useState<{ uuid: string; verified: boolean } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBases();
      setBases(data.bases);
      setMetrics(data.metrics);
      setLifecycleCount(data.lifecycleCount);
    } catch (e) {
      setError(e instanceof Error ? e.message : '載入失敗');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSelect = async (uuid: string) => {
    if (selectedUuid === uuid) {
      setSelectedUuid(null);
      setRegistry(null);
      return;
    }
    setSelectedUuid(uuid);
    setRegistry(null);
    try {
      const reg = await fetchRegistry(uuid);
      setRegistry(reg);
    } catch (e) {
      setError(e instanceof Error ? e.message : '載入註冊資訊失敗');
    }
  };

  const handleSeal = async (uuid: string) => {
    setActionLoading(uuid);
    try {
      await sealBase(uuid);
      await loadData();
      if (selectedUuid === uuid) {
        const reg = await fetchRegistry(uuid);
        setRegistry(reg);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '封存失敗');
    } finally {
      setActionLoading(null);
    }
  };

  const handleVerify = async (uuid: string) => {
    setActionLoading(uuid);
    try {
      const result = await verifyBase(uuid);
      setVerifyResult({ uuid, verified: result.verified });
    } catch (e) {
      setError(e instanceof Error ? e.message : '驗證失敗');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCopy = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleRegister = async (data: Parameters<typeof registerBase>[0]) => {
    setActionLoading('register');
    try {
      await registerBase(data);
      setShowRegister(false);
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : '註冊失敗');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-white/10 px-6 py-4">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-teal-50 text-teal-800 border border-teal-200/90 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-500/30">
                A02 · KNOWLEDGE-BASE
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/90 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-pulse" />
                5T 合規
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-2">
              <Database className="w-7 h-7 text-teal-600 dark:text-cyan-400" />
              萬能知識庫 (Knowledge Base Registry)
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              可溯源 · 可追蹤 · 可感知 · 可透明 · 不可篡改
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              disabled={loading}
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              重新載入
            </button>
            <button
              onClick={() => setShowRegister(true)}
              className="px-3.5 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              註冊知識庫
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-6 space-y-6">
        {/* Error banner */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-xl px-4 py-3 text-sm text-red-800 dark:text-red-300 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Metrics cards */}
        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { label: '總知識庫', value: metrics.totalBases, icon: Layers, color: 'text-teal-700 dark:text-cyan-400' },
              { label: '已封存', value: metrics.sealedBases, icon: Lock, color: 'text-emerald-700 dark:text-emerald-400' },
              { label: '活躍', value: metrics.activeBases, icon: Activity, color: 'text-blue-700 dark:text-blue-400' },
              { label: '草稿', value: metrics.draftBases, icon: FileText, color: 'text-slate-600 dark:text-slate-400' },
              { label: '來源數', value: metrics.totalSources, icon: Server, color: 'text-purple-700 dark:text-purple-400' },
              { label: '部署目標', value: metrics.totalTargets, icon: GitBranch, color: 'text-amber-700 dark:text-amber-400' },
              { label: '生命週期事件', value: metrics.lifecycleEvents, icon: Clock, color: 'text-rose-700 dark:text-rose-400' },
            ].map((m) => (
              <div key={m.label} className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-1.5 mb-1">
                  <m.icon className={`w-3.5 h-3.5 ${m.color}`} />
                  <span className="text-xs text-slate-500 dark:text-slate-400">{m.label}</span>
                </div>
                <p className={`text-2xl font-bold font-mono ${m.color}`}>{m.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Loading state */}
        {loading && bases.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
            <p className="text-sm">載入中...</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && bases.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-2xl">
            <Database className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">尚無知識庫</p>
            <button
              onClick={() => setShowRegister(true)}
              className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              註冊第一個知識庫
            </button>
          </div>
        )}

        {/* Knowledge base list */}
        {bases.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              知識庫清單 ({bases.length})
            </h2>
            {bases.map((kb) => {
              const isSelected = selectedUuid === kb.uuid;
              const style = STATUS_STYLES[kb.status] || STATUS_STYLES.draft;
              const isLoading = actionLoading === kb.uuid;
              const verified = verifyResult?.uuid === kb.uuid ? verifyResult.verified : null;

              return (
                <div key={kb.uuid} className={`bg-white dark:bg-slate-900/60 border rounded-2xl shadow-sm transition-all ${isSelected ? 'border-teal-300 dark:border-teal-600/50 ring-1 ring-teal-200 dark:ring-teal-800/50' : 'border-slate-200 dark:border-white/10'}`}>
                  {/* Card header */}
                  <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer" onClick={() => handleSelect(kb.uuid)}>
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">{kb.name}</span>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${style.bg} ${style.text}`}>
                          {style.label}
                        </span>
                        {kb.locked && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-300 flex items-center gap-0.5">
                            <Lock className="w-2.5 h-2.5" /> LOCKED
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-slate-400">v{kb.version}</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{kb.description}</p>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                        <span>{kb.uuid}</span>
                        <span>{formatTime(kb.createdAt)}</span>
                        {kb.source_origin && <span className="text-teal-600 dark:text-teal-400">{kb.source_origin}</span>}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {!kb.locked && (
                        <button
                          onClick={() => handleSeal(kb.uuid)}
                          disabled={isLoading}
                          className="px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:hover:bg-teal-900 dark:text-teal-300 text-xs font-semibold flex items-center gap-1 transition-colors disabled:opacity-50"
                        >
                          <Lock className="w-3 h-3" />
                          {isLoading ? '封存中...' : '封存'}
                        </button>
                      )}
                      <button
                        onClick={() => handleVerify(kb.uuid)}
                        disabled={isLoading}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors disabled:opacity-50"
                      >
                        <ShieldCheck className="w-3 h-3" />
                        驗證
                      </button>
                      {verified !== null && (
                        <span className={`text-xs font-bold ${verified ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                          {verified ? ' 通過' : '✗ 失敗'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Hash lock bar */}
                  {kb.hashLock && (
                    <div className="px-4 pb-3">
                      <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg">
                        <Lock className="w-3 h-3 text-teal-600 dark:text-cyan-400 shrink-0" />
                        <span className="font-mono text-[10px] text-slate-600 dark:text-slate-300 truncate">
                          {truncateHash(kb.hashLock)}
                        </span>
                        <button onClick={() => handleCopy(kb.hashLock!)} className="ml-auto text-slate-400 hover:text-teal-600 dark:hover:text-cyan-300 shrink-0">
                          {copiedHash === kb.hashLock ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Expanded registry detail */}
                  {isSelected && registry && (
                    <div className="border-t border-slate-200 dark:border-slate-800 p-4 space-y-4 bg-slate-50/50 dark:bg-slate-950/30">
                      {/* Tags */}
                      {registry.base.tags.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Tag className="w-3 h-3 text-slate-400" />
                          {registry.base.tags.map((t) => (
                            <span key={t} className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">{t}</span>
                          ))}
                        </div>
                      )}

                      {/* Sources */}
                      {registry.sources.length > 0 && (
                        <div>
                          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                            <Server className="w-3 h-3" /> 來源 ({registry.sources.length})
                          </h4>
                          <div className="space-y-1.5">
                            {registry.sources.map((s) => (
                              <div key={s.uuid} className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs">
                                <div>
                                  <span className="font-semibold text-slate-800 dark:text-slate-200">{s.name}</span>
                                  <span className="ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">{s.storage}</span>
                                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">{s.path}</p>
                                </div>
                                <span className="font-mono text-[10px] text-slate-400">{truncateHash(s.contentHash)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Targets */}
                      {registry.targets.length > 0 && (
                        <div>
                          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                            <GitBranch className="w-3 h-3" /> 部署目標 ({registry.targets.length})
                          </h4>
                          <div className="space-y-1.5">
                            {registry.targets.map((t) => (
                              <div key={t.uuid} className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs">
                                <div>
                                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300">{t.type}</span>
                                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">{t.path}</p>
                                </div>
                                <span className="font-mono text-[10px] text-slate-400">{truncateHash(t.contentHash)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Lifecycle events */}
                      {registry.lifecycle.length > 0 && (
                        <div>
                          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                            <Clock className="w-3 h-3" /> 生命週期 ({registry.lifecycle.length})
                          </h4>
                          <div className="space-y-1">
                            {registry.lifecycle.map((ev, i) => (
                              <div key={i} className="flex items-center gap-2 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0" />
                                <span className="font-bold text-slate-700 dark:text-slate-300">{ev.action}</span>
                                <span>{ev.detail}</span>
                                <span className="ml-auto text-slate-400">{formatTime(ev.timestamp)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Register modal */}
      {showRegister && (
        <RegisterModal
          onSubmit={handleRegister}
          onClose={() => setShowRegister(false)}
          loading={actionLoading === 'register'}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 註冊表單 Modal
// ═══════════════════════════════════════════════════════════════
function RegisterModal({
  onSubmit,
  onClose,
  loading,
}: {
  onSubmit: (data: {
    name: string;
    description: string;
    source_origin: string;
    version?: string;
    sources?: Array<{ name: string; storage: string; path: string; source_origin: string }>;
    targets?: Array<{ type: string; path: string }>;
  }) => void;
  onClose: () => void;
  loading: boolean;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sourceOrigin, setSourceOrigin] = useState('');
  const [version, setVersion] = useState('1.0.0');
  const [sourceName, setSourceName] = useState('');
  const [sourceStorage, setSourceStorage] = useState('obsidian');
  const [sourcePath, setSourcePath] = useState('');
  const [targetType, setTargetType] = useState('filesystem');
  const [targetPath, setTargetPath] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description || !sourceOrigin) return;

    const data: Parameters<typeof onSubmit>[0] = { name, description, source_origin: sourceOrigin, version };
    if (sourceName && sourcePath) {
      data.sources = [{ name: sourceName, storage: sourceStorage, path: sourcePath, source_origin: sourceOrigin }];
    }
    if (targetPath) {
      data.targets = [{ type: targetType, path: targetPath }];
    }
    onSubmit(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">註冊新知識庫</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Field label="名稱 *" >
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. OmniOne 萬能筆記"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:focus:ring-cyan-500"
            />
          </Field>

          <Field label="描述 *">
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              placeholder="知識庫用途描述"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:focus:ring-cyan-500"
            />
          </Field>

          <Field label="來源路徑 (source_origin) *">
            <input
              type="text"
              value={sourceOrigin}
              onChange={(e) => setSourceOrigin(e.target.value)}
              required
              placeholder="/omniione萬能筆記"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 dark:focus:ring-cyan-500"
            />
          </Field>

          <Field label="版本">
            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 dark:focus:ring-cyan-500"
            />
          </Field>

          <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">來源（選填）</h4>
            <div className="grid grid-cols-2 gap-3">
              <Field label="來源名稱">
                <input
                  type="text"
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                  placeholder="Obsidian 源"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </Field>
              <Field label="儲存類型">
                <select
                  value={sourceStorage}
                  onChange={(e) => setSourceStorage(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="obsidian">obsidian</option>
                  <option value="filesystem">filesystem</option>
                  <option value="tencentdb">tencentdb</option>
                  <option value="gbrain">gbrain</option>
                </select>
              </Field>
            </div>
            <div className="mt-3">
              <Field label="來源路徑">
                <input
                  type="text"
                  value={sourcePath}
                  onChange={(e) => setSourcePath(e.target.value)}
                  placeholder="/vault/omni-one"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </Field>
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">部署目標（選填）</h4>
            <div className="grid grid-cols-2 gap-3">
              <Field label="目標類型">
                <select
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="filesystem">filesystem</option>
                  <option value="obsidian">obsidian</option>
                  <option value="filesystem-git">filesystem-git</option>
                  <option value="tencentdb">tencentdb</option>
                </select>
              </Field>
              <Field label="目標路徑">
                <input
                  type="text"
                  value={targetPath}
                  onChange={(e) => setTargetPath(e.target.value)}
                  placeholder="/c/Project/omniesggo/..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </Field>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading || !name || !description || !sourceOrigin}
              className="px-4 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '註冊中...' : '註冊'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Field wrapper ──
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">{label}</span>
      {children}
    </label>
  );
}
