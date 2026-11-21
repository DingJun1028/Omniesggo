import { useSupabase, APP_ID, emitTelemetry } from '../db';
import {
  supaSetPairing,
  supaUpdatePairing,
  supaDeletePairing,
  supaLoadPairing,
  supaListPairingsForMentor,
  supaListPairingsForMentee,
  supaSubscribePairings,
} from '../supabase-db';

const PAIRING_STATUS = Object.freeze({ PENDING: 'pending', ASSIGNED: 'assigned', DECLINED: 'declined' });

const pairingDocId = (mentorUid, menteeUid) => `${mentorUid}__${menteeUid}`;
const collectionLocalStoragePrefix = () => `berkeley_pairing_${APP_ID}_`;
const storeKeyFor = (id) => `${collectionLocalStoragePrefix()}${id}`;

const newPairingPayload = (mentorUid, menteeUid, status = PAIRING_STATUS.PENDING) => ({
  mentorUid,
  menteeUid,
  status,
  note: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export const createPairingRequest = async (mentorUid, menteeUid) => {
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

export const removePairing = async (mentorUid, menteeUid) => {
  const docId = pairingDocId(mentorUid, menteeUid);
  if (useSupabase) {
    await supaDeletePairing(docId);
    return docId;
  }
  localStorage.removeItem(storeKeyFor(docId));
  emitPairingLocalEvent();
  return docId;
};

export const loadPairing = async (mentorUid, menteeUid) => {
  const docId = pairingDocId(mentorUid, menteeUid);
  if (useSupabase) return supaLoadPairing(docId);

  try { const raw = localStorage.getItem(storeKeyFor(docId)); return raw ? JSON.parse(raw) : null; }
  catch { return null; }
};

export const listPairingsForMentor = async (mentorUid) => {
  if (useSupabase) return supaListPairingsForMentor(mentorUid);

  const out = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(collectionLocalStoragePrefix())) continue;
    try {
      const record = JSON.parse(localStorage.getItem(key) || '{}');
      if (record?.mentorUid === mentorUid) out.push({ id: key.replace(collectionLocalStoragePrefix(), ''), ...record });
    } catch { /* ignore */ }
  }
  return out;
};

export const listPairingsForMentee = async (menteeUid) => {
  if (useSupabase) return supaListPairingsForMentee(menteeUid);

  const out = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(collectionLocalStoragePrefix())) continue;
    try {
      const record = JSON.parse(localStorage.getItem(key) || '{}');
      if (record?.menteeUid === menteeUid) out.push({ id: key.replace(collectionLocalStoragePrefix(), ''), ...record });
    } catch { /* ignore */ }
  }
  return out;
};

export const subscribePairings = (onData) => {
  if (useSupabase) return supaSubscribePairings(onData);

  const listeners = window.__pairingLocalListeners || (window.__pairingLocalListeners = new Set());
  const next = () => {
    const out = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(collectionLocalStoragePrefix())) continue;
      try { out.push({ id: key.replace(collectionLocalStoragePrefix(), ''), ...JSON.parse(localStorage.getItem(key) || '{}') }); }
      catch { /* ignore */ }
    }
    onData(out);
  };
  const cleanup = () => { listeners.delete(next); };
  listeners.add(next);
  next();
  return cleanup;
};

const setPairing = async (id, payload) => {
  localStorage.setItem(storeKeyFor(id), JSON.stringify(payload));
  emitPairingLocalEvent();
};

const updatePairing = async (id, patch) => {
  const current = JSON.parse(localStorage.getItem(storeKeyFor(id)) || '{}');
  const next = { ...current, ...patch };
  localStorage.setItem(storeKeyFor(id), JSON.stringify(next));
  emitPairingLocalEvent();
};

const pairingLocalListeners = window.__pairingLocalListeners || (window.__pairingLocalListeners = new Set());

const emitPairingLocalEvent = () => {
  const out = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(collectionLocalStoragePrefix())) continue;
    try { out.push({ id: key.replace(collectionLocalStoragePrefix(), ''), ...JSON.parse(localStorage.getItem(key) || '{}') }); }
    catch { /* ignore */ }
  }
  for (const cb of [...pairingLocalListeners]) {
    try { cb(out); } catch { pairingLocalListeners.delete(cb); }
  }
};

export { PAIRING_STATUS };
