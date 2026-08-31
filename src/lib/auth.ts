// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
/**
 * 本地 Auth 模組 (local mode) — GCP Firebase Auth 已停用 (力度 1, 2026-08-25)。
 *
 * 設計: 保留與原 firebase/auth 相同的 API 表面 (signInWithGoogle / signInWithEmail /
 * signOut / onAuthChange / getCurrentUser / isAuthenticated)，但底層改用
 * localStorage 模擬會話 (不連 GCP)。User 型別改為本地 LocalUser。
 *
 * 說明: 生產環境若要真實認證，應接本地 OIDC / 自簽 JWT；本模組提供開發期
 * 可運作的本地會話，避免 UI 因移除 GCP 而崩潰。
 */

export interface LocalUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

const STORAGE_KEY = 'esggo_local_user';

function loadUser(): LocalUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LocalUser) : null;
  } catch {
    return null;
  }
}

function saveUser(user: LocalUser | null): void {
  if (typeof window === 'undefined') return;
  if (user) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } else {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

// 簡易事件訂閱 (模擬 onAuthStateChanged)
const listeners = new Set<(user: LocalUser | null) => void>();

function emit(user: LocalUser | null): void {
  listeners.forEach((cb) => cb(user));
}

// 相容舊 call site: const auth = getAuth(app)
export const auth = {
  get currentUser(): LocalUser | null {
    return loadUser();
  },
};

// 相容舊 call site: const googleProvider = new GoogleAuthProvider()
export class GoogleAuthProvider {
  setCustomParameters(_p: Record<string, string>): void {}
}

// ── Public API ──────────────────────────────────────────────────

export async function signInWithGoogle(): Promise<LocalUser> {
  // 本地模式: 產生模擬 Google 使用者 (開發期)。生產應接真實 OIDC。
  const user: LocalUser = {
    uid: `local_google_${Date.now()}`,
    email: 'local-user@esggo.local',
    displayName: 'Local Google User',
    photoURL: null,
  };
  saveUser(user);
  emit(user);
  return user;
}

export async function signUpWithEmail(
  email: string,
  _password: string,
  displayName?: string
): Promise<LocalUser> {
  const user: LocalUser = {
    uid: `local_${Date.now()}`,
    email,
    displayName: displayName ?? email.split('@')[0],
    photoURL: null,
  };
  saveUser(user);
  emit(user);
  return user;
}

export async function signInWithEmail(email: string, _password: string): Promise<LocalUser> {
  const user: LocalUser = {
    uid: `local_${email}`,
    email,
    displayName: email.split('@')[0],
    photoURL: null,
  };
  saveUser(user);
  emit(user);
  return user;
}

export async function signOut(): Promise<void> {
  saveUser(null);
  emit(null);
}

export function onAuthChange(callback: (user: LocalUser | null) => void): () => void {
  listeners.add(callback);
  // 立即觸發目前狀態
  callback(loadUser());
  return () => listeners.delete(callback);
}

export function getCurrentUser(): LocalUser | null {
  return loadUser();
}

export function isAuthenticated(): boolean {
  return !!loadUser();
}

export type User = LocalUser;
