// ============================================================
// src/repositories/rag.repository.js — OmniData RAG 查詢層
// ============================================================
import { useSupabase, APP_ID, emitTelemetry } from '../db';
import { supaGetKnowledge, supaSubscribeKnowledge, supaUpsertKnowledge } from '../supabase-db';
import { loadLocalOmnidata, saveLocalOmnidata } from '../data/omnidata';

const filterByRole = (all, role) => {
  const roles = Array.isArray(role) ? role : [role];
  return all.filter((item) => {
    const allowed = Array.isArray(item.roles) ? item.roles : [];
    return allowed.length === 0 || allowed.some((r) => roles.includes(r));
  });
};

/** Get all knowledge entries visible to the role. @param {string} [role] @returns {Promise<any[]>} */
export const getKnowledgeEntries = async (role = 'student') => {
  if (!Array.isArray(role) && typeof role === 'string') {
    role = [role];
  }
  if (useSupabase) {
    return filterByRole(await supaGetKnowledge(), role);
  }
  return filterByRole(loadLocalOmnidata(), role);
};

/** Subscribe knowledge entries for a role in real time. @param {string} [role] @param {(entries: any[]) => void} onData @returns {() => void} */
export const subscribeKnowledgeEntries = (role = 'student', onData) => {
  if (!Array.isArray(role) && typeof role === 'string') {
    role = [role];
  }
  if (useSupabase) {
    return supaSubscribeKnowledge((all) => onData(filterByRole(all, role)));
  }
  onData(filterByRole(loadLocalOmnidata(), role));
  return () => {};
};

/** Simple keyword search over title/body/tags for visible entries. */
export const searchKnowledge = async (queryText = '', role = 'student') => {
  const all = await getKnowledgeEntries(role);
  const q = String(queryText || '').trim().toLowerCase();
  if (!q) return all;
  const results = all.filter((item) => {
    const hay = `${item.title || ''} ${item.body || ''} ${(item.tags || []).join(' ')}`.toLowerCase();
    return hay.includes(q);
  });
  emitTelemetry('rag_search', { queryLength: q.length, role, resultCount: results.length });
  return results;
};

/** Create or overwrite a knowledge entry. */
export const upsertKnowledgeEntry = async (entry) => {
  const payload = { ...(entry || {}), updatedAt: new Date().toISOString() };
  if (!payload.id) {
    payload.id = payload.id || `${APP_ID}_${String(Date.now())}`;
  }
  if (useSupabase) {
    const next = await supaUpsertKnowledge(payload);
    emitTelemetry('rag_upsert', { id: next.id });
    return next;
  }
  const existing = loadLocalOmnidata();
  const idx = existing.findIndex((item) => item.id === payload.id);
  if (idx >= 0) existing[idx] = payload;
  else existing.push(payload);
  saveLocalOmnidata(existing);
  emitTelemetry('rag_upsert', { id: payload.id });
  return payload;
};
