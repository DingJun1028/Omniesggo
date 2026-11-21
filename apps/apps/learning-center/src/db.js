// ============================================================
// src/db.js — 資料層（Supabase + localStorage fallback）
// ------------------------------------------------------------
// 設計目標：
//   1) 永久儲存：寫入 Supabase，部署後跨裝置共有
//   2) 大附件：前端 base64 data URL 內嵌進文件
//   3) 認證：Supabase 匿名登入 + 登出
//   4) 用戶資料：user profile 於登入後建立/讀取/更新
//   5) 助教配對：助教->學員配對檔案的 CRUD + 訂閱
//   6) Oracle：後端 proxy 對接；（純 optional，沒有後端時不破壞機能不能用）
// ============================================================

import {
  supabaseEnabled,
  supaAuthInit,
  supaSignOut,
  supaAddSubmission,
  supaSubscribeSubmissions,
  supaDeleteSubmission,
  supaGetProfile,
  supaUpsertProfile,
  supaGetTA,
  supaUpsertTA,
  supaSetPairing,
  supaUpdatePairing,
  supaDeletePairing,
  supaLoadPairing,
  supaListPairingsForMentor,
  supaListPairingsForMentee,
  supaSubscribePairings,
} from './supabase-db';

/** Supabase 啟用旗標（國策: 非 Google）。false 時退回 localStorage。 */
export const useSupabase = supabaseEnabled;

export const APP_ID = (
  import.meta.env.VITE_APP_ID_SLUG || 'esggo-learning-center'
).trim();

export const emitTelemetry = (event, payload = {}) => {
  if (import.meta.env.DEV) {
    console.info('[telemetry]', event, payload);
  }
};

export const DataError = Object.freeze({
  DOCUMENT_TOO_LARGE: new Error('提交內容大小超過上限。'),
  UNAUTHENTICATED: new Error('使用者尚未登入。'),
  UNAUTHORIZED: new Error('缺少管理員權限。'),
});

const LOCAL_KEY = `berkeley_submissions_${APP_ID}`;
const LOCAL_PROFILE_PREFIX = `berkeley_profile_${APP_ID}_`;
const LOCAL_TA_PREFIX = `berkeley_ta_${APP_ID}_`;
const LOCAL_PAIRING_PREFIX = `berkeley_pairing_${APP_ID}`;

const isRecordTooLarge = async (files) => {
  const list = Array.isArray(files) ? files.filter(Boolean) : [];
  const total = list.reduce((s, f) => s + (f.size || 0), 0);
  if (total > 700 * 1024) {
    throw DataError.DOCUMENT_TOO_LARGE;
  }
};

/** @type {Set<(items: any[]) => void>} */
export const localListeners = new Set();

/** @param {any[]} items */
export const notifyLocal = () => {
  const next = loadLocal()
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  for (const cb of localListeners) {
    try {
      cb(next);
    } catch (error) {
      console.error('Local listener failed', error);
    }
  }
};

/** Save local submissions array. @type {any[]} items */
export const saveLocal = (items) => {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(items));
  } catch (error) {
    console.warn('localStorage save failed', error);
  }
};

/** Load local submissions from localStorage. @returns {any[]} */
export const loadLocal = () => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
  } catch {
    return [];
  }
};

/** @param {(user: { uid: string; isLocal?: boolean }) => void} cb @returns {() => void} */
export const initAuth = (cb) => {
  if (useSupabase) return supaAuthInit(cb);
  cb({ uid: `local-user-${APP_ID}`, isLocal: true });
  return () => {};
};

/** Sign out the current user. */
export const signOut = async () => {
  if (useSupabase) return supaSignOut();
  return true;
};

/**
 * Convert File[] to base64 attachment metadata.
 * @param {File[]} files
 * @returns {Promise<Array<{ name: string; type: string; size: number; url: string }>>}
 */
export const uploadFiles = async (files) => {
  const list = Array.isArray(files) ? files.filter(Boolean) : [];
  if (!list.length) return [];

  emitTelemetry('attachment_upload_start', { count: list.length });
  await isRecordTooLarge(list);

  return Promise.all(
    list.map(
      (file) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () =>
            resolve({
              name: file.name,
              type: file.type,
              size: file.size,
              url: reader.result,
            });
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        })
    )
  );
};

function toDocumentPayload(submission, attachments) {
  if (!submission?.userId) {
    throw DataError.UNAUTHENTICATED;
  }

  return {
    userId: submission.userId,
    type: submission.type,
    data: {
      ...(submission.data || {}),
      attachments: attachments || [],
    },
    createdAt: new Date().toISOString(),
  };
}

/**
 * Create or overwrite a submission.
 * @param {{userId: string, type: string, data?: any}} submission
 * @param {{name: string; type: string; size: number; url: string}[]} attachments
 * @param {string} [id]
 */
export const addSubmission = async (submission, attachments, id) => {
  if (useSupabase) {
    const docId = await supaAddSubmission(submission, attachments, id);
    emitTelemetry('submission_created', { type: submission.type, id: docId });
    return docId;
  }
  const docId = id || String(Date.now());
  const payload = toDocumentPayload(submission, attachments);

  const item = { id: docId, ...payload };
  const all = loadLocal();
  all.push(item);
  saveLocal(all);
  notifyLocal();

  emitTelemetry('submission_created', { type: submission.type, id: docId });
  return docId;
};

/** Subscribe to submissions in real time. @param {(items: any[]) => void} onData @returns {() => void} */
export const subscribeSubmissions = (userId, onData) => {
  if (useSupabase) return supaSubscribeSubmissions(onData);

  const onNext = (data) => onData(data);
  localListeners.add(onNext);
  onNext(
    loadLocal()
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  );
  return () => localListeners.delete(onNext);
};

/** Delete a submission by id. @param {string} id */
export const deleteSubmission = async (id) => {
  if (useSupabase) {
    await supaDeleteSubmission(id);
    emitTelemetry('submission_deleted', { id });
    return;
  }
  const all = loadLocal().filter((item) => item.id !== id);
  saveLocal(all);
  notifyLocal();

  emitTelemetry('submission_deleted', { id });
};

/** Delete all local submissions. @type {boolean} [confirm] */
export const clearLocal = (confirm = false) => {
  if (!confirm) {
    throw new Error('clearLocal requires explicit confirmation');
  }
  localStorage.removeItem(LOCAL_KEY);
  notifyLocal();
};

// ============================================================
// User profile（登入後補資料/角色/聯絡資訊）
// ============================================================

const profileLocalStorageKey = (uid) => `${LOCAL_PROFILE_PREFIX}${uid}`;

/** Merge updated fields onto saved profile. @returns {Promise<any>} */
export const upsertProfile = async (uid, updates = {}) => {
  if (useSupabase) {
    const next = await supaUpsertProfile(uid, updates);
    emitTelemetry('profile_upsert', { uid, role: next.role });
    return next;
  }
  let current;
  try {
    current = JSON.parse(localStorage.getItem(profileLocalStorageKey(uid)) || '{}');
  } catch {
    current = {};
  }

  const next = { ...current, ...updates, updatedAt: new Date().toISOString() };
  localStorage.setItem(profileLocalStorageKey(uid), JSON.stringify(next));

  emitTelemetry('profile_upsert', { uid, role: next.role });
  return next;
};

/** Get current user profile. @returns {Promise<any>} */
export const getProfile = async (uid) => {
  if (!uid) return null;
  if (useSupabase) return supaGetProfile(uid);

  try {
    return JSON.parse(localStorage.getItem(profileLocalStorageKey(uid)) || '{}');
  } catch {
    return null;
  }
};

// ============================================================
// TA / Mentee 身份標記（support pairing 主資料）
// ============================================================
const taLocalStorageKey = (uid) => `${LOCAL_TA_PREFIX}${uid}`;

/** Register or update TA profile. @returns {Promise<any>} */
export const upsertTAProfile = async (uid, updates = {}) => {
  if (useSupabase) {
    const next = await supaUpsertTA(uid, updates);
    emitTelemetry('ta_upsert', { uid, isTA: next.isTA });
    return next;
  }
  let current;
  try {
    current = JSON.parse(localStorage.getItem(taLocalStorageKey(uid)) || '{}');
  } catch {
    current = {};
  }

  const next = { ...current, ...updates, updatedAt: new Date().toISOString() };
  localStorage.setItem(taLocalStorageKey(uid), JSON.stringify(next));

  emitTelemetry('ta_upsert', { uid, isTA: next.isTA });
  return next;
};

/** Get TA profile. @returns {Promise<any>} */
export const getTAProfile = async (uid) => {
  if (!uid) return null;
  if (useSupabase) return supaGetTA(uid);

  try {
    return JSON.parse(localStorage.getItem(taLocalStorageKey(uid)) || '{}');
  } catch {
    return null;
  }
};

export const setCurrentRole = (role) => {
  emitTelemetry('role_set', { role });
};

let _currentRole = 'student';

export const setCurrentRoleValue = (r) => { _currentRole = r; };

export const getCurrentRole = () => _currentRole || 'student';

// ============================================================
// Pairing：助教 -> 學員配對
//   狀態流程：pending -> assigned / declined
// ============================================================

export const PAIRING_STATUS = Object.freeze({
  PENDING: 'pending',
  ASSIGNED: 'assigned',
  DECLINED: 'declined',
});

export const PAIRING_ROLE = Object.freeze({
  TA: 'ta',
  MENTEE: 'mentee',
});

/** pairing 預設 payload */
const newPairingPayload = (mentorUid, menteeUid, status = PAIRING_STATUS.PENDING) => ({
  mentorUid,
  menteeUid,
  status,
  note: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

function pairingDocId(mentorUid, menteeUid) {
  return `${mentorUid}__${menteeUid}`;
}

export const requestPairing = async (mentorUid, menteeUid) => {
  const docId = pairingDocId(mentorUid, menteeUid);
  const next = newPairingPayload(mentorUid, menteeUid);
  if (useSupabase) {
    await supaSetPairing(docId, next);
    emitTelemetry('pairing_request', { mentorUid, menteeUid });
    return docId;
  }
  await setPairing(docId, next);
  emitTelemetry('pairing_request', { mentorUid, menteeUid });
  return docId;
};

export const createPairingRequest = requestPairing;

export const acceptPairing = async (mentorUid, menteeUid) => {
  const docId = pairingDocId(mentorUid, menteeUid);
  const patch = { status: PAIRING_STATUS.ASSIGNED, updatedAt: new Date().toISOString() };
  if (useSupabase) {
    await supaUpdatePairing(docId, patch);
    return docId;
  }
  await updatePairing(docId, patch);
  return docId;
};

export const declinePairing = async (mentorUid, menteeUid) => {
  const docId = pairingDocId(mentorUid, menteeUid);
  const patch = { status: PAIRING_STATUS.DECLINED, updatedAt: new Date().toISOString() };
  if (useSupabase) {
    await supaUpdatePairing(docId, patch);
    return docId;
  }
  await updatePairing(docId, patch);
  return docId;
};

/** 建立/覆寫整筆 pairing @param {string} id @param {any} payload */
const setPairing = async (id, payload) => {
  const storeKey = pairingCollectionLocalStoragePrefix() + id;
  localStorage.setItem(storeKey, JSON.stringify(payload));
  emitPairingLocalEvent();
};

/** 更新部分欄位 @param {string} id @param {Partial<any>} patch */
const updatePairing = async (id, patch) => {
  const storeKey = pairingCollectionLocalStoragePrefix() + id;
  const current = JSON.parse(localStorage.getItem(storeKey) || '{}');
  const next = { ...current, ...patch };
  localStorage.setItem(storeKey, JSON.stringify(next));
  emitPairingLocalEvent();
};

export const deletePairing = async (mentorUid, menteeUid) => {
  const docId = pairingDocId(mentorUid, menteeUid);
  if (useSupabase) {
    await supaDeletePairing(docId);
    return docId;
  }
  localStorage.removeItem(pairingCollectionLocalStoragePrefix() + docId);
  emitPairingLocalEvent();

  return docId;
};

export const removePairing = deletePairing;

/** Load pairing by ids. @returns {Promise<any | null>} */
export const loadPairing = async (mentorUid, menteeUid) => {
  const docId = pairingDocId(mentorUid, menteeUid);
  if (useSupabase) return supaLoadPairing(docId);

  try {
    const raw = localStorage.getItem(pairingCollectionLocalStoragePrefix() + docId);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const listPairingsForMentor = async (mentorUid) => {
  if (useSupabase) return supaListPairingsForMentor(mentorUid);

  const out = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(pairingCollectionLocalStoragePrefix())) {
      continue;
    }
    try {
      const record = JSON.parse(localStorage.getItem(key) || '{}');
      if (record?.mentorUid === mentorUid) {
        out.push({ id: key.replace(pairingCollectionLocalStoragePrefix(), ''), ...record });
      }
    } catch {
      // ignore broken localStorage record
    }
  }
  return out;
};

export const listPairingsForMentee = async (menteeUid) => {
  if (useSupabase) return supaListPairingsForMentee(menteeUid);

  const out = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(pairingCollectionLocalStoragePrefix())) {
      continue;
    }
    try {
      const record = JSON.parse(localStorage.getItem(key) || '{}');
      if (record?.menteeUid === menteeUid) {
        out.push({ id: key.replace(pairingCollectionLocalStoragePrefix(), ''), ...record });
      }
    } catch {
      // ignore
    }
  }
  return out;
};

const pairingLocalListeners = new Set();

const emitPairingLocalEvent = () => {
  const store = loadAllPairingsLocal();
  for (const cb of [...pairingLocalListeners]) {
    try {
      cb(store);
    } catch (error) {
      console.error('Pairing local listener failed', error);
      pairingLocalListeners.delete(cb);
    }
  }
};

/** Subscribe to all pairings. @returns {() => void} */
export const subscribePairings = (onData) => {
  if (useSupabase) return supaSubscribePairings(onData);

  const next = (store) => onData(store);
  pairingLocalListeners.add(next);
  next(loadAllPairingsLocal());
  return () => pairingLocalListeners.delete(next);
};

/** Load all pairings from localStorage. @returns {any[]} */
const loadAllPairingsLocal = () => {
  const out = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(pairingCollectionLocalStoragePrefix())) continue;
    try {
      const record = JSON.parse(localStorage.getItem(key) || '{}');
      out.push({ id: key.replace(pairingCollectionLocalStoragePrefix(), ''), ...record });
    } catch {
      // ignore broken record
    }
  }
  return out.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
};

const pairingCollectionLocalStoragePrefix = () => `${LOCAL_PAIRING_PREFIX}_`;

// ============================================================
// Oracle Always Free proxy helpers（optional）
// 這是一套 pure-JS 的選用型 adapter：有 VITE_ORACLE_API_BASE 就會用 proxy；
// 完全沒有 proxy 時，所有呼叫都會 fallback 到 localStorage。
// ============================================================

const ORACLE_API_BASE = (import.meta.env.VITE_ORACLE_API_BASE || '').trim();
const USE_ORACLE = String(import.meta.env.VITE_USE_ORACLE || 'false').toLowerCase() === 'true';

const isOracleEnabled = () => USE_ORACLE && Boolean(ORACLE_API_BASE);

export const fetchOracleHealth = async () => {
  if (!isOracleEnabled()) {
    return { enabled: false, healthy: false, reason: 'ORACLE_DISABLED' };
  }
  try {
    const res = await fetch(`${ORACLE_API_BASE.replace(/\/$/, '')}/health`, { method: 'GET' });
    if (!res.ok) {
      return { enabled: true, healthy: false, status: res.status, reason: await res.text() };
    }
    const data = await res.json().catch(() => ({}));
    return { enabled: true, healthy: true, data };
  } catch (error) {
    return { enabled: true, healthy: false, reason: error?.message || String(error) };
  }
};
