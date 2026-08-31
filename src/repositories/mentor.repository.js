/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  doc,
  setDoc,
  getDoc,
} from 'firebase/firestore';

import { db, useFirebase, APP_ID, emitTelemetry } from '../db';

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

export const upsertTAProfile = async (uid, updates = {}) => {
  const payload = defaultTA();
  let current = null;

  if (useFirebase && db) {
    const snap = await getDoc(taRef(uid));
    if (snap.exists()) current = snap.data();
  } else {
    try { current = JSON.parse(localStorage.getItem(taLocalStorageKey(uid)) || '{}'); }
    catch { current = {}; }
  }

  const next = { ...current, ...updates, updatedAt: new Date().toISOString() };
  if (useFirebase && db) await setDoc(taRef(uid), next, { merge: true });
  else localStorage.setItem(taLocalStorageKey(uid), JSON.stringify(next));

  emitTelemetry('ta_upsert', { uid, isTA: next.isTA });
  return next;
};

export const getTAProfile = async (uid) => {
  if (!uid) return null;
  if (useFirebase && db) {
    const snap = await getDoc(taRef(uid));
    if (snap.exists()) return snap.data();
    return null;
  }

  try { return JSON.parse(localStorage.getItem(taLocalStorageKey(uid)) || '{}'); }
  catch { return null; }
};
