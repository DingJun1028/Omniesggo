/* eslint-disable @typescript-eslint/no-unused-vars */
// ============================================================
// src/db.js — 資料層（Firebase Firestore + localStorage fallback）
// ------------------------------------------------------------
// 設計目標：
//   1) 永久儲存：寫入 Firestore，部署後跨裝置共有
//   2) 大附件：前端 base64 data URL 內嵌進文件
//   3) 認證：保留匿名登入 + 支援 Google / 登出
//   4) 用戶資料：user profile 於登入後建立/讀取/更新
//   5) 助教配對：助教->學員配對檔案的 CRUD + 訂閱
//   6) Oracle：後端 proxy 對接；（純 optional，沒有後端時不破壞機能不能用）
// ============================================================

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  getIdTokenResult,
} from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  FirestoreError,
  getDoc,
  query,
  where,
  getDocs,
  writeBatch,
} from 'firebase/firestore';

// 2026-08-25 無縫轉移: 新增 NCBDB 作為跨裝置共用後端 (對齊根專案 ncbQuery)
import { isNcbEnabled, ncbSubmissions, ncbProfiles, ncbTAs, ncbPairings } from './ncb-client';

/** @type {import('firebase/app').FirebaseOptions} */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FB_API_KEY,
  authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FB_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FB_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FB_APP_ID,
  storageBucket: import.meta.env.VITE_FB_STORAGE_BUCKET,
};

export const APP_ID = (
  import.meta.env.VITE_FB_APP_ID_SLUG || 'esggo-learning-center'
).trim();

export const emitTelemetry = (event, payload = {}) => {
  if (import.meta.env.DEV) {
    console.info('[telemetry]', event, payload);
  }
};

export const DataError = Object.freeze({
  CONFIG_INVALID: new Error('Firebase 設定無效，請檢查 .env 是否已填入。'),
  DOCUMENT_TOO_LARGE: new Error('文件大小超過 Firestore 上限 1MB。'),
  UNAUTHENTICATED: new Error('使用者尚未登入。'),
  UNAUTHORIZED: new Error('缺少管理員權限。'),
});

let app = null;
let auth = null;
let db = null;
/** @type {boolean} Whether Firebase is active. */
export let useFirebase = false;

/** @type {boolean} Whether NCBDB (NoCodeBackend) is active. 無縫轉移後端. */
export let useNcb = isNcbEnabled();

const isConfigComplete = () =>
  !!(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.appId &&
    String(firebaseConfig.apiKey).indexOf('xxxx') === -1
  );

if (isConfigComplete()) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({}),
    });
    useFirebase = true;
  } catch (error) {
    console.warn('Firebase init failed, falling back to local storage', error);
    useFirebase = false;
  }
}

const LOCAL_KEY = `berkeley_submissions_${APP_ID}`;
const LOCAL_PROFILE_PREFIX = `berkeley_profile_${APP_ID}_`;
const LOCAL_MENTOR_PREFIX = `berkeley_mentor_${APP_ID}_`;
const LOCAL_PAIRING_PREFIX = `berkeley_pairing_${APP_ID}`;

const isRecordTooLarge = async (files) => {
  const list = Array.isArray(files) ? files.filter(Boolean) : [];
  const total = list.reduce((s, f) => s + (f.size || 0), 0);
  if (total > 700 * 1024) {
    throw DataError.DOCUMENT_TOO_LARGE;
  }
};

/** @type {Set<() => void>} */
const localListeners = new Set();

/** @param {any[]} items */
const notifyLocal = () => {
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
  if (!useFirebase || !auth) {
    cb({ uid: `local-user-${APP_ID}`, isLocal: true });
    return () => {};
  }

  const unsubscribe = onAuthStateChanged(
    auth,
    async (user) => {
      if (user) {
        cb(user);
        return;
      }
      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.error('Anonymous auth failed', error);
        emitTelemetry('auth_error', { code: error?.code });
      }
    },
    (error) => {
      console.error('Auth state change error', error);
      emitTelemetry('auth_state_error', { code: error?.code });
    }
  );

  return unsubscribe;
};

/** Open the Google sign-in flow. */
export const signInWithGoogle = async () => {
  if (!useFirebase || !auth) {
    throw DataError.CONFIG_INVALID;
  }
  try {
    await signInWithPopup(auth, new GoogleAuthProvider());
  } catch (error) {
    console.error('Google sign-in failed', error);
    emitTelemetry('sign_in_error', { code: error?.code });
    if (String(error?.code) === 'auth/operation-not-allowed') {
      throw new Error('Google 登入已停用：請至 Firebase Console → Authentication → Sign-in method 開啟 Google provider。');
    }
    throw error;
  }
};

/** Sign out the current Firebase user. */
export const signOut = async () => {
  if (!useFirebase || !auth) return false;
  try {
    await firebaseSignOut(auth);
    return true;
  } catch (error) {
    console.error('Sign out failed', error);
    return false;
  }
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

function toDocumentPayload(submission, attachments, id) {
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
    createdAt: serverTimestamp(),
  };
}

/**
 * Create or overwrite a submission.
 * @param {{userId: string, type: string, data?: any}} submission
 * @param {{name: string; type: string; size: number; url: string}[]} attachments
 * @param {string} [id]
 */
export const addSubmission = async (submission, attachments, id) => {
  const docId = id || String(Date.now());
  const payload = toDocumentPayload(submission, attachments, docId);

  if (useFirebase && db) {
    await setDoc(doc(db, 'platforms', APP_ID, 'submissions', docId), payload);
  } else if (useNcb) {
    await ncbSubmissions.set(docId, { ...payload, APP_ID });
  } else {
    const item = { id: docId, ...payload, createdAt: new Date().toISOString() };
    const all = loadLocal();
    all.push(item);
    saveLocal(all);
    notifyLocal();
  }

  emitTelemetry('submission_created', { type: submission.type, id: docId });
  return docId;
};

/** Subscribe to submissions in real time. @param {(items: any[]) => void} onData @returns {() => void} */
export const subscribeSubmissions = (userId, onData) => {
  if (useFirebase && db) {
    const collectionRef = collection(db, 'platforms', APP_ID, 'submissions');
    const unsubscribe = onSnapshot(
      collectionRef,
      (snapshot) => {
        const items = snapshot.docs.map((document) => {
          const data = document.data();
          let createdAt = data.createdAt;
          if (createdAt && typeof createdAt.toDate === 'function') {
            createdAt = createdAt.toDate().toISOString();
          }
          return {
            id: document.id,
            userId: data.userId,
            type: data.type,
            data: data.data,
            createdAt,
          };
        });
        items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        onData(items);
      },
      (error) => {
        console.error('Submission snapshot error', error);
        if (error instanceof FirestoreError) {
          emitTelemetry('subscription_error', { code: error.code });
        }
      }
    );
    return unsubscribe;
  }

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
  if (useFirebase && db) {
    await deleteDoc(doc(db, 'platforms', APP_ID, 'submissions', id));
  } else if (useNcb) {
    await ncbSubmissions.delete(id, APP_ID);
  } else {
    const all = loadLocal().filter((item) => item.id !== id);
    saveLocal(all);
    notifyLocal();
  }

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

const profileRef = (uid) => doc(db, 'platforms', APP_ID, 'profiles', uid);
const profileLocalStorageKey = (uid) => `${LOCAL_PROFILE_PREFIX}${uid}`;

const defaultProfile = () => ({
  displayName: '',
  email: '',
  role: 'student',
  org: '',
  status: 'active',
  updatedAt: new Date().toISOString(),
});

/** Merge updated fields onto saved profile. @returns {Promise<any>} */
export const upsertProfile = async (uid, updates = {}) => {
  const payload = defaultProfile();
  let current = null;

  if (useFirebase && db) {
    const snap = await getDoc(profileRef(uid));
    if (snap.exists()) {
      current = snap.data();
    }
  } else if (useNcb) {
    current = await ncbProfiles.get(uid, APP_ID);
  } else {
    try {
      current = JSON.parse(localStorage.getItem(profileLocalStorageKey(uid)) || '{}');
    } catch {
      current = {};
    }
  }

  const next = { ...current, ...updates, updatedAt: new Date().toISOString() };
  if (useFirebase && db) {
    await setDoc(profileRef(uid), next, { merge: true });
  } else if (useNcb) {
    await ncbProfiles.set(uid, APP_ID, next);
  } else {
    localStorage.setItem(profileLocalStorageKey(uid), JSON.stringify(next));
  }

  emitTelemetry('profile_upsert', { uid, role: next.role });
  return next;
};

/** Get current user profile. @returns {Promise<any>} */
export const getProfile = async (uid) => {
  if (!uid) return null;
  if (useFirebase && db) {
    const snap = await getDoc(profileRef(uid));
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } else if (useNcb) {
    return await ncbProfiles.get(uid, APP_ID);
  }

  try {
    return JSON.parse(localStorage.getItem(profileLocalStorageKey(uid)) || '{}');
  } catch {
    return null;
  }
};

// ============================================================
// TA / Mentee 身份標記（support pairing 主資料）
// ============================================================
const LOCAL_TA_PREFIX = `berkeley_ta_${APP_ID}_`;
const taRef = (uid) => doc(db, 'platforms', APP_ID, 'tas', uid);
const taLocalStorageKey = (uid) => `${LOCAL_TA_PREFIX}${uid}`;

const defaultTA = () => ({
  isTA: false,
  bio: '',
  slots: [],
  assignedStudents: [],
  updatedAt: new Date().toISOString(),
});

/** Register or update TA profile. @returns {Promise<any>} */
export const upsertTAProfile = async (uid, updates = {}) => {
  const payload = defaultTA();
  let current = null;

  if (useFirebase && db) {
    const snap = await getDoc(taRef(uid));
    if (snap.exists()) current = snap.data();
  } else if (useNcb) {
    current = await ncbTAs.get(uid, APP_ID);
  } else {
    try {
      current = JSON.parse(localStorage.getItem(taLocalStorageKey(uid)) || '{}');
    } catch {
      current = {};
    }
  }

  const next = { ...current, ...updates, updatedAt: new Date().toISOString() };
  if (useFirebase && db) {
    await setDoc(taRef(uid), next, { merge: true });
  } else if (useNcb) {
    await ncbTAs.set(uid, APP_ID, next);
  } else {
    localStorage.setItem(taLocalStorageKey(uid), JSON.stringify(next));
  }

  emitTelemetry('ta_upsert', { uid, isTA: next.isTA });
  return next;
};

/** Get TA profile. @returns {Promise<any>} */
export const getTAProfile = async (uid) => {
  if (!uid) return null;
  if (useFirebase && db) {
    const snap = await getDoc(taRef(uid));
    if (snap.exists()) return snap.data();
    return null;
  } else if (useNcb) {
    return await ncbTAs.get(uid, APP_ID);
  }

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
  await setPairing(docId, next);
  emitTelemetry('pairing_request', { mentorUid, menteeUid });
  return docId;
};

export const createPairingRequest = requestPairing;

export const acceptPairing = async (mentorUid, menteeUid) => {
  const docId = pairingDocId(mentorUid, menteeUid);
  await updatePairing(docId, { status: PAIRING_STATUS.ASSIGNED, updatedAt: new Date().toISOString() });
  return docId;
};

export const declinePairing = async (mentorUid, menteeUid) => {
  const docId = pairingDocId(mentorUid, menteeUid);
  await updatePairing(docId, { status: PAIRING_STATUS.DECLINED, updatedAt: new Date().toISOString() });
  return docId;
};

/** 建立/覆寫整筆 pairing @param {string} id @param {any} payload */
const setPairing = async (id, payload) => {
  if (useFirebase && db) {
    const ref = doc(db, 'platforms', APP_ID, 'pairings', id);
    await setDoc(ref, payload);
    return;
  } else if (useNcb) {
    await ncbPairings.set(id, APP_ID, payload);
    return;
  }

  const storeKey = pairingCollectionLocalStoragePrefix() + id;
  localStorage.setItem(storeKey, JSON.stringify(payload));
  emitPairingLocalEvent();
};

/** 更新部分欄位 @param {string} id @param {Partial<any>} patch */
const updatePairing = async (id, patch) => {
  if (useFirebase && db) {
    const ref = doc(db, 'platforms', APP_ID, 'pairings', id);
    await setDoc(ref, patch, { merge: true });
    return;
  } else if (useNcb) {
    const current = await ncbPairings.list(APP_ID).then((arr) => arr.find((p) => p.id === id) || {});
    await ncbPairings.set(id, APP_ID, { ...current, ...patch });
    return;
  }

  const storeKey = pairingCollectionLocalStoragePrefix() + id;
  const current = JSON.parse(localStorage.getItem(storeKey) || '{}');
  const next = { ...current, ...patch };
  localStorage.setItem(storeKey, JSON.stringify(next));
  emitPairingLocalEvent();
};

export const deletePairing = async (mentorUid, menteeUid) => {
  const docId = pairingDocId(mentorUid, menteeUid);
  if (useFirebase && db) {
    await deleteDoc(doc(db, 'platforms', APP_ID, 'pairings', docId));
  } else if (useNcb) {
    await ncbPairings.delete(docId, APP_ID);
  } else {
    localStorage.removeItem(pairingCollectionLocalStoragePrefix() + docId);
    emitPairingLocalEvent();
  }

  return docId;
};

export const removePairing = deletePairing;

/** Load pairing by ids. @returns {Promise<any | null>} */
export const loadPairing = async (mentorUid, menteeUid) => {
  const docId = pairingDocId(mentorUid, menteeUid);
  if (useFirebase && db) {
    const snap = await getDoc(doc(db, 'platforms', APP_ID, 'pairings', docId));
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() };
    }
    return null;
  } else if (useNcb) {
    const all = await ncbPairings.list(APP_ID);
    const found = all.find((p) => p.id === docId);
    return found ? { id: docId, ...found } : null;
  }

  try {
    const raw = localStorage.getItem(pairingCollectionLocalStoragePrefix() + docId);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const listPairingsForMentor = async (mentorUid) => {
  if (useFirebase && db) {
    const ref = collection(db, 'platforms', APP_ID, 'pairings');
    const q = query(ref, where('mentorUid', '==', mentorUid));
    const snap = await getDocs(q);
    return snap.docs.map((document) => ({ id: document.id, ...document.data() }));
  } else if (useNcb) {
    const all = await ncbPairings.list(APP_ID);
    return all.filter((p) => p.mentorUid === mentorUid).map((p) => ({ id: p.id, ...p }));
  }

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
  if (useFirebase && db) {
    const ref = collection(db, 'platforms', APP_ID, 'pairings');
    const q = query(ref, where('menteeUid', '==', menteeUid));
    const snap = await getDocs(q);
    return snap.docs.map((document) => ({ id: document.id, ...document.data() }));
  } else if (useNcb) {
    const all = await ncbPairings.list(APP_ID);
    return all.filter((p) => p.menteeUid === menteeUid).map((p) => ({ id: p.id, ...p }));
  }

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
  if (useFirebase && db) {
    const collectionRef = collection(db, 'platforms', APP_ID, 'pairings');
    const unsubscribe = onSnapshot(
      collectionRef,
      (snapshot) => {
        const items = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }));
        onData(items);
      },
      (error) => {
        console.error('Pairing snapshot error', error);
        if (error instanceof FirestoreError) {
          emitTelemetry('pairing_subscription_error', { code: error.code });
        }
      }
    );
    return unsubscribe;
  } else if (useNcb) {
    let stopped = false;
    const run = async () => {
      if (stopped) return;
      try {
        const items = (await ncbPairings.list(APP_ID)).map((p) => ({ id: p.id, ...p }));
        onData(items);
      } catch (e) {
        console.error('NCB pairings poll error', e);
      }
    };
    run();
    const interval = setInterval(run, 3000);
    return () => {
      stopped = true;
      clearInterval(interval);
    };
  }

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
// 完全沒有 proxy 時，所有呼叫都會 fallback 到 Firestore 或 localStorage。
// ============================================================

const ORACLE_API_BASE = (import.meta.env.VITE_ORACLE_API_BASE || '').trim();
const USE_ORACLE = String(import.meta.env.VITE_USE_ORACLE || 'false').toLowerCase() === 'true';

const isOracleEnabled = () => USE_ORACLE && Boolean(ORACLE_API_BASE);

/**
 * 預留 Oracle adapter：把 whatever export/import 需求做 proxy 化。
 * 目前不會主動叫 Oracle，僅符合「永遠可控」的設計。
 *
 * export const exportToOracleCsv = async (records, locale = 'zh-TW') => {
 *   if (!isOracleEnabled()) {
 *     throw new Error('Oracle proxy 未啟用');
 *   }
 *   const res = await fetch(`${ORACLE_API_BASE}/exports?locale=${encodeURIComponent(locale)}`, {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ records }),
 *   });
 *   if (!res.ok) {
 *     const text = await res.text();
 *     throw new Error(`Oracle export failed ${res.status}: ${text}`);
 *   }
 *   return res.json();
 * };
 */

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

// ============================================================
// 無縫遷移: localStorage → NCBDB
// 當 useNcb 啟用時, 呼叫一次即可把瀏覽器內既有 localStorage 資料
// 搬移到 NCBDB (使用者無感, 不丟資料)
// ============================================================
export const migrateLocalToNcb = async () => {
  if (!useNcb) {
    console.info('[NCB Migration] skipped (NCBDB not enabled)');
    return { migrated: 0, reason: 'NCB_DISABLED' };
  }
  let count = 0;
  try {
    // submissions
    const subs = loadLocal();
    for (const s of subs) {
      await ncbSubmissions.set(s.id, { ...s, APP_ID });
      count++;
    }
    // profiles
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(profileLocalStoragePrefix())) {
        const uid = key.replace(profileLocalStoragePrefix(), '');
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        await ncbProfiles.set(uid, APP_ID, data);
        count++;
      }
    }
    // tas
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(LOCAL_TA_PREFIX)) {
        const uid = key.replace(LOCAL_TA_PREFIX, '');
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        await ncbTAs.set(uid, APP_ID, data);
        count++;
      }
    }
    // pairings
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(pairingCollectionLocalStoragePrefix())) {
        const id = key.replace(pairingCollectionLocalStoragePrefix(), '');
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        await ncbPairings.set(id, APP_ID, data);
        count++;
      }
    }
    console.info(`[NCB Migration] done: ${count} records migrated`);
    return { migrated: count };
  } catch (e) {
    console.error('[NCB Migration] failed', e);
    return { migrated: count, error: e?.message || String(e) };
  }
};

export { auth, db };
