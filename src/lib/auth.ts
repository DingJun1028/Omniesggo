// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
/**
 * Auth 模組 (Supabase Adapter) — GCP Firebase Auth 已停用。
 *
 * 此檔案封裝 Supabase Auth API，以 Firebase 相容的 API 表面提供認證功能，
 * 達成無縫轉移到 Supabase 的目標。
 */
import { supabase } from './supabase-client';

export interface LocalUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export type User = LocalUser;

/** Supabase Auth 的 User 物件 (部分欄位) — 以結構化介面描述, 避免依賴套件的 index signature。 */
export interface SupabaseUserRecord {
  id?: string | null;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
}

function mapSupabaseUser(user: SupabaseUserRecord | null | undefined): LocalUser | null {
  if (!user) return null;
  const meta = user.user_metadata ?? {};
  const fallbackName = user.email?.split('@')[0] ?? null;
  return {
    uid: user.id ?? '',
    email: user.email ?? null,
    displayName: (meta.full_name as string | undefined) ?? fallbackName,
    photoURL: (meta.avatar_url as string | undefined) ?? null,
  };
}

export const auth = {
  get currentUser(): LocalUser | null {
    return getCurrentUser();
  },
};

export class GoogleAuthProvider {
  setCustomParameters(_p: Record<string, string>): void {}
}

export async function signInWithGoogle(): Promise<LocalUser> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
  });
  if (error) throw error;
  // Supabase OAuth redirects by default, so user is not immediately returned
  return mapSupabaseUser(data) as LocalUser;
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName?: string
): Promise<LocalUser> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: displayName,
      }
    }
  });
  if (error) throw error;
  return mapSupabaseUser(data.user) as LocalUser;
}

export async function signInWithEmail(email: string, password: string): Promise<LocalUser> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return mapSupabaseUser(data.user) as LocalUser;
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

export function onAuthChange(callback: (user: LocalUser | null) => void): () => void {
  // 初始觸發
  supabase.auth.getSession().then(({ data: { session } }) => {
    callback(mapSupabaseUser(session?.user));
  });

  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(mapSupabaseUser(session?.user));
  });

  return () => {
    subscription.unsubscribe();
  };
}

// 注意: 此函式為同步存取，為了相容原本的 local storage 版本
// 在 Supabase 中，較好的做法是用異步獲取 Session
let _cachedUser: LocalUser | null = null;

// 僅在瀏覽器環境初始化：避免在 SSR / `next build` 靜態產出（prerender）時
// 於模組載入階段觸碰 Supabase（此時 NEXT_PUBLIC_SUPABASE_* 可能不存在，
// 會導致 build 失敗：'supabaseUrl is required.'）。
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((_event, session) => {
    _cachedUser = mapSupabaseUser(session?.user);
  });
  supabase.auth.getSession().then(({ data: { session } }) => {
    _cachedUser = mapSupabaseUser(session?.user);
  });
}

export function getCurrentUser(): LocalUser | null {
  return _cachedUser;
}

export function isAuthenticated(): boolean {
  return !!_cachedUser;
}
