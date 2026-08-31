/* eslint-disable @typescript-eslint/no-unused-vars */
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, getIdTokenResult } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useFirebase, APP_ID, emitTelemetry } from '../db';
import { upsertUserProfile, getUserProfile } from './profile.repository';

let cachedRole = 'student';
let cachedIsTA = false;

export const getCachedRole = () => cachedRole;
export const getCachedIsTA = () => cachedIsTA;

export const refreshRoleFromClaims = async (user) => {
  if (!user || !useFirebase) {
    cachedRole = 'student';
    cachedIsTA = false;
    return cachedRole;
  }

  try {
    const result = await getIdTokenResult(user, true);
    const claimRole = normalizeRole(result?.claims?.role);
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

  emitTelemetry('role_refresh', { role: cachedRole, isTA: cachedIsTA });
  return cachedRole;
};

export const signInWithGoogleFlow = async () => {
  if (!useFirebase) {
    throw new Error('Firebase 尚未連線，無法使用 Google 登入。');
  }
  const auth = getAuth();
  await signInWithPopup(auth, new GoogleAuthProvider());
};

export const signOutFlow = async () => {
  if (!useFirebase) return true;
  const auth = getAuth();
  await firebaseSignOut(auth);
  return true;
};

export const setupProfileIfMissing = async (user) => {
  if (!user) return null;
  if (!useFirebase) {
    const next = { uid: user.uid, displayName: user.displayName || '', email: (user.email || '').toLowerCase(), role: cachedRole || 'student', status: 'active', updatedAt: new Date().toISOString() };
    localStorage.setItem(`berkeley_profile_${APP_ID}_${user.uid}`, JSON.stringify(next));
    return next;
  }
  const current = await getUserProfile(user.uid);
  if (!current) {
    const next = { uid: user.uid, displayName: user.displayName || '', email: (user.email || '').toLowerCase(), role: cachedRole || 'student', status: 'active', updatedAt: new Date().toISOString() };
    await upsertUserProfile(user.uid, next);
    return next;
  }
  return current;
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

function normalizeRole(value) {
  if (value === 'admin' || value === 'TA' || value === 'student') {
    return value;
  }
  return 'student';
}
