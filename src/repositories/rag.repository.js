/* eslint-disable @typescript-eslint/no-unused-vars */
// ============================================================
// src/repositories/rag.repository.js — OmniData RAG 查詢層
// ============================================================
import { collection, onSnapshot, query, where, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, useFirebase, APP_ID, emitTelemetry } from '../db';
import { loadLocalOmnidata, saveLocalOmnidata } from '../data/omnidata';

const collectionPath = (platformId) => `platforms/${platformId}/knowledge`;

/** Get all knowledge entries visible to the role. @param {string} [role] @returns {Promise<any[]>} */
export const getKnowledgeEntries = async (role = 'student') => {
  if (!Array.isArray(role) && typeof role === 'string') {
    role = [role];
  }
  if (!useFirebase || !db) {
    return loadLocalOmnidata().filter((item) => {
      const allowed = item.roles || [];
      return allowed.length === 0 || allowed.some((r) => (role || []).includes(r));
    });
  }

  const ref = collection(db, collectionPath(APP_ID));
  const snap = await getDocs(ref);
  const all = snap.docs.map((document) => ({ id: document.id, ...document.data() }));
  return all.filter((item) => {
    const allowed = Array.isArray(item.roles) ? item.roles : [];
    return allowed.length === 0 || allowed.some((r) => (role || []).includes(r));
  });
};

/** Subscribe knowledge entries for a role in real time. @param {string} [role] @param {(entries: any[]) => void} onData @returns {() => void} */
export const subscribeKnowledgeEntries = (role = 'student', onData) => {
  if (!Array.isArray(role) && typeof role === 'string') {
    role = [role];
  }
  if (!useFirebase || !db) {
    const list = loadLocalOmnidata().filter((item) => {
      const allowed = item.roles || [];
      return allowed.length === 0 || allowed.some((r) => (role || []).includes(r));
    });
    onData(list);
    return () => {};
  }

  const ref = collection(db, collectionPath(APP_ID));
  const unsubscribe = onSnapshot(
    ref,
    (snapshot) => {
      const all = snapshot.docs.map((document) => ({ id: document.id, ...document.data() }));
      const next = all.filter((item) => {
        const allowed = Array.isArray(item.roles) ? item.roles : [];
        return allowed.length === 0 || allowed.some((r) => (role || []).includes(r));
      });
      onData(next);
    },
    (error) => {
      console.error('Knowledge snapshot error', error);
      emitTelemetry('knowledge_subscription_error', { code: error?.code });
    }
  );
  return unsubscribe;
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
  if (useFirebase && db) {
    await setDoc(doc(db, collectionPath(APP_ID), payload.id), payload, { merge: true });
  } else {
    const existing = loadLocalOmnidata();
    const idx = existing.findIndex((item) => item.id === payload.id);
    if (idx >= 0) existing[idx] = payload;
    else existing.push(payload);
    saveLocalOmnidata(existing);
  }
  emitTelemetry('rag_upsert', { id: payload.id });
  return payload;
};
