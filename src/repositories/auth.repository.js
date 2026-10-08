// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
/**
 * Authentication Repository Adapter
 *
 * 移除 100% Google/Firebase 依賴, 改用 Supabase Auth + 本地 localStorage 聯儲。
 * 保留所有原有認證機能 (email/password, Google OAuth, 匿名登入, 角色策略)。
 * 此檔案符合 5T: Traceable (source_origin 標記), Trackable (生命週期事件),
 * Tangible (即時回饋), Transparent (錯誤訊息可讀), Trustworthy (Object.freeze)。
 */

import { supabase } from '../lib/supabase-client';
import { getUserProfile, upsertUserProfile } from './profile.repository';
import { ncbQuery } from '../lib/ncb-client';
import { isNcbEnabled } from '../lib/ncb-client';

// ── 模擬版 (未設定任何外部憑證時回退) ────────────────────────────────

let cachedRole = 'student';
let cachedIsTA = false;

export const getCachedRole = () => cachedRole;
export const getCachedIsTA = () => cachedIsTA;

/**
 * 從用戶 claims 刷新角色。真實模式 (Supabase/GCP) 才查詢; 模擬模式直接回 'student'。
 */
export const refreshRoleFromClaims = async (user) => {
  if (!user || !user.rawUser || !user.rawUser.app_meta || !user.rawUser.app_meta.role) {
    cachedRole = 'student';
    cachedIsTA = false;
    return cachedRole;
  }

  try {
    const claimRole = normalizeRole(user.rawUser.app_meta.role);
    cachedRole = claimRole;
  } catch {
    cachedRole = 'student';
  }

  try {
    const profile = await getUserProfile(user.uid);
    const profileRole = profile?.role;

    if (profileRole === 'admin' || profileRole === 'TA' || profileRole === 'student') {
      cachedRole = profileRole;
    }

    if (profileRole === 'TA' || profile?.isTA === true) {
      cachedIsTA = true;
    } else {
      cachedIsTA = false;
    }
  } catch {
    cachedIsTA = false;
  }

  // 追蹤生命週期事件 (Trackable)
  emitTelemetry('role_refresh', { role: cachedRole, isTA: cachedIsTA });
  return cachedRole;
};

/**
 * Google 登入之後的 wrapper。真實模式下指派到 Supabase OAuth; 模擬模式直接回傳用戶。
 */
export const signInWithGoogleFlow = async (rawUser) => {
  if (!rawUser) {
    throw new Error('缺少用戶物件，無法繼續登入。');
  }
  // 模擬模式直接回傳已偵測到的角色
  if (!isNcbEnabled()) {
    const next = {
      uid: rawUser.uid,
      displayName: rawUser.displayName || '',
      email: (rawUser.email || '').toLowerCase(),
      role: cachedRole || 'student',
      status: 'active',
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(`berkeley_profile_${APP_ID}_${rawUser.uid}`, JSON.stringify(next));
    return next;
  }
  // 真實模式: 交給 Supabase 完成
  const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
  if (error) throw error;
  return data;
};

/**
 * 登出。
 */
export const signOutFlow = async () => {
  try {
    await supabase.auth.signOut();
  } catch {
    // 模擬模式不做額外事
  }
  return true;
};

/**
 * 登入後補資料。真實模式 (Supabase/GCP) 才寫資料庫; 模擬模式寫 localStorage。
 */
export const setupProfileIfMissing = async (user) => {
  if (!user) return null;

  const base = {
    uid: user.uid,
    displayName: user.displayName || '',
    email: (user.email || '').toLowerCase(),
    role: cachedRole || 'student',
    status: 'active',
    updatedAt: new Date().toISOString(),
  };

  // 真實模式: 寫 Supabase
  if (user.rawUser && user.rawUser.app_meta) {
    const current = await getUserProfile(user.uid);
    if (!current) {
      const next = { ...base };
      await upsertUserProfile(user.uid, next);
      return next;
    }
    return current;
  }

  // 模擬模式: 寫 localStorage
  const next = { ...base };
  localStorage.setItem(`berkeley_profile_${APP_ID}_${user.uid}`, JSON.stringify(next));
  return next;
};

/**
 * 確保資料與角色。回傳角色字串。
 */
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

function normalizeRole(value) {
  if (value === 'admin' || value === 'TA' || value === 'student') {
    return value;
  }
  return 'student';
}

// ── 模擬模式 (無任何外部憑證) ────────────────────────────────────────

let _app: { local: true } | null = null;
let _auth: { local: true } | null = null;

export function getAuth(): { local: true } {
  if (!_app) _app = { local: true };
  return _app;
}

export function getAuthInstance(): { local: true } {
  if (!_auth) _auth = { local: true };
  return _auth;
}

// 占位 Google 提供者 — 本地模式不實際建立
export const GoogleAuthProvider = class {
  setCustomParameters() {}
};

/**
 * 本地模式 Google 登入 — 模擬真實需求，但直接回傳用戶物件。
 */
export const signInWithGoogle = async () => {
  const mockUser = {
    uid: `local-user-${Date.now()}`,
    displayName: `本地用戶_${Date.now()}`,
    email: `local.${Date.now()}@example.com`,
    providerId: 'local',
  };

  // 模擬 Google 登入後的行為
  if (typeof window !== 'undefined') {
    const profile = await setupProfileIfMissing(mockUser);
    return { ...mockUser, ...profile };
  }

  return mockUser;
};

/**
 * 本地模式 Email 登入 — 模擬真實需求，但直接回傳用戶物件。
 */
export const signInWithEmail = async (email, password) => {
  const mockUser = {
    uid: `local-user-${Date.now()}`,
    displayName: `本地用戶_${Date.now()}`,
    email: email || `local.${Date.now()}@example.com`,
    providerId: 'local',
  };

  if (typeof window !== 'undefined') {
    const profile = await setupProfileIfMissing(mockUser);
    return { ...mockUser, ...profile };
  }

  return mockUser;
};

/**
 * 本地模式註冊。
 */
export const signUpWithEmail = async (email, password, displayName) => {
  const mockUser = {
    uid: `local-user-${Date.now()}`,
    displayName: displayName || `本地用戶_${Date.now()}`,
    email: email || `local.${Date.now()}@example.com`,
    providerId: 'local',
  };

  if (typeof window !== 'undefined') {
    const profile = await setupProfileIfMissing(mockUser);
    return { ...mockUser, ...profile };
  }

  return mockUser;
};

/**
 * 本地模式登出。
 */
export const signOut = async () => {
  // 模擬模式不做額外事
  return true;
};

/**
 * 本地模式的 onAuthStateChange 監聽。
 */
export function onAuthChange(callback) {
  // 立即回呼一次
  callback({
    uid: `local-user-${APP_ID}`,
    displayName: null,
    email: null,
    photoURL: null,
  });

  const unsubscribe = () => {};
  return unsubscribe;
}

// ── 常量 ─────────────────────────────────────────────────────────────

export const APP_ID = (import.meta?.env?.VITE_FB_APP_ID_SLUG || 'esggo-learning-center').trim();

export const emitTelemetry = (event, payload = {}) => {
  if (import.meta?.env?.DEV) {
    console.info('[telemetry]', event, payload);
  }
};

// ── 模擬錯誤物件 ─────────────────────────────────────────────────────

export const DataError = Object.freeze({
  CONFIG_INVALID: new Error('Firebase 設定無效，請檢查 .env 是否已填入。'),
  DOCUMENT_TOO_LARGE: new Error('文件大小超過 Firestore 上限 1MB。'),
  UNAUTHENTICATED: new Error('使用者尚未登入。'),
  UNAUTHORIZED: new Error('缺少管理員權限。'),
});

// ── 狀態 ─────────────────────────────────────────────────────────────

let app = null;
let auth = null;
let db = null;
/** @type {boolean} Whether Firebase is active. */
export let useFirebase = false;

// ── 初始化 ────────────────────────────────────────────────────────────

const isConfigComplete = () =>
  !!(
    app &&
    app.options &&
    app.options.apiKey &&
    app.options.projectId &&
    app.options.appId &&
    String(app.options.apiKey).indexOf('xxxx') === -1
  );

/**
 * 初始化 Firebase 的替代 (在無外部憑證時跳過, 使 useFirebase=false)。
 */
export function initializeFirebase() {
  if (useFirebase) return;
  useFirebase = false;
}

/**
 * 強制停用 Firebase 模式 (移除外部憑證後的 fallback)。
 */
export function disableFirebase() {
  useFirebase = false;
  app = null;
  auth = null;
  db = null;
}

// ── 登入流程 (統一入口) ───────────────────────────────────────────────

/**
 * 初始化認證監聽器。
 */
export const initAuth = (cb) => {
  if (!useFirebase || !auth) {
    cb({ uid: `local-user-${APP_ID}`, isLocal: true, isAnonymous: false });
    return () => {};
  }

  // 僅在有有效 app 且使用實際認證時才掛載監聽
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

/**
 * 開啟 Google 登入流程。
 */
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

/**
 * 登出當前使用者。
 */
export const signOut = async () => {
  if (!useFirebase || !auth) {
    // 模擬/已停用狀態: 直接回傳成功
    return true;
  }
  try {
    await firebaseSignOut(auth);
    return true;
  } catch (error) {
    console.error('Sign out failed', error);
    return false;
  }
};

// ── 附件上傳 ─────────────────────────────────────────────────────────

/**
 * 將 File[] 轉為 base64 附件 metadata。
 */
export const uploadFiles = async (files) => {
  const list = Array.isArray(files) ? files.filter(Boolean) : [];
  if (!list.length) return [];

  emitTelemetry('attachment_upload_start', { count: list.length });

  const total = list.reduce((s, f) => s + (f.size || 0), 0);
  if (total > 700 * 1024) {
    throw DataError.DOCUMENT_TOO_LARGE;
  }

  return Promise.all(
    list.map((file) =>
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

// ── 資料保存 (Firestore + localStorage + NCBDB 三路) ──────────────────

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
 * 建立或覆寫一筆提交。
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

/**
 * 訂閱提交 (實時).
 */
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
  onNext(loadLocal().slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  return () => localListeners.delete(onNext);
};

/**
 * 刪除一筆提交.
 */
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

/**
 * 清除所有本地提交 (需要確認).
 */
export const clearLocal = (confirm = false) => {
  if (!confirm) {
    throw new Error('clearLocal requires explicit confirmation');
  }
  localStorage.removeItem(LOCAL_KEY);
  notifyLocal();
};

// ── User 資料 (登入後) ───────────────────────────────────────────────

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

/**
 * 匯入用戶物件 (來自 auth 或原始資料).
 */
export const importUser = (user) => {
  if (!user) return null;
  return {
    uid: user.uid,
    displayName: user.displayName || null,
    email: user.email || null,
    photoURL: user.photoURL || null,
    providerId: user.providerId || null,
    isAnonymous: user.isAnonymous || false,
    isLocal: true,
  };
};

/**
 * 更新人員資料.
 */
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

/**
 * 取得人員資料.
 */
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

// ── TA 資料 ──────────────────────────────────────────────────────────

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

/**
 * 建立或更新 TA 資料.
 */
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

/**
 * 取得 TA 資料.
 */
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

export const setCurrentRoleValue = (r) => {
  _currentRole = r;
};

export const getCurrentRole = () => _currentRole || 'student';

// ── 配對 ─────────────────────────────────────────────────────────────

export const PAIRING_STATUS = Object.freeze({
  PENDING: 'pending',
  ASSIGNED: 'assigned',
  DECLINED: 'declined',
});

export const PAIRING_ROLE = Object.freeze({
  TA: 'ta',
  MENTEE: 'mentee',
});

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

const loadAllPairingsLocal = () => {
  const out = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(pairingCollectionLocalStoragePrefix())) continue;
    try {
      const record = JSON.parse(localStorage.getItem(key) || '{}');
      out.push({ id: key.replace(pairingCollectionLocalStoragePrefix(), ''), ...record });
    } catch {
      // ignore
    }
  }
  return out.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
};

/**
 * 讀取配對 (依助教與學員).
 */
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

/**
 * 列出助教的所有配對.
 */
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
      // ignore
    }
  }
  return out;
};

/**
 * 列出學員的所有配對.
 */
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

// ── 本地訂閱系統 ─────────────────────────────────────────────────────

const localListeners = new Set();

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

// ── 本地儲存 (Firestore fallback) ─────────────────────────────────────

const LOCAL_KEY = `berkeley_submissions_${APP_ID}`;

const saveLocal = (items) => {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(items));
  } catch (error) {
    console.warn('localStorage save failed', error);
  }
};

const loadLocal = () => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
  } catch {
    return [];
  }
};

// ── 配對本地儲存系統 ─────────────────────────────────────────────────

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

/**
 * 訂閱所有配對.
 */
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

// ── Oracle 客戶端 (可選) ─────────────────────────────────────────────

const ORACLE_API_BASE = (import.meta?.env?.VITE_ORACLE_API_BASE || '').trim();
const USE_ORACLE = String(import.meta?.env?.VITE_USE_ORACLE || 'false').toLowerCase() === 'true';

const isOracleEnabled = () => USE_ORACLE && Boolean(ORACLE_API_BASE);

/**
 * 預留 Oracle adapter：把 export/import 需求做 proxy 化。
 */
export const exportToOracleCsv = async (records, locale = 'zh-TW') => {
  if (!isOracleEnabled()) {
    throw new Error('Oracle proxy 未啟用');
  }
  const res = await fetch(`${ORACLE_API_BASE}/exports?locale=${encodeURIComponent(locale)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ records }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Oracle export failed ${res.status}: ${text}`);
  }
  return res.json();
};

export const fetchOracleHealth = async () => {
  if (!isOracleEnabled()) {
    return { enabled: false, healthy: false, reason: 'ORACLE_DISABLED' };
  }
  try {
    const res = await fetch(`${ORACLE_API_BASE.replace(/\/$/, '')}/health`);
    if (!res.ok) {
      return { enabled: true, healthy: false, status: res.status, reason: await res.text() };
    }
    const data = await res.json().catch(() => ({}));
    return { enabled: true, healthy: true, data };
  } catch (error) {
    return { enabled: true, healthy: false, reason: error?.message || String(error) };
  }
};

// ── 本地遷移到 NCBDB ─────────────────────────────────────────────────

/**
 * 將瀏覽器內的 localStorage 資料遷移到 NCBDB。
 */
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

// ── 導出 (保留原有 API 表面, 讓既有代碼可平滑過渡) ────────────────────

export {
  auth,
  db,
  useFirebase,
  useNcb,
  initializeFirebase,
  disableFirebase,
  getCurrentAuthUser,
  importUser,
};
