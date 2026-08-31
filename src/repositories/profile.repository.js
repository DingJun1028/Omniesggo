/* eslint-disable @typescript-eslint/no-unused-vars */
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db, useFirebase, APP_ID, emitTelemetry } from '../db';

const profileRef = (uid) => doc(db, 'platforms', APP_ID, 'profiles', uid);
const profileLocalStorageKey = (uid) => `berkeley_profile_${APP_ID}_${uid}`;

const defaultProfile = () => ({
  displayName: '',
  email: '',
  role: 'student',
  org: '',
  status: 'active',
  updatedAt: new Date().toISOString(),
});

export const upsertUserProfile = async (uid, updates = {}) => {
  const payload = defaultProfile();
  let current = null;

  if (useFirebase && db) {
    const snap = await getDoc(profileRef(uid));
    if (snap.exists()) current = snap.data();
  } else {
    try { current = JSON.parse(localStorage.getItem(profileLocalStorageKey(uid)) || '{}'); }
    catch { current = {}; }
  }

  const next = { ...current, ...updates, updatedAt: new Date().toISOString() };
  if (useFirebase && db) await setDoc(profileRef(uid), next, { merge: true });
  else localStorage.setItem(profileLocalStorageKey(uid), JSON.stringify(next));

  emitTelemetry('profile_upsert', { uid, role: next.role });
  return next;
};

export const getUserProfile = async (uid) => {
  if (!uid) return null;
  if (useFirebase && db) {
    const snap = await getDoc(profileRef(uid));
    if (snap.exists()) return snap.data();
    return null;
  }

  try { return JSON.parse(localStorage.getItem(profileLocalStorageKey(uid)) || '{}'); }
  catch { return null; }
};

export { profileLocalStorageKey as localKeyFor };
