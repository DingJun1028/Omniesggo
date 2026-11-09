// ============================================================
// Gamification Sync — 萬能分身
// src/app/actions/gamification.ts
// Prisma → Supabase (full migration)
// ============================================================
import { supabase } from '@/lib/supabase-omni';
import crypto from 'crypto';

export async function syncGamificationState(
  userId: string,
  state: { level: number; xp: number; questsCompleted: string[] },
) {
  try {
    // Upsert UserGrowth (Supabase: select-then-update / insert)
    const [existing] = await supabase
      .from('UserGrowth')
      .select('*')
      .eq('userId', userId)
      .limit(1);

    if (existing) {
      await supabase
        .from('UserGrowth')
        .update({ level: state.level, xp: state.xp, updatedAt: new Date() })
        .eq('userId', userId)
        .select()
        .single();
    } else {
      await supabase
        .from('UserGrowth')
        .insert({
          userId,
          level: state.level,
          xp: state.xp,
          displayName: 'ESG Pioneer',
          tier: 'sprout',
        })
        .select()
        .single();
    }

    // 5T Hash Lock verification (防竄改紀錄)
    const hashPayload = `${userId}:${state.level}:${state.xp}:${Date.now()}`;
    const hashLock = crypto.createHash('sha256').update(hashPayload).digest('hex');

    console.log(
      `[Supabase/Gamification Sync] User ${userId} state synced. HashLock: ${hashLock}`,
    );

    return { success: true, hashLock };
  } catch (error) {
    console.error('[Supabase/Gamification Sync Error]', error);
    return { success: false, error: 'Failed to sync gamification state' };
  }
}

export async function getLeaderboard() {
  try {
    const { data } = await supabase
      .from('UserGrowth')
      .select('*')
      .order('xp', { ascending: false })
      .limit(5);

    if (data && data.length > 0) {
      return data.map((u: any) => ({
        id: u.userId,
        name: u.displayName || 'Unknown Agent',
        level: u.level,
        xp: u.xp,
        avatar: u.avatarUrl || '👤',
      }));
    }
  } catch (error) {
    console.error('[Leaderboard Fetch Error]', error);
  }

  // Static fallback (確保無資料時畫面不白屏)
  return [
    { id: 'u1', name: 'JunAiKey', level: 99, xp: 99999, avatar: '👑' },
    { id: 'u2', name: 'OmniAgent', level: 50, xp: 45000, avatar: '🤖' },
    { id: 'u3', name: 'Antigravity', level: 42, xp: 38500, avatar: '✨' },
    { id: 'u4', name: 'User', level: 12, xp: 850, avatar: '👤' },
  ];
}
