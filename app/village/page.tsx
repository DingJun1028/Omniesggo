'use client';
import { useState, useEffect } from 'react';
import { Leaf, Heart, TrendingUp, ShieldCheck, Clock, Activity, Minus, Plus, Trophy } from 'lucide-react';
import { OmniCard, OmniCardContent } from '@/components/omni-base/OmniCard';
import { OmniButton } from '@/components/omni-base/OmniButton';
import { OmniBadge } from '@/components/omni-base/OmniBadge';

interface Project {
  id: string;
  title: string;
  description: string;
  current_points: number;
  goal_points: number;
  status: string;
  tags: string[];
}

interface Member {
  user_id: string;
  name: string;
  title: string;
  points: number;
  avatar: string;
}

interface ActivityLog {
  id: string;
  time: string;
  message: string;
}

export default function VillagePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [omniTrend, setOmniTrend] = useState<string | null>(null);
  const [isGeneratingTrend, setIsGeneratingTrend] = useState(false);
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [activities, setActivities] = useState<ActivityLog[]>([]);

  const [isVoting, setIsVoting] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/village/data');
        if (!res.ok) throw new Error('無法取得資料');
        const data: unknown = await res.json();
        if (data && typeof data === 'object' && 'success' in data && data.success) {
          const payload = data as { success?: unknown; projects?: unknown; members?: unknown; activities?: unknown; error?: unknown };
          setProjects(Array.isArray(payload.projects) ? payload.projects as Project[] : []);
          setMembers(Array.isArray(payload.members) ? payload.members as Member[] : []);
          setActivities(Array.isArray(payload.activities) ? payload.activities as ActivityLog[] : []);
          setLoading(false);
        } else {
          const message = data && typeof data === 'object' && 'error' in data ? String(data.error ?? '資料回應格式錯誤') : '資料回應格式錯誤';
          throw new Error(message);
        }
      } catch (err: unknown) {
        console.error('Fetch error:', err);
        setFetchError('無法取得即時資料');
        setLoading(false);
      }
    }

    let pollInterval: NodeJS.Timeout;
    async function initializeAndListen() {
      await fetchData();
      pollInterval = setInterval(fetchData, 5000);
    }

    async function fetchTrend() {
      setIsGeneratingTrend(true);
      try {
        const res = await fetch('/api/village/trends');
        const data = await res.json();
        setOmniTrend(data.trend);
      } catch (e) {
        console.error('Failed to fetch trend', e);
      } finally {
        setIsGeneratingTrend(false);
      }
    }

    initializeAndListen();
    fetchTrend();

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const getVotes = (projectId: string) => voteCounts[projectId] || 1;
  const getCost = (votes: number) => votes * votes * 10;

  const adjustVotes = (projectId: string, delta: number) => {
    setVoteCounts((prev) => {
      const current = prev[projectId] || 1;
      const next = Math.max(1, current + delta);
      return { ...prev, [projectId]: next };
    });
  };

  const handleVote = async (projectId: string) => {
    const votes = getVotes(projectId);
    const currentUserId = 'u_01'; // Mock user

    setIsVoting(projectId);
    try {
      const res = await fetch('/api/village/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, userId: currentUserId, amount: votes }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '網路連線失敗');
      }

      setToast({ message: `「ZKP 憑證已生成，感謝您的真實貢獻！」`, type: 'success' });
      setVoteCounts((prev) => ({ ...prev, [projectId]: 1 }));

      setTimeout(async () => {
        setIsGeneratingTrend(true);
        try {
          const trendRes = await fetch('/api/village/trends');
          const trendData = await trendRes.json();
          setOmniTrend(trendData.trend);
        } catch {
        } finally {
          setIsGeneratingTrend(false);
        }
      }, 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : '網路連線失敗';
      setToast({ message: `投票失敗: ${message}`, type: 'error' });
    } finally {
      setIsVoting(null);
    }
  };

  const safeProgress = (current: number, goal: number) => {
    if (goal <= 0) return 0;
    return Math.min(100, Math.round((current / goal) * 100));
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 sm:space-y-8">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed inset-x-3 top-3 z-50 mx-auto max-w-lg px-4 py-3 sm:inset-x-auto sm:right-6 sm:top-6 sm:px-6 sm:py-4 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-md border transition-all duration-300 transform flex items-center gap-3 ${toast.type === 'success' ? 'bg-[var(--surface-1)] border-[var(--border-accent)] text-[var(--accent-cool)]' : 'bg-[var(--surface-1)] border-rose-500/40 text-rose-600 dark:text-rose-300'}`}>
          {toast.type === 'success' ? <ShieldCheck size={20} /> : <Activity size={20} />}
          <span className="font-bold text-sm tracking-wide">{toast.message}</span>
        </div>
      )}

      {/* Hero Header */}
      <div className="relative flex flex-col items-start justify-between gap-4 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-4 shadow-sm sm:rounded-3xl sm:p-6 md:flex-row md:items-center">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-[var(--accent-cool-soft)] rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-[var(--bg)] shadow-[0_0_15px_rgba(16,185,129,0.4)]">
            <Leaf size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[var(--text-1)] sm:text-2xl">
              善向永續村 (Village) ∞ Evolution
            </h1>
            <div className="text-xs text-[var(--text-2)] sm:text-sm font-medium mt-1">
              基於 5T 協議的去中心化永續社群與平方投票 (Quadratic Voting) 協作看板
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 sm:self-auto sm:gap-3 sm:px-4">
          <div className="flex items-center -space-x-2 mr-2">
            {(Array.isArray(members) ? members : []).slice(0, 3).map((m, i) => (
              <div key={i} className="w-6 h-6 rounded-full bg-[var(--surface-3)] border-2 border-[var(--surface-1)] flex items-center justify-center text-[10px] font-bold text-[var(--text-1)] z-10 relative">
                {m.avatar}
              </div>
            ))}
          </div>
          <span className="text-[10px] font-semibold tracking-wide text-[var(--accent-cool)] sm:text-xs">VILLAGE ONLINE</span>
        </div>
      </div>

      {fetchError && (
        <div className="p-4 mb-6 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm font-bold flex items-center gap-2">
          <Activity size={16} /> {fetchError}
        </div>
      )}

      <div className="grid min-w-0 grid-cols-1 items-start gap-5 lg:grid-cols-3 lg:gap-6">
        {/* Left Column: Impact Projects */}
        <div className="min-w-0 space-y-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg text-[var(--accent-cool)] flex items-center gap-2 font-bold">
              <TrendingUp size={20} /> 影響力專案看板
            </h2>
            <OmniBadge variant="glass" className="border-[var(--border-accent)] text-[var(--accent-cool)]">
              進行中 {projects.length}
            </OmniBadge>
          </div>

          {loading ? (
            <div className="flex justify-center p-10"><Activity className="animate-spin text-[var(--accent-cool)]" /></div>
          ) : projects.length === 0 ? (
            <div className="text-[var(--text-3)] text-center p-10 bg-[var(--surface-2)]/60 rounded-2xl border border-[var(--border)] border-dashed">尚無專案</div>
          ) : (
            <div className="flex flex-col gap-4 sm:gap-5">
              {projects.map((proj) => {
                const progress = safeProgress(proj.current_points, proj.goal_points);
                const votes = getVotes(proj.id);
                const cost = getCost(votes);
                const isLoading = isVoting === proj.id;

                return (
                  <OmniCard
                    key={proj.id}
                    glow
                    className={`transition-all duration-500 ${isLoading ? 'opacity-80 scale-[0.99] border-[var(--border-accent)] shadow-[0_0_20px_rgba(16,185,129,0.2)]' : ''}`}
                  >
                    {/* Progress Bar Top Edge */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-[var(--surface-3)]">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-700 ease-out shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <OmniCardContent className="pt-6">
                      <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="text-lg sm:text-xl text-[var(--text-1)] font-bold mb-2 flex items-center gap-2">
                            {proj.title}
                            {progress >= 100 && <ShieldCheck size={18} className="text-[var(--accent-cool)]" />}
                          </h3>
                          <p className="text-sm text-[var(--text-3)] leading-relaxed max-w-2xl">
                            {proj.description}
                          </p>
                        </div>
                        <div className="flex max-w-full flex-wrap justify-start gap-2 sm:max-w-[200px] sm:justify-end">
                          {proj.tags.map((tag) => (
                            <span key={tag} className="text-xs bg-[var(--accent-cool-soft)] border border-[var(--border-accent)] text-[var(--accent-cool)] px-2.5 py-1 rounded-md font-medium">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row justify-between items-start mt-5 pt-5 border-t border-[var(--border)] gap-4 sm:mt-6 sm:pt-6 sm:items-end sm:gap-6">
                        <div>
                          <div className="text-2xl sm:text-3xl font-black text-[var(--accent-cool)] font-mono mb-1">
                            {proj.current_points.toLocaleString()}{' '}
                            <span className="text-sm text-[var(--text-3)] font-sans tracking-widest">
                              / {proj.goal_points.toLocaleString()} PTS
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2">
                            <div className="text-xs bg-[var(--accent-cool-soft)] text-[var(--accent-cool)] px-2 py-1 rounded-md flex items-center gap-1.5 font-bold border border-[var(--border-accent)]">
                              <ShieldCheck size={14} /> 5T ZKP 已綁定
                            </div>
                            <div className="text-xs text-[var(--text-3)] flex items-center gap-1.5 font-medium">
                              <Clock size={14} /> 剩餘 14 天
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-stretch gap-3 w-full sm:w-auto sm:items-end">
                          {/* Quadratic Voting Control */}
                          <div className="flex h-11 items-center overflow-hidden rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)]">
                            <button
                              onClick={() => adjustVotes(proj.id, -1)}
                              disabled={votes <= 1 || isLoading}
                              className="grid h-11 w-11 shrink-0 place-items-center text-[var(--text-3)] transition-colors hover:bg-[var(--surface-3)] hover:text-[var(--text-1)] disabled:opacity-50"
                            >
                              <Minus size={14} />
                            </button>
                            <div className="min-w-16 text-center text-sm font-bold text-[var(--text-1)] border-x border-[var(--border-strong)] bg-[var(--surface-2)] flex items-center justify-center h-full">
                              {votes} 票
                            </div>
                            <button
                              onClick={() => adjustVotes(proj.id, 1)}
                              disabled={isLoading}
                              className="grid h-11 w-11 shrink-0 place-items-center text-[var(--text-3)] transition-colors hover:bg-[var(--surface-3)] hover:text-[var(--text-1)] disabled:opacity-50"
                            >
                              <Plus size={14} />
                            </button>
                          </div>

                          <OmniButton
                            disabled={isLoading}
                            onClick={() => handleVote(proj.id)}
                            variant="primary"
                            className="w-full sm:w-auto shadow-[0_0_15px_rgba(16,185,129,0.3)] min-h-11 sm:min-w-[160px]"
                          >
                            {isLoading ? (
                              <Activity className="animate-spin" size={16} />
                            ) : (
                              <>
                                <Heart size={16} className={votes > 5 ? 'text-rose-400 animate-pulse' : ''} />
                                投入 {cost} PTS
                              </>
                            )}
                          </OmniButton>
                        </div>
                      </div>
                    </OmniCardContent>
                  </OmniCard>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-4 sm:gap-5">

          {/* Trend Prediction */}
          <div className="space-y-4">
            <h2 className="text-lg text-[var(--accent-cool)] flex items-center gap-2 font-bold">
              <Activity size={20} /> OmniOne 智庫預測
            </h2>
            <OmniCard className="relative overflow-hidden group border-[var(--border-accent)] bg-[var(--surface-1)]">
              <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[var(--accent-cool-soft)] to-transparent pointer-events-none rounded-t-2xl" />
              <OmniCardContent className="pt-6">
                {isGeneratingTrend ? (
                  <div className="flex items-center gap-3 text-[var(--accent-cool)] font-bold py-4">
                    <Activity size={18} className="animate-spin" />
                    <span className="animate-pulse tracking-wider text-sm">系統感知推演中...</span>
                  </div>
                ) : omniTrend ? (
                  <div className="text-sm text-[var(--text-2)] leading-relaxed font-medium relative z-10">
                    {omniTrend}
                  </div>
                ) : (
                  <div className="text-sm text-[var(--text-3)] py-4">尚無趨勢預測資料。</div>
                )}
              </OmniCardContent>
            </OmniCard>
          </div>

          {/* Leaderboard */}
          <div className="space-y-4">
            <h2 className="text-lg text-[var(--accent-warm)] flex items-center gap-2 font-bold">
              <Trophy size={20} /> 村民貢獻榜
            </h2>
            <OmniCard>
              <OmniCardContent className="p-4">
                {loading ? (
                  <div className="flex justify-center p-4"><Activity className="animate-spin text-[var(--accent-warm)]" /></div>
                ) : (Array.isArray(members) ? members : []).length === 0 ? (
                  <div className="text-[var(--text-3)] text-center p-6 text-sm">尚無成員</div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {(Array.isArray(members) ? members : []).map((mem, i) => (
                      <div
                        key={mem.user_id}
                        className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${i === 0 ? 'bg-yellow-500/10 border border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.1)]' : 'bg-[var(--surface-2)] border border-[var(--border)] hover:bg-[var(--surface-3)]'}`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${i === 0 ? 'bg-yellow-500 text-[var(--bg)] shadow-[0_0_10px_rgba(234,179,8,0.25)]' : 'bg-[var(--surface-3)] text-[var(--text-2)]'}`}>
                          {mem.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-bold text-[var(--text-1)] truncate">{mem.name}</div>
                            {i === 0 && (
                              <span className="text-[9px] bg-yellow-500 text-[var(--text-1)] px-1.5 py-0.5 rounded font-black tracking-widest shrink-0">
                                TOP 1
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-[var(--text-3)] mt-0.5 truncate">{mem.title}</div>
                        </div>
                        <div className="text-sm font-black text-[var(--accent-cool)] font-mono tracking-wider">
                          {mem.points.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </OmniCardContent>
            </OmniCard>
          </div>

          {/* Activity Logs */}
          <div className="space-y-4">
            <h2 className="text-lg text-[var(--text-3)] flex items-center gap-2 font-bold">
              <Clock size={20} /> 村落即時動態
            </h2>
            <OmniCard>
              <OmniCardContent className="p-4">
                <div className="flex flex-col gap-4 relative">
                  <div className="absolute left-1.5 top-2 bottom-2 w-px bg-[var(--surface-3)]" />
                  {activities.map((act, i) => (
                    <div key={act.id} className="flex gap-4 items-start relative">
                      <div className={`w-3 h-3 mt-1 rounded-full z-10 border-2 border-[var(--surface-1)] ${i === 0 ? 'bg-[var(--accent-cool)] shadow-[0_0_8px_rgba(34,211,238,0.6)]' : 'bg-slate-700'}`} />
                      <div>
                        <div className="text-sm text-[var(--text-2)] leading-snug">{act.message}</div>
                        <div className="text-[10px] text-[var(--text-3)] mt-1 font-mono">{act.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </OmniCardContent>
            </OmniCard>
          </div>

        </div>
      </div>
    </div>
  );
}
