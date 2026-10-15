import { useSupabase, APP_ID, emitTelemetry } from '../db';
import { supaGetTA, supaUpsertTA } from '../supabase-db';

const LOCAL_TA_PREFIX = `berkeley_ta_${APP_ID}_`;
const taLocalStorageKey = (uid) => `${LOCAL_TA_PREFIX}${uid}`;

export const upsertTAProfile = async (uid, updates = {}) => {
  if (useSupabase) {
    const next = await supaUpsertTA(uid, updates);
    emitTelemetry('ta_upsert', { uid, isTA: next.isTA });
    return next;
  }
  let current;
  try { current = JSON.parse(localStorage.getItem(taLocalStorageKey(uid)) || '{}'); }
  catch { current = {}; }

  const next = { ...current, ...updates, updatedAt: new Date().toISOString() };
  localStorage.setItem(taLocalStorageKey(uid), JSON.stringify(next));

  emitTelemetry('ta_upsert', { uid, isTA: next.isTA });
  return next;
};

export const getTAProfile = async (uid) => {
  if (!uid) return null;
  if (useSupabase) return supaGetTA(uid);

  try { return JSON.parse(localStorage.getItem(taLocalStorageKey(uid)) || '{}'); }
  catch { return null; }
};
