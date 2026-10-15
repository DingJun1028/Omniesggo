import { useSupabase, APP_ID, emitTelemetry } from '../db';
import { supaSignOut } from '../supabase-db';
import { upsertUserProfile, getUserProfile } from './profile.repository';

let cachedRole = 'student';
let cachedIsTA = false;

export const getCachedRole = () => cachedRole;
export const getCachedIsTA = () => cachedIsTA;

export const refreshRoleFromClaims = async (user) => {
  if (!user) {
    cachedRole = 'student';
    cachedIsTA = false;
    return cachedRole;
  }

  try {
    const profile = await getUserProfile(user.uid);
    const profileRole = profile?.role;
    if (profileRole === 'admin' || profileRole === 'TA' || profileRole === 'student') {
      cachedRole = profileRole;
    }
    cachedIsTA = profileRole === 'TA' || profile?.isTA === true;
  } catch {
    cachedIsTA = false;
  }

  emitTelemetry('role_refresh', { role: cachedRole, isTA: cachedIsTA });
  return cachedRole;
};

export const signOutFlow = async () => {
  if (useSupabase) return supaSignOut();
  return true;
};

export const setupProfileIfMissing = async (user) => {
  if (!user) return null;
  const next = {
    uid: user.uid,
    displayName: user.displayName || '',
    email: (user.email || '').toLowerCase(),
    role: cachedRole || 'student',
    status: 'active',
    updatedAt: new Date().toISOString(),
  };
  if (useSupabase) {
    const current = await getUserProfile(user.uid);
    if (!current) {
      await upsertUserProfile(user.uid, next);
      return next;
    }
    return current;
  }
  const storeKey = `berkeley_profile_${APP_ID}_${user.uid}`;
  try {
    const raw = localStorage.getItem(storeKey);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore broken record
  }
  localStorage.setItem(storeKey, JSON.stringify(next));
  return next;
};

export const ensureProfileAndRole = async (user) => {
  if (!user) return 'student';
  const profile = await setupProfileIfMissing(user);
  const roleFromProfile = profile?.role;

  if (roleFromProfile === 'TA' || roleFromProfile === 'admin') {
    return roleFromProfile;
  }

  return refreshRoleFromClaims(user);
};

export const cacheRoleFromClaims = async (user) => refreshRoleFromClaims(user);
