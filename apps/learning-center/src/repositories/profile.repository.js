import { useSupabase, APP_ID, emitTelemetry } from '../db';
import { supaGetProfile, supaUpsertProfile } from '../supabase-db';

const profileLocalStorageKey = (uid) => `berkeley_profile_${APP_ID}_${uid}`;

export const upsertUserProfile = async (uid, updates = {}) => {
  if (useSupabase) {
    const next = await supaUpsertProfile(uid, updates);
    emitTelemetry('profile_upsert', { uid, role: next.role });
    return next;
  }
  let current;
  try { current = JSON.parse(localStorage.getItem(profileLocalStorageKey(uid)) || '{}'); }
  catch { current = {}; }

  const next = { ...current, ...updates, updatedAt: new Date().toISOString() };
  localStorage.setItem(profileLocalStorageKey(uid), JSON.stringify(next));

  emitTelemetry('profile_upsert', { uid, role: next.role });
  return next;
};

export const getUserProfile = async (uid) => {
  if (!uid) return null;
  if (useSupabase) return supaGetProfile(uid);

  try { return JSON.parse(localStorage.getItem(profileLocalStorageKey(uid)) || '{}'); }
  catch { return null; }
};

export { profileLocalStorageKey as localKeyFor };
