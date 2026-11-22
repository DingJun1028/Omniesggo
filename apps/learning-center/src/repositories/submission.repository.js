import { loadLocal, saveLocal, localListeners, notifyLocal, useSupabase } from '../db';
import { supaAddSubmission, supaSubscribeSubmissions, supaDeleteSubmission } from '../supabase-db';

export const addSubmission = async (submission, attachments, id) => {
  if (useSupabase) return supaAddSubmission(submission, attachments, id);
  const docId = id || String(Date.now());
  const payload = {
    userId: submission.userId,
    type: submission.type,
    data: {
      ...(submission.data || {}),
      attachments: attachments || [],
    },
    createdAt: new Date().toISOString(),
  };

  const all = loadLocal();
  all.push({ id: docId, ...payload });
  saveLocal(all);
  notifyLocal();

  return docId;
};

export const subscribeSubmissions = (userId, onData) => {
  if (useSupabase) return supaSubscribeSubmissions(onData);

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
  if (useSupabase) return supaDeleteSubmission(id);
  const all = loadLocal().filter((item) => item.id !== id);
  saveLocal(all);
  notifyLocal();
};
