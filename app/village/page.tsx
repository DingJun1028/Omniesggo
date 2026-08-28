'use client';
import { useState, useEffect } from 'react';
import {
  Leaf,
  Heart,
  Users,
  TrendingUp,
  ShieldCheck,
  Clock,
  Activity,
  Minus,
  Plus,
} from 'lucide-react';
import { db } from '@lib/firebase';
import { onSnapshot } from '@lib/firebase';
// seedVillageData removed — should be API route, not client import
import { OmniBaseCard } from '@/components/omni-base-card';

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

  const _formatRelativeTime = (isoString: string) => {
  if (!isoString) return '';
  const diff = Date.now() - new Date(isoString).getTime();
  if (diff < 60000) return '剛剛';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分鐘前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小時前`;
  return `${Math.floor(diff / 86400000)}天前`;
};

export default function VillagePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // OmniOne Trend state
  const [omniTrend, setOmniTrend] = useState<string | null>(null);
  const [isGeneratingTrend, setIsGeneratingTrend] = useState(false);

  // Quadratic Voting state
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});

  // Real-time activity logs
  const [activities, setActivities] = useState<ActivityLog[]>([]);

  useEffect(() => {
    // No firebase client listeners used here anymore

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
      await fetchData(); // Initial fetch
      pollInterval = setInterval(fetchData, 5000); // Poll every 5 seconds for updates
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

  const [isVoting, setIsVoting] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const getVotes = (projectId: string) => voteCounts[projectId] || 1;
  const getCost = (votes: number) => votes * votes * 10; // Cost = Votes^2 * 10
  const _getPower = (votes: number) => votes * 10; // Impact = Votes * 10

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

      // Real-time update is handled by Firebase onSnapshot for activities

      // Show Success Toast
      setToast({ message: `「ZKP 憑證已生成，感謝您的真實貢獻！」`, type: 'success' });

      // Reset
      setVoteCounts((prev) => ({ ...prev, [projectId]: 1 }));

      // Optionally refresh the trend prediction after a short delay so new data is picked up
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
    <div className="min-h-screen bg-primary text-textPrimary font-sans p-6 md:p-10 transition-colors duration-500">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accentTeal to-accentGreen flex items-center justify-center shadow-sm">
          <Leaf className="text-white" size={26} />
        </div>
        <div>
          <h1 className="m-0 text-2xl font-bold text-accentTeal">善向永續村 (Village) ∞ Evolution</h1>
          <div className="text-xs text-textSecondary mt-1">
            基於 5T 協議的去中心化永續社群與平方投票 (Quadratic Voting) 募資平台 — 永續發展無限進化
          </div>
        </div>
      </div>

      {fetchError && (
        <div className="p-4 mb-6 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
          ⚠️ {fetchError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
        {/* Toast Notification */}
        {toast && (
          <div
            className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-xl shadow-lg border transition-all duration-300 transform flex items-center gap-3 ${toast.type === 'success' ? 'bg-secondary border-accentGreen/30 text-accentGreen' : 'bg-red-50 border-red-200 text-red-600'}`}
          >
            {toast.type === 'success' ? <ShieldCheck size={20} /> : <Leaf size={20} />}
            <span className="font-bold text-sm">{toast.message}</span>
          </div>
        )}

        {/* Left Column: Impact Projects */}
        <div className="lg:col-span-2">
          <h2 className="text-lg text-accentTeal flex items-center gap-2 mb-4 font-bold">
            <TrendingUp size={20} /> 影響力專案募資
          </h2>

          {loading ? (
            <div className="text-textSecondary">載入中...</div>
          ) : projects.length === 0 ? (
            <div className="text-textSecondary text-center p-10">尚無專案</div>
          ) : (
            <div className="flex flex-col gap-5">
              {projects.map((proj) => {
                const progress = safeProgress(proj.current_points, proj.goal_points);
                const votes = getVotes(proj.id);
                const cost = getCost(votes);
                const isLoading = isVoting === proj.id;

                return (
                  <OmniBaseCard
                    key={proj.id}
                    variant="liquid-glass"
                    statusIndicator="trustworthy"
                    hashLock={proj.id}
                    className={`transition-all duration-500 ${isLoading ? 'opacity-80 scale-[0.99]' : 'hover:-translate-y-1'}`}
                  >
                    <div
                      className="absolute top-0 left-0 h-1.5 bg-gradient-to-r from-[#63a6b0] to-[#ffd700] transition-all duration-500 ease-out"
                      style={{ width: `${progress}%` }}
                    />

                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="m-0 mb-2 text-xl text-textPrimary font-bold">
                          {proj.title}
                        </h3>
                        <p className="m-0 text-sm text-textSecondary leading-relaxed">
                          {proj.description}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {proj.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs bg-accentTeal/10 text-accentTeal px-3 py-1 rounded-full font-medium"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-end mt-6 gap-4">
                      <div>
                        <div className="text-3xl font-bold text-accentGold font-mono">
                          {proj.current_points.toLocaleString()}{' '}
                          <span className="text-sm text-textSecondary font-sans">
                            / {proj.goal_points.toLocaleString()} PTS
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="text-xs text-accentGreen flex items-center gap-1.5 font-medium">
                            <ShieldCheck size={14} /> 5T ZKP 已驗證
                          </div>
                          <div className="text-xs text-textSecondary flex items-center gap-1.5">
                            <Clock size={14} /> 剩餘 14 天
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        {/* QV Control */}
                        <div className="flex items-center bg-primary border border-borderColor rounded-lg overflow-hidden h-9">
                          <button
                            aria-label="減少票數"
                            onClick={() => adjustVotes(proj.id, -1)}
                            className="w-9 h-full flex items-center justify-center text-textSecondary hover:bg-borderColor hover:text-textPrimary focus-visible:outline-none focus-visible:bg-borderColor focus-visible:text-textPrimary transition-colors disabled:opacity-50"
                            disabled={votes <= 1 || isLoading}
                          >
                            <Minus size={14} />
                          </button>
                          <div className="w-14 text-center text-sm font-bold text-textPrimary border-x border-borderColor">
                            {votes} 票
                          </div>
                          <button
                            aria-label="增加票數"
                            onClick={() => adjustVotes(proj.id, 1)}
                            className="w-9 h-full flex items-center justify-center text-textSecondary hover:bg-borderColor hover:text-textPrimary focus-visible:outline-none focus-visible:bg-borderColor focus-visible:text-textPrimary transition-colors disabled:opacity-50"
                            disabled={isLoading}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <button
                          disabled={isLoading}
                          onClick={() => handleVote(proj.id)}
                          className={`bg-accentTeal text-white border-none px-5 py-2.5 rounded-lg font-bold cursor-pointer flex items-center gap-2 hover:bg-opacity-90 active:scale-95 transition-all w-full justify-center ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                          {isLoading ? (
                            <span className="flex items-center gap-2">
                              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                              封印中...
                            </span>
                          ) : (
                            <>
                              <Heart size={16} /> 贊助 (花費 {cost} PTS)
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </OmniBaseCard>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Leaderboard & Activity */}
        <div className="flex flex-col gap-8">
          {/* OmniOne Trend Prediction */}
          <div>
            <h2 className="text-lg text-accentTeal flex items-center gap-2 mb-4 font-bold">
              <Activity size={20} /> OmniOne 趨勢預測
            </h2>
            <OmniBaseCard variant="liquid-glass" className="group">
              {/* Liquid Glass Glare */}
              <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none rounded-t-2xl" />
              <div className="absolute -inset-x-20 top-0 h-px bg-gradient-to-r from-transparent via-accentTeal/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

              {isGeneratingTrend ? (
                <div className="flex items-center gap-3 text-accentTeal font-medium py-2">
                  <div className="w-4 h-4 border-2 border-accentTeal/30 border-t-accentTeal rounded-full animate-spin"></div>
                  <span className="animate-pulse">系統感知中...</span>
                </div>
              ) : omniTrend ? (
                <div className="text-sm text-textPrimary leading-relaxed font-medium">
                  {omniTrend}
                </div>
              ) : (
                <div className="text-sm text-textSecondary">尚無趨勢預測資料。</div>
              )}
            </OmniBaseCard>
          </div>

          <div>
            <h2 className="text-lg text-accentGold flex items-center gap-2 mb-4 font-bold">
              <Users size={20} /> 村民貢獻榜
            </h2>
            <OmniBaseCard className="p-4 shadow-sm">
              {loading ? (
                <div className="text-textSecondary">載入中...</div>
              ) : members.length === 0 ? (
                <div className="text-textSecondary text-center p-6">尚無成員</div>
              ) : (
                <div className="flex flex-col gap-3">
                  {members.map((mem, i) => (
                    <div
                      key={mem.user_id}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${i === 0 ? 'bg-accentGold/10 border border-accentGold/30' : 'bg-primary border border-transparent'}`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-black ${i === 0 ? 'bg-accentGold' : 'bg-accentTeal'}`}
                      >
                        {mem.avatar}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-bold text-textPrimary">{mem.name}</div>
                          {i === 0 && (
                            <span className="text-[10px] bg-accentGold text-black px-1.5 py-0.5 rounded font-black tracking-wide">
                              TOP 1
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-textSecondary mt-0.5">{mem.title}</div>
                      </div>
                      <div className="text-sm font-bold text-accentGreen font-mono">
                        {mem.points.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </OmniBaseCard>
          </div>

          <div>
            <h2 className="text-lg text-textSecondary flex items-center gap-2 mb-4 font-bold">
              <Activity size={20} /> 村落動態
            </h2>
            <OmniBaseCard className="p-4 shadow-sm">
              <div className="flex flex-col gap-4">
                {activities.map((act) => (
                  <div key={act.id} className="flex gap-3 items-start">
                    <div className="w-2 h-2 mt-1.5 rounded-full bg-accentTeal/50" />
                    <div>
                      <div className="text-sm text-textPrimary">{act.message}</div>
                      <div className="text-xs text-textSecondary mt-1">{act.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </OmniBaseCard>
          </div>
        </div>
      </div>
    </div>
  );
}
