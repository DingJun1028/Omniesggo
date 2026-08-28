// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
/**
 * NCBDB user_profiles 表管理
 * 登入後自動同步 Firebase User → user_profiles
 */

import { ncbQuery } from './ncb-utils';
import type { User } from './auth';

export interface UserProfile {
  user_id: string;
  email: string;
  display_name: string;
  photo_url?: string;
  provider: string;
  created_at: string;
  last_login: string;
  total_points: number;
  vote_count: number;
  report_count: number;
}

/**
 * 從 NCBDB 取得 user profile，若不存在則自動建立
 */
export async function getOrCreateUserProfile(firebaseUser: User): Promise<UserProfile> {
  // 先嘗試從 NCBDB 查詢
  const existing = await ncbQuery<UserProfile[]>({
    table: 'user_profiles',
    method: 'GET',
    params: { user_id: firebaseUser.uid },
  });

  if (existing && existing.length > 0) {
    // 更新 last_login
    await ncbQuery({
      table: 'user_profiles',
      method: 'PUT',
      params: { user_id: firebaseUser.uid },
      body: { last_login: new Date().toISOString() },
    });
    return existing[0];
  }

  // 建立新 profile
  const newProfile: UserProfile = {
    user_id: firebaseUser.uid,
    email: firebaseUser.email || '',
    display_name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
    photo_url: firebaseUser.photoURL || undefined,
    provider: (firebaseUser as { provider?: string; providerData?: Array<{ providerId?: string }> }).providerData?.[0]?.providerId || (firebaseUser as { provider?: string }).provider || 'local',
    created_at: new Date().toISOString(),
    last_login: new Date().toISOString(),
    total_points: 0,
    vote_count: 0,
    report_count: 0,
  };

  await ncbQuery({
    table: 'user_profiles',
    method: 'POST',
    body: newProfile as unknown as Record<string, unknown>,
  });

  return newProfile;
}

/**
 * 取得用戶積分與統計資料
 */
export async function getUserStats(userId: string): Promise<Partial<UserProfile> | null> {
  const profiles = await ncbQuery<UserProfile[]>({
    table: 'user_profiles',
    method: 'GET',
    params: { user_id: userId },
  });
  return profiles?.[0] || null;
}
