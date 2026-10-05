'use client';
import { useState, useEffect } from 'react';
import { Leaf, Heart, Users, TrendingUp, ShieldCheck, Clock, Activity, Minus, Plus, Trophy } from 'lucide-react';
import { OmniCard, OmniCardContent, OmniCardHeader, OmniCardTitle } from '@/components/omni-base/OmniCard';
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
        const data = await res.json();
        if (data.success) {
          setProjects(data.projects);
          setMembers(data.members);
          setActivities(data.activities);
          setLoading(false);
        } else {
          throw new Error(data.error);
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
        } catch (_e) {
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
    <div className="w-full max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-md border transition-all duration-300 transform flex items-center gap-3 ${toast.type === 'success' ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400' : 'bg-rose-950/80 border-rose-500/50 text-rose-400'}`}>
          {toast.type === 'success' ? <ShieldCheck size={20} /> : <Activity size={20} />}
          <span className="font-bold text-sm tracking-wide">{toast.message}</span>
        </div>
      )}

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl backdrop-blur-xl bg-slate-900/40 border border-emerald-500/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] p-6 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.4)]">
            <Leaf size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-emerald-400 tracking-tight">
              善向永續村 (Village) ∞ Evolution
            </h1>
            <div className="text-sm text-slate-600 dark:text-emerald-100/60 font-medium mt-1">
              基於 5T 協議的去中心化永續社群與平方投票 (Quadratic Voting) 協作看板
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 relative z-10 bg-slate-950/50 backdrop-blur-md border border-emerald-500/20 px-4 py-2 rounded-full">
          <div className="flex items-center -space-x-2 mr-2">
            {members.slice(0, 3).map((m, i) => (
              <div key={i} className="w-6 h-6 rounded-full bg-slate-700 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold text-white z-10 relative">
                {m.avatar}
              </div>
            ))}
          </div>
          <span className="text-xs font-semibold text-emerald-400/90 tracking-wide">VILLAGE ONLINE</span>
        </div>
      </div>

      {fetchError && (
        <div className="p-4 mb-6 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm font-bold flex items-center gap-2">
          <Activity size={16} /> {fetchError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Impact Projects */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg text-emerald-400 flex items-center gap-2 font-bold">
              <TrendingUp size={20} /> 影響力專案看板
            </h2>
            <OmniBadge variant="glass" className="border-emerald-500/30 text-emerald-400">
              進行中 {projects.length}
            </OmniBadge>
          </div>

          {loading ? (
            <div className="flex justify-center p-10"><Activity className="animate-spin text-emerald-500" /></div>
          ) : projects.length === 0 ? (
            <div className="text-slate-500 text-center p-10 bg-slate-900/20 rounded-2xl border border-slate-800 border-dashed">尚無專案</div>
          ) : (
            <div className="flex flex-col gap-6">
              {projects.map((proj) => {
                const progress = safeProgress(proj.current_points, proj.goal_points);
                const votes = getVotes(proj.id);
                const cost = getCost(votes);
                const isLoading = isVoting === proj.id;

                return (
                  <OmniCard
                    key={proj.id}
                    glow
                    className={`transition-all duration-500 ${isLoading ? 'opacity-80 scale-[0.99] border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : ''}`}
                  >
                    {/* Progress Bar Top Edge */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-700 ease-out shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <OmniCardContent className="pt-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl text-slate-100 font-bold mb-2 flex items-center gap-2">
                            {proj.title}
                            {progress >= 100 && <ShieldCheck size={18} className="text-emerald-400" />}
                          </h3>
                          <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">
                            {proj.description}
                          </p>
                        </div>
                        <div className="flex gap-2 flex-wrap justify-end max-w-[200px]">
                          {proj.tags.map((tag) => (
                            <span key={tag} className="text-xs bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 px-2.5 py-1 rounded-md font-medium">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row justify-between items-end mt-6 pt-6 border-t border-slate-800/50 gap-6">
                        <div>
                          <div className="text-3xl font-black text-slate-900 dark:text-emerald-400 font-mono mb-1">
                            {proj.current_points.toLocaleString()}{' '}
                            <span className="text-sm text-slate-500 font-sans tracking-widest">
                              / {proj.goal_points.toLocaleString()} PTS
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-md flex items-center gap-1.5 font-bold border border-emerald-500/20">
                              <ShieldCheck size={14} /> 5T ZKP 已綁定
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                              <Clock size={14} /> 剩餘 14 天
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-3 w-full sm:w-auto">
                          {/* Quadratic Voting Control */}
                          <div className="flex items-center bg-slate-900/50 border border-slate-700 rounded-xl overflow-hidden h-10 backdrop-blur-md">
                            <button
                              onClick={() => adjustVotes(proj.id, -1)}
                              disabled={votes <= 1 || isLoading}
                              className="w-10 h-full flex items-center justify-center text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors disabled:opacity-50"
                            >
                              <Minus size={14} />
                            </button>
                            <div className="w-16 text-center text-sm font-bold text-slate-200 border-x border-slate-700 bg-slate-800/30 flex items-center justify-center h-full">
                              {votes} 票
                            </div>
                            <button
                              onClick={() => adjustVotes(proj.id, 1)}
                              disabled={isLoading}
                              className="w-10 h-full flex items-center justify-center text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors disabled:opacity-50"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          
                          <OmniButton
                            disabled={isLoading}
                            onClick={() => handleVote(proj.id)}
                            variant="primary"
                            className="w-full sm:w-auto shadow-[0_0_15px_rgba(16,185,129,0.3)] min-w-[160px]"
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
        <div className="flex flex-col gap-6">
          
          {/* Trend Prediction */}
          <div className="space-y-4">
            <h2 className="text-lg text-cyan-400 flex items-center gap-2 font-bold">
              <Activity size={20} /> OmniOne 智庫預測
            </h2>
            <OmniCard className="relative overflow-hidden group border-cyan-500/20 bg-slate-900/60">
              <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-cyan-500/10 to-transparent pointer-events-none rounded-t-2xl" />
              <OmniCardContent className="pt-6">
                {isGeneratingTrend ? (
                  <div className="flex items-center gap-3 text-cyan-400 font-bold py-4">
                    <Activity size={18} className="animate-spin" />
                    <span className="animate-pulse tracking-wider text-sm">系統感知推演中...</span>
                  </div>
                ) : omniTrend ? (
                  <div className="text-sm text-slate-300 leading-relaxed font-medium relative z-10">
                    {omniTrend}
                  </div>
                ) : (
                  <div className="text-sm text-slate-500 py-4">尚無趨勢預測資料。</div>
                )}
              </OmniCardContent>
            </OmniCard>
          </div>

          {/* Leaderboard */}
          <div className="space-y-4">
            <h2 className="text-lg text-yellow-400 flex items-center gap-2 font-bold">
              <Trophy size={20} /> 村民貢獻榜
            </h2>
            <OmniCard>
              <OmniCardContent className="p-4">
                {loading ? (
                  <div className="flex justify-center p-4"><Activity className="animate-spin text-yellow-500" /></div>
                ) : members.length === 0 ? (
                  <div className="text-slate-500 text-center p-6 text-sm">尚無成員</div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {members.map((mem, i) => (
                      <div
                        key={mem.user_id}
                        className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${i === 0 ? 'bg-yellow-500/10 border border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.1)]' : 'bg-slate-900/50 border border-slate-800/50 hover:bg-slate-800'}`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${i === 0 ? 'bg-yellow-500 text-slate-900 shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 'bg-slate-800 text-slate-300'}`}>
                          {mem.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-bold text-slate-200 truncate">{mem.name}</div>
                            {i === 0 && (
                              <span className="text-[9px] bg-yellow-500 text-slate-900 px-1.5 py-0.5 rounded font-black tracking-widest shrink-0">
                                TOP 1
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5 truncate">{mem.title}</div>
                        </div>
                        <div className="text-sm font-black text-emerald-400 font-mono tracking-wider">
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
            <h2 className="text-lg text-slate-400 flex items-center gap-2 font-bold">
              <Clock size={20} /> 村落即時動態
            </h2>
            <OmniCard>
              <OmniCardContent className="p-4">
                <div className="flex flex-col gap-4 relative">
                  <div className="absolute left-1.5 top-2 bottom-2 w-px bg-slate-800" />
                  {activities.map((act, i) => (
                    <div key={act.id} className="flex gap-4 items-start relative">
                      <div className={`w-3 h-3 mt-1 rounded-full z-10 border-2 border-slate-900 ${i === 0 ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]' : 'bg-slate-700'}`} />
                      <div>
                        <div className="text-sm text-slate-300 leading-snug">{act.message}</div>
                        <div className="text-[10px] text-slate-500 mt-1 font-mono">{act.time}</div>
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
