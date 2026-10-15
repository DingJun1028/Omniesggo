// ============================================================
// src/supabase-db.js — Supabase 唯一雲端後端（國策: 非 Google/Firebase）
// ------------------------------------------------------------
// 優先級: VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY 齊備即啟用，
// 否則退回 db.js 的 localStorage 本地軌。
// 表: lc_submissions / lc_profiles / lc_tas / lc_pairings / lc_knowledge
// 認證: 匿名登入（Supabase Auth）
// 實時: supabase-js Realtime（postgres_changes，事件→整表重取，簡單穩）
// ============================================================
import { createClient } from '@supabase/supabase-js';

const url = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export const supabaseEnabled = Boolean(url && anonKey && !anonKey.includes('xxxx'));

/** @type {import('@supabase/supabase-js').SupabaseClient | null} */
export const supa = supabaseEnabled ? createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true } }) : null;

const iso = (v) => (v && typeof v.toISOString === 'function' ? v.toISOString() : v ?? null);

// ── 認證 ──────────────────────────────────────────────────────
export const supaAuthInit = (cb) => {
  if (!supa) return () => {};
  const { data } = supa.auth.onAuthStateChange(async (_event, session) => {
    if (session?.user) {
      cb(session.user);
    } else {
      const { error } = await supa.auth.signInAnonymously();
      if (error) console.error('Supabase anonymous auth failed', error);
    }
  });
  return () => data.subscription?.unsubscribe();
};

export const supaSignInGoogle = async () => {
  if (!supa) throw new Error('Supabase 未啟用');
  const { error } = await supa.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });
  if (error) throw error;
};

export const supaSignOut = async () => {
  if (!supa) return false;
  const { error } = await supa.auth.signOut();
  return !error;
};

export const supaCurrentUser = async () => {
  if (!supa) return null;
  const { data } = await supa.auth.getUser();
  return data.user ?? null;
};

// ── Realtime 輔助（事件→整表重取） ────────────────────────────
const subscribeTable = (table, refetch) => {
  if (!supa) return () => {};
  const channel = supa
    .channel(`lc-${table}`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
      refetch().catch((e) => console.error(`refetch ${table} failed`, e));
    })
    .subscribe();
  return () => {
    supa.removeChannel(channel);
  };
};

// ── submissions ──────────────────────────────────────────────
export const supaAddSubmission = async (submission, attachments, id) => {
  const docId = id || String(Date.now());
  const { error } = await supa.from('lc_submissions').upsert({
    id: docId,
    user_id: submission.userId,
    type: submission.type,
    data: { ...(submission.data || {}), attachments: attachments || [] },
    created_at: new Date().toISOString(),
  });
  if (error) throw new Error(`supaAddSubmission: ${error.message}`);
  return docId;
};

const fetchSubmissions = async () => {
  const { data, error } = await supa
    .from('lc_submissions')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(`fetchSubmissions: ${error.message}`);
  return (data || []).map((r) => ({
    id: r.id,
    userId: r.user_id,
    type: r.type,
    data: r.data,
    createdAt: r.created_at,
  }));
};

export const supaSubscribeSubmissions = (onData) => {
  fetchSubmissions().then(onData).catch((e) => console.error('Supabase submissions load failed', e));
  return subscribeTable('lc_submissions', async () => {
    onData(await fetchSubmissions());
  });
};

export const supaDeleteSubmission = async (id) => {
  const { error } = await supa.from('lc_submissions').delete().eq('id', id);
  if (error) throw new Error(`supaDeleteSubmission: ${error.message}`);
};

// ── profiles ─────────────────────────────────────────────────
const rowToProfile = (r) =>
  r
    ? {
        uid: r.uid,
        displayName: r.display_name,
        email: r.email,
        role: r.role,
        org: r.org,
        status: r.status,
        updatedAt: r.updated_at,
      }
    : null;

export const supaGetProfile = async (uid) => {
  if (!uid) return null;
  const { data, error } = await supa.from('lc_profiles').select('*').eq('uid', uid).maybeSingle();
  if (error) throw new Error(`supaGetProfile: ${error.message}`);
  return rowToProfile(data);
};

export const supaUpsertProfile = async (uid, updates = {}) => {
  const current = (await supaGetProfile(uid)) || {};
  const next = {
    uid,
    display_name: String(updates.displayName ?? current.displayName ?? ''),
    email: String(updates.email ?? current.email ?? '').toLowerCase(),
    role: String(updates.role ?? current.role ?? 'student'),
    org: String(updates.org ?? current.org ?? ''),
    status: String(updates.status ?? current.status ?? 'active'),
    updated_at: new Date().toISOString(),
  };
  const { error } = await supa.from('lc_profiles').upsert(next);
  if (error) throw new Error(`supaUpsertProfile: ${error.message}`);
  return rowToProfile(next);
};

// ── TAs ──────────────────────────────────────────────────────
const rowToTA = (r) =>
  r
    ? {
        uid: r.uid,
        isTA: r.is_ta,
        bio: r.bio,
        slots: r.slots || [],
        assignedStudents: r.assigned_students || [],
        updatedAt: r.updated_at,
      }
    : null;

export const supaGetTA = async (uid) => {
  if (!uid) return null;
  const { data, error } = await supa.from('lc_tas').select('*').eq('uid', uid).maybeSingle();
  if (error) throw new Error(`supaGetTA: ${error.message}`);
  return rowToTA(data);
};

export const supaUpsertTA = async (uid, updates = {}) => {
  const current = (await supaGetTA(uid)) || {};
  const next = {
    uid,
    is_ta: Boolean(updates.isTA ?? current.isTA ?? false),
    bio: String(updates.bio ?? current.bio ?? ''),
    slots: updates.slots ?? current.slots ?? [],
    assigned_students: updates.assignedStudents ?? current.assignedStudents ?? [],
    updated_at: new Date().toISOString(),
  };
  const { error } = await supa.from('lc_tas').upsert(next);
  if (error) throw new Error(`supaUpsertTA: ${error.message}`);
  return rowToTA(next);
};

// ── pairings ─────────────────────────────────────────────────
const rowToPairing = (r) =>
  r
    ? {
        id: r.id,
        mentorUid: r.mentor_uid,
        menteeUid: r.mentee_uid,
        status: r.status,
        note: r.note,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }
    : null;

export const supaSetPairing = async (id, payload) => {
  const row = {
    id,
    mentor_uid: payload.mentorUid,
    mentee_uid: payload.menteeUid,
    status: payload.status || 'pending',
    note: payload.note || '',
    created_at: iso(payload.createdAt) || new Date().toISOString(),
    updated_at: iso(payload.updatedAt) || new Date().toISOString(),
  };
  const { error } = await supa.from('lc_pairings').upsert(row);
  if (error) throw new Error(`supaSetPairing: ${error.message}`);
};

export const supaUpdatePairing = async (id, patch) => {
  const body = {};
  if (patch.status !== undefined) body.status = patch.status;
  if (patch.note !== undefined) body.note = patch.note;
  body.updated_at = new Date().toISOString();
  const { error } = await supa.from('lc_pairings').update(body).eq('id', id);
  if (error) throw new Error(`supaUpdatePairing: ${error.message}`);
};

export const supaDeletePairing = async (id) => {
  const { error } = await supa.from('lc_pairings').delete().eq('id', id);
  if (error) throw new Error(`supaDeletePairing: ${error.message}`);
};

export const supaLoadPairing = async (id) => {
  const { data, error } = await supa.from('lc_pairings').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(`supaLoadPairing: ${error.message}`);
  return rowToPairing(data);
};

const fetchPairingsBy = async (column, uid) => {
  const { data, error } = await supa.from('lc_pairings').select('*').eq(column, uid);
  if (error) throw new Error(`fetchPairings: ${error.message}`);
  return (data || []).map(rowToPairing);
};

export const supaListPairingsForMentor = (uid) => fetchPairingsBy('mentor_uid', uid);
export const supaListPairingsForMentee = (uid) => fetchPairingsBy('mentee_uid', uid);

const fetchAllPairings = async () => {
  const { data, error } = await supa.from('lc_pairings').select('*').order('updated_at', { ascending: false });
  if (error) throw new Error(`fetchAllPairings: ${error.message}`);
  return (data || []).map(rowToPairing);
};

export const supaSubscribePairings = (onData) => {
  fetchAllPairings().then(onData).catch((e) => console.error('Supabase pairings load failed', e));
  return subscribeTable('lc_pairings', async () => {
    onData(await fetchAllPairings());
  });
};

// ── knowledge (RAG) ──────────────────────────────────────────
const rowToKnowledge = (r) => ({ id: r.id, roles: r.roles || [], ...(r.content || {}) });

const fetchKnowledge = async () => {
  const { data, error } = await supa.from('lc_knowledge').select('*');
  if (error) throw new Error(`fetchKnowledge: ${error.message}`);
  return (data || []).map(rowToKnowledge);
};

export const supaGetKnowledge = fetchKnowledge;

export const supaUpsertKnowledge = async (entry) => {
  const payload = { ...(entry || {}), updatedAt: new Date().toISOString() };
  if (!payload.id) payload.id = `knowledge_${Date.now()}`;
  const { roles, id, ...content } = payload;
  const { error } = await supa.from('lc_knowledge').upsert({
    id,
    roles: Array.isArray(roles) ? roles : [],
    content,
  });
  if (error) throw new Error(`supaUpsertKnowledge: ${error.message}`);
  return payload;
};

export const supaSubscribeKnowledge = (onData) => {
  fetchKnowledge().then(onData).catch((e) => console.error('Supabase knowledge load failed', e));
  return subscribeTable('lc_knowledge', async () => {
    onData(await fetchKnowledge());
  });
};
