/* eslint-disable @typescript-eslint/no-unused-vars */
import {
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
} from 'firebase/firestore';

import { loadLocal, saveLocal, localListeners, notifyLocal, useFirebase, APP_ID, db, emitTelemetry } from '../db';

const formatTimestamp = (value) => {
  if (!value) return new Date().toISOString();
  if (typeof value.toDate === 'function') return value.toDate().toISOString();
  return value;
};

export const addSubmission = async (submission, attachments, id) => {
  const docId = id || String(Date.now());
  const payload = {
    userId: submission.userId,
    type: submission.type,
    data: {
      ...(submission.data || {}),
      attachments: attachments || [],
    },
    createdAt: serverTimestamp(),
  };

  if (useFirebase && db) {
    await setDoc(doc(db, 'platforms', APP_ID, 'submissions', docId), payload);
  } else {
    const item = { id: docId, ...payload, createdAt: new Date().toISOString() };
    const all = loadLocal();
    all.push(item);
    saveLocal(all);
    notifyLocal();
  }

  return docId;
};

export const subscribeSubmissions = (userId, onData) => {
  if (useFirebase && db) {
    const collectionRef = collection(db, 'platforms', APP_ID, 'submissions');
    const unsubscribe = onSnapshot(
      collectionRef,
      (snapshot) => {
        const items = snapshot.docs.map((document) => {
          const data = document.data();
          const createdAt = formatTimestamp(data.createdAt);
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
        if (error instanceof FirestoreError) emitTelemetry('subscription_error', { code: error.code });
      }
    );
    return unsubscribe;
  }

  const next = (data) => onData(data);
  localListeners.add(next);
  next(
    loadLocal()
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  );
  return () => localListeners.delete(next);
};

export const deleteSubmission = async (id) => {
  if (useFirebase && db) {
    await deleteDoc(doc(db, 'platforms', APP_ID, 'submissions', id));
  } else {
    const all = loadLocal().filter((item) => item.id !== id);
    saveLocal(all);
    notifyLocal();
  }
};
