/**
 * ESGGO User Growth Dashboard
 * Page: /profile — Tier, XP, Tasks, Achievements, Leaderboard
 * Solid Card design system
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

// ============================================================
// Solid Card Tokens (inline to avoid import issues)
// ============================================================
const SC = {
  bg: '#0A0F1A',
  surface: '#111827',
  surfaceHover: '#1E293B',
  border: '#1E3A5F',
  teal: '#009EB0',
  gold: '#D4AF37',
  zkp: '#3B82F6',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
};

// ============================================================
// Types
// ============================================================
interface TierProfile {
  userId: string;
  displayName: string;
  tier: string;
  tierLabel: string;
  tierIcon: string;
  level: number;
  xp: number;
  totalPoints: number;
  streakDays: number;
  nextTier: string | null;
  nextTierLabel: string | null;
  nextTierThreshold: number | null;
  progressToNext: number;
  achievements: Array<{
    id: string;
    unlockedAt: string;
    achievement: {
      slug: string;
      title: string;
      description: string;
      icon: string;
      xpReward: number;
    };
  }>;
  tasks: Array<{
    id: string;
    progress: number;
    status: string;
    task: {
      slug: string;
      title: string;
      description: string;
      xpReward: number;
    };
  }>;
}

interface LeaderboardEntry {
  rank: number;
  displayName: string;
  tier: string;
  tierLabel: string;
  tierIcon: string;
  level: number;
  totalPoints: number;
  streakDays: number;
}

// ============================================================
// Tier Progress Component
// ============================================================
function TierProgress({ profile }: { profile: TierProfile }) {
  return (
    <div style={{
      background: SC.surface,
      border: `1px solid ${SC.border}`,
      borderRadius: 12,
      padding: 24,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <span style={{ fontSize: 48 }}>{profile.tierIcon}</span>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: SC.teal }}>
            {profile.displayName}
          </div>
          <div style={{ fontSize: 14, color: SC.textSecondary }}>
            等級 {profile.level} · {profile.tierLabel} · 🔥 {profile.streakDays} 天
          </div>
        </div>
      </div>

      {/* XP Bar */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: SC.textMuted }}>
          <span>XP: {profile.xp}</span>
          <span>總積分: {profile.totalPoints}</span>
        </div>
      </div>
      <div style={{
        height: 8,
        background: SC.surfaceHover,
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 8,
      }}>
        <div style={{
          height: '100%',
          width: `${profile.progressToNext}%`,
          background: `linear-gradient(90deg, ${SC.teal}, ${SC.gold})`,
          borderRadius: 4,
          transition: 'width 0.5s',
        }} />
      </div>
      <div style={{ fontSize: 12, color: SC.textMuted }}>
        {profile.nextTier
          ? `距離「${profile.nextTierLabel}」還需 ${profile.nextTierThreshold! - profile.totalPoints} 積分`
          : '已達最高等級 🛡️'
        }
      </div>
    </div>
  );
}

// ============================================================
// Achievement Badges
// ============================================================
function AchievementGrid({ achievements }: { achievements: TierProfile['achievements'] }) {
  if (achievements.length === 0) {
    return (
      <div style={{
        background: SC.surface,
        border: `1px solid ${SC.border}`,
        borderRadius: 12,
        padding: 24,
      }}>
        <h3 style={{ color: SC.gold, fontSize: 16, marginBottom: 12 }}>🏆 成就徽章</h3>
        <p style={{ color: SC.textMuted, fontSize: 14 }}>完成任務解鎖成就，踏上永續成長之路！</p>
      </div>
    );
  }

  return (
    <div style={{
      background: SC.surface,
      border: `1px solid ${SC.border}`,
      borderRadius: 12,
      padding: 24,
    }}>
      <h3 style={{ color: SC.gold, fontSize: 16, marginBottom: 16 }}>
        🏆 成就徽章 ({achievements.length})
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px))', gap: 12 }}>
        {achievements.map(a => (
          <div key={a.id} style={{
            background: SC.surfaceHover,
            border: `1px solid ${SC.zkp}33`,
            borderRadius: 8,
            padding: 12,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 28 }}>{a.achievement.icon}</div>
            <div style={{ fontSize: 13, color: SC.text, fontWeight: 600, marginTop: 4 }}>
              {a.achievement.title}
            </div>
            <div style={{ fontSize: 11, color: SC.textMuted, marginTop: 2 }}>
              +{a.achievement.xpReward} XP
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Task List
// ============================================================
function TaskList({ tasks }: { tasks: TierProfile['tasks'] }) {
  if (tasks.length === 0) {
    return (
      <div style={{
        background: SC.surface,
        border: `1px solid ${SC.border}`,
        borderRadius: 12,
        padding: 24,
      }}>
        <h3 style={{ color: SC.teal, fontSize: 16, marginBottom: 12 }}>📋 今日任務</h3>
        <p style={{ color: SC.textMuted, fontSize: 14 }}>無進行中的任務</p>
      </div>
    );
  }

  return (
    <div style={{
      background: SC.surface,
      border: `1px solid ${SC.border}`,
      borderRadius: 12,
      padding: 24,
    }}>
      <h3 style={{ color: SC.teal, fontSize: 16, marginBottom: 16 }}>📋 任務進度</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {tasks.map(t => (
          <div key={t.id} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: SC.surfaceHover,
            borderRadius: 8,
            padding: 12,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, color: SC.text, fontWeight: 600 }}>
                {t.task.title}
              </div>
              <div style={{ fontSize: 12, color: SC.textMuted }}>{t.task.description}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                fontSize: 13,
                color: t.status === 'completed' ? SC.success : SC.teal,
                fontWeight: 600,
              }}>
                {t.progress}%
              </div>
              <div style={{
                fontSize: 12,
                color: SC.gold,
                fontWeight: 600,
              }}>
                +{t.task.xpReward} XP
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Leaderboard
// ============================================================
function LeaderboardPanel({ leaderboard }: { leaderboard: LeaderboardEntry[] }) {
  return (
    <div style={{
      background: SC.surface,
      border: `1px solid ${SC.border}`,
      borderRadius: 12,
      padding: 24,
    }}>
      <h3 style={{ color: SC.zkp, fontSize: 16, marginBottom: 16 }}>⭐ 積分排行榜</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {leaderboard.slice(0, 10).map(u => (
          <div key={u.rank} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '8px 12px',
            background: u.rank <= 3 ? `${SC.gold}15` : SC.surfaceHover,
            borderRadius: 8,
          }}>
            <span style={{
              fontSize: 18,
              fontWeight: 700,
              width: 28,
              color: u.rank === 1 ? SC.gold : u.rank === 2 ? SC.textSecondary : u.rank === 3 ? '#CD7F32' : SC.textMuted,
            }}>
              {u.rank <= 3 ? ['🥇', '🥈', '🥉'][u.rank - 1] : `#${u.rank}`}
            </span>
            <span style={{ fontSize: 18 }}>{u.tierIcon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, color: SC.text, fontWeight: 600 }}>{u.displayName}</div>
              <div style={{ fontSize: 11, color: SC.textMuted }}>
                {u.tierLabel} · Lv.{u.level} · 🔥{u.streakDays}天
              </div>
            </div>
            <span style={{ fontSize: 14, color: SC.teal, fontWeight: 600 }}>
              {u.totalPoints} pts
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Growth Path Visualization
// ============================================================
function GrowthPath() {
  const tiers = [
    { name: '種子', icon: '🌱', req: 0, teal: SC.teal },
    { name: '發芽', icon: '🌿', req: 1000, teal: '#22C55E' },
    { name: '綻放', icon: '🌸', req: 5000, teal: '#EC4899' },
    { name: '森林', icon: '🌳', req: 20000, teal: '#10B981' },
    { name: '守護者', icon: '🛡️', req: 100000, teal: '#8B5CF6' },
  ];

  return (
    <div style={{
      background: SC.surface,
      border: `1px solid ${SC.border}`,
      borderRadius: 12,
      padding: 24,
    }}>
      <h3 style={{ color: SC.gold, fontSize: 16, marginBottom: 16 }}>? 永續成長路徑</h3>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {tiers.map((t, i) => (
          <div key={t.name} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 32 }}>{t.icon}</div>
            <div style={{ fontSize: 13, color: SC.text, fontWeight: 600, marginTop: 4 }}>{t.name}</div>
            <div style={{ fontSize: 11, color: SC.textMuted }}>{t.req >= 10000 ? `${( t.req / 10000)}萬` : `${t.req}`} pts</div>
            {i < tiers.length - 1 && (
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  top: -24,
                  right: -50,
                  width: 100,
                  height: 2,
                  background: SC.border,
                }} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Main Page
// ============================================================
const PROFILE_TABS = ['overview', 'tasks', 'achievements'] as const;

export default function UserGrowthPage() {
  const [profile, setProfile] = useState<TierProfile | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'tasks' | 'achievements'>('overview');

  // Demo user ID (in production from auth context)
  const userId = 'demo-user-esggo-001';

  const fetchData = useCallback(async () => {
    try {
      const [profileRes, leaderboardRes] = await Promise.all([
        fetch(`/api/user/growth?userId=${userId}`),
        fetch('/api/user/leaderboard?limit=10'),
      ]);
      const profileData = await profileRes.json();
      const leaderboardData = await leaderboardRes.json();
      if (profileData.success) setProfile(profileData.profile);
      if (leaderboardData.success) setLeaderboard(leaderboardData.leaderboard);
    } catch (e) {
      console.error('Failed to fetch growth data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div style={{ background: SC.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: SC.teal, fontSize: 18 }}>載入成長數據中...</div>
      </div>
    );
  }

  return (
    <div style={{ background: SC.bg, minHeight: '100vh', padding: '24px 16px' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        {/* Header */}
        <header style={{
          borderBottom: `1px solid ${SC.border}`,
          paddingBottom: 16,
          marginBottom: 24,
        }}>
          <h1 style={{ color: SC.text, fontSize: 24, fontWeight: 700 }}>
            🌿 用戶成長中心 ∞ Evolution
          </h1>
          <p style={{ color: SC.textSecondary, fontSize: 14, marginTop: 4 }}>
            完成任務、累積積分、解鎖成就，踏上你的永續成長之路 · 永續發展無限進化
          </p>
        </header>

        {/* Tabs */}
        <nav style={{ display: 'flex', gap: 0, marginBottom: 24 }}>
          {PROFILE_TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '10px 20px',
                background: 'transparent',
                border: 'none',
                borderBottom: `2px solid ${tab === t ? SC.teal : 'transparent'}`,
                color: tab === t ? SC.teal : SC.textMuted,
                fontWeight: tab === t ? 600 : 400,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              {t === 'overview' ? '總覽' : t === 'tasks' ? '任務' : '成就'}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div style={{ display: 'grid', gap: 20 }}>
          {tab === 'overview' && (
            <>
              {profile && <TierProgress profile={profile} />}
              <GrowthPath />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <AchievementGrid achievements={profile?.achievements || []} />
                <LeaderboardPanel leaderboard={leaderboard} />
              </div>
            </>
          )}

          {tab === 'tasks' && (
            <>
              {profile && <TaskList tasks={profile.tasks} />}
              <div style={{
                background: SC.surface,
                border: `1px solid ${SC.border}`,
                borderRadius: 12,
                padding: 24,
              }}>
                <h3 style={{ color: SC.teal, fontSize: 16, marginBottom: 12 }}>⚡ 快速賺取 XP</h3>
                <div style={{ display: 'grid', gap: 8, fontSize: 14, color: SC.textSecondary }}>
                  <div>✅ 每日簽到：+5 XP</div>
                  <div>📊 閱讀報告：+15 XP</div>
                  <div>📚 學習知識：+10 XP</div>
                  <div>🔔 查看快訊：+5 XP</div>
                  <div>📤 分享資訊：+15 XP</div>
                  <div>💬 發表評論：+10 XP</div>
                </div>
              </div>
            </>
          )}

          {tab === 'achievements' && (
            <AchievementGrid achievements={profile?.achievements || []} />
          )}
        </div>
      </div>
    </div>
  );
}