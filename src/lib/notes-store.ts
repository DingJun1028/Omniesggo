/**
 * Universal Notes store — Supabase free-tier (Postgres + RLS + Storage),
 * with a local JSON file fallback when Supabase env is absent (local dev).
 *
 * Server env: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (anon as fallback),
 * secondary line SUPABASE_OMNI_URL + SUPABASE_OMNI_SERVICE_ROLE_KEY.
 * Browser env: NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY.
 *
 * Schema: db/migrations/20261104120000_universal_notes.sql
 *   - public.notes (RLS: auth.uid() = user_id) + realtime publication
 *   - public.note_attachments (RLS) — metadata for files in bucket note-attachments
 *   - storage bucket note-attachments (public read, owner write)
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';

export interface NoteData {
  id: string;
  title: string;
  content: string;
  tags: string[];
  fiveTGate?: string;
  userId?: string;
  createdAt: number;
  updatedAt?: number;
}

export interface AttachmentData {
  id: string;
  noteId: string;
  userId: string;
  name: string;
  path: string;
  size: number;
  type: string;
  url: string;
  createdAt: number;
}

export type NoteInput = Pick<NoteData, 'title' | 'content' | 'tags'>;
export type NotePatch = Partial<Pick<NoteData, 'title' | 'content' | 'tags' | 'fiveTGate'>>;
export type AttachmentInput = Pick<AttachmentData, 'noteId' | 'name' | 'path' | 'size' | 'type' | 'url'>;

export type StoreResult<T> =
  | { ok: true; value: T }
  | { ok: false; code: 'NOT_FOUND' | 'INTERNAL_ERROR' | 'UNAUTHORIZED'; message: string };

export const NOTES_TABLE = 'notes';
export const ATTACHMENTS_TABLE = 'note_attachments';
export const ATTACHMENTS_BUCKET = 'note-attachments';

export const LIMITS = {
  titleMax: 200,
  contentMax: 200_000,
  tagsMax: 20,
  tagMax: 50,
  attachmentNameMax: 255,
  attachmentSizeMax: 10 * 1024 * 1024,
  listMax: 100,
} as const;

export function validateNoteFields(input: {
  title?: unknown;
  content?: unknown;
  tags?: unknown;
}): string | null {
  if (input.title !== undefined) {
    const title = String(input.title);
    if (!title.trim()) return 'title must not be empty';
    if (title.length > LIMITS.titleMax) return `title exceeds ${LIMITS.titleMax} chars`;
  }
  if (input.content !== undefined && String(input.content).length > LIMITS.contentMax) {
    return `content exceeds ${LIMITS.contentMax} chars`;
  }
  if (input.tags !== undefined) {
    const tags = Array.isArray(input.tags) ? input.tags : [];
    if (tags.length > LIMITS.tagsMax) return `at most ${LIMITS.tagsMax} tags allowed`;
    for (const t of tags) {
      if (String(t).length > LIMITS.tagMax) return `tag exceeds ${LIMITS.tagMax} chars`;
    }
  }
  return null;
}

export function validateAttachmentFields(input: {
  name?: unknown;
  path?: unknown;
  size?: unknown;
}): string | null {
  const name = String(input.name ?? '');
  const storagePath = String(input.path ?? '');
  if (!name.trim()) return 'name is required';
  if (!storagePath.trim()) return 'path is required';
  if (name.length > LIMITS.attachmentNameMax) return `name exceeds ${LIMITS.attachmentNameMax} chars`;
  const size = Number(input.size ?? 0);
  if (!Number.isFinite(size) || size < 0) return 'size must be a non-negative number';
  if (size > LIMITS.attachmentSizeMax) {
    return `attachment exceeds ${LIMITS.attachmentSizeMax / 1024 / 1024} MB`;
  }
  return null;
}

function notesFilePath(): string {
  return process.env.NOTES_FILE || path.join(process.cwd(), 'data', 'notes.json');
}

export interface SupabaseEnv {
  url: string;
  anonKey: string;
  serviceKey: string;
}

export function getSupabaseEnv(): SupabaseEnv | null {
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_OMNI_URL ||
    '';
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_OMNI_SERVICE_ROLE_KEY ||
    '';
  const anonKey =
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    '';
  if (!url || !serviceKey) return null;
  return { url, anonKey: anonKey || serviceKey, serviceKey };
}

/** Per-request client scoped to the caller's access token — RLS applies. */
export function userClientForToken(env: SupabaseEnv, accessToken: string): SupabaseClient {
  return createClient(env.url, env.anonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

/** Service-role client (bypasses RLS) — server/admin use only. */
export function serviceClient(env: SupabaseEnv): SupabaseClient {
  return createClient(env.url, env.serviceKey, { auth: { persistSession: false } });
}

/**
 * Resolve the store client for an incoming API request.
 * Supabase configured + Bearer token -> per-user client (RLS enforced);
 * Supabase configured without token -> UNAUTHORIZED; no Supabase env -> null
 * (local JSON file fallback).
 */
export async function resolveRequestClient(
  req: Request
): Promise<
  | { sb: SupabaseClient | null; userId?: string }
  | { error: { code: 'UNAUTHORIZED'; message: string } }
> {
  const env = getSupabaseEnv();
  if (!env) return { sb: null };
  const header = req.headers.get('authorization') || '';
  const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
  if (!token) {
    return { error: { code: 'UNAUTHORIZED', message: 'Missing Bearer access token' } };
  }
  const client = userClientForToken(env, token);
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) {
    return { error: { code: 'UNAUTHORIZED', message: 'Invalid or expired access token' } };
  }
  return { sb: client, userId: data.user.id };
}

interface NotesFileStore {
  notes: NoteData[];
  attachments: AttachmentData[];
}

let fileQueue: Promise<void> = Promise.resolve();

function loadFileStore(): NotesFileStore {
  const file = notesFilePath();
  const dir = path.dirname(file);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify({ notes: [], attachments: [] }, null, 2));
  }
  const parsed = JSON.parse(fs.readFileSync(file, 'utf-8')) as Partial<NotesFileStore>;
  return { notes: parsed.notes ?? [], attachments: parsed.attachments ?? [] };
}

function saveFileStore(store: NotesFileStore): Promise<void> {
  const file = notesFilePath();
  const run = fileQueue.then(() => {
    fs.writeFileSync(file, JSON.stringify(store, null, 2));
  });
  fileQueue = run.catch(() => undefined);
  return run;
}

function normalizeTags(tags: unknown): string[] {
  return Array.isArray(tags)
    ? tags.map((t) => String(t).trim()).filter(Boolean)
    : [];
}

function rowToNote(row: Record<string, unknown>): NoteData {
  return {
    id: String(row.id),
    title: String(row.title ?? ''),
    content: String(row.content ?? ''),
    tags: normalizeTags(row.tags),
    fiveTGate: row.fiveTGate != null ? String(row.fiveTGate) : undefined,
    userId: row.user_id != null ? String(row.user_id) : undefined,
    createdAt: Number(row.createdAt ?? 0),
    updatedAt: row.updatedAt != null ? Number(row.updatedAt) : undefined,
  };
}

function rowToAttachment(row: Record<string, unknown>): AttachmentData {
  return {
    id: String(row.id),
    noteId: String(row.note_id ?? row.noteId ?? ''),
    userId: String(row.user_id ?? row.userId ?? ''),
    name: String(row.name ?? ''),
    path: String(row.path ?? ''),
    size: Number(row.size ?? 0),
    type: String(row.type ?? ''),
    url: String(row.url ?? ''),
    createdAt: Number(row.createdAt ?? 0),
  };
}

export async function listNotes(sb: SupabaseClient | null): Promise<StoreResult<{ notes: NoteData[]; total: number }>> {
  if (sb) {
    try {
      const { data, error, count } = await sb
        .from(NOTES_TABLE)
        .select('*', { count: 'exact' })
        .order('createdAt', { ascending: false })
        .limit(100);
      if (error) throw error;
      return { ok: true, value: { notes: (data ?? []).map(rowToNote), total: count ?? (data ?? []).length } };
    } catch (err) {
      return { ok: false, code: 'INTERNAL_ERROR', message: (err as Error).message };
    }
  }
  try {
    const store = loadFileStore();
    const notes = [...store.notes].sort((a, b) => b.createdAt - a.createdAt).slice(0, 100);
    return { ok: true, value: { notes, total: store.notes.length } };
  } catch (err) {
    return { ok: false, code: 'INTERNAL_ERROR', message: (err as Error).message };
  }
}

export async function createNote(
  sb: SupabaseClient | null,
  userId: string | undefined,
  input: NoteInput
): Promise<StoreResult<NoteData>> {
  const now = Date.now();
  const note: NoteData = {
    id: `note_${now}_${randomUUID().slice(0, 8)}`,
    title: input.title,
    content: input.content,
    tags: input.tags,
    userId,
    createdAt: now,
    updatedAt: now,
  };

  if (sb) {
    try {
      const { data, error } = await sb
        .from(NOTES_TABLE)
        .insert({
          id: note.id,
          user_id: userId,
          title: note.title,
          content: note.content,
          tags: note.tags,
          createdAt: note.createdAt,
          updatedAt: note.updatedAt,
        })
        .select()
        .single();
      if (error) throw error;
      return { ok: true, value: rowToNote(data as unknown as Record<string, unknown>) };
    } catch (err) {
      return { ok: false, code: 'INTERNAL_ERROR', message: (err as Error).message };
    }
  }

  try {
    const store = loadFileStore();
    store.notes.push(note);
    await saveFileStore(store);
    return { ok: true, value: note };
  } catch (err) {
    return { ok: false, code: 'INTERNAL_ERROR', message: (err as Error).message };
  }
}

export async function updateNote(
  sb: SupabaseClient | null,
  id: string,
  patch: NotePatch
): Promise<StoreResult<NoteData>> {
  if (sb) {
    try {
      const existing = await sb.from(NOTES_TABLE).select('*').eq('id', id).maybeSingle();
      if (existing.error) throw existing.error;
      if (!existing.data) return { ok: false, code: 'NOT_FOUND', message: 'Note not found' };

      const update: Record<string, unknown> = { updatedAt: Date.now() };
      if (patch.title !== undefined) update.title = patch.title;
      if (patch.content !== undefined) update.content = patch.content;
      if (patch.tags !== undefined) update.tags = patch.tags;
      if (patch.fiveTGate !== undefined) update.fiveTGate = patch.fiveTGate;

      const { data, error } = await sb
        .from(NOTES_TABLE)
        .update(update)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return { ok: true, value: rowToNote(data as unknown as Record<string, unknown>) };
    } catch (err) {
      return { ok: false, code: 'INTERNAL_ERROR', message: (err as Error).message };
    }
  }

  try {
    const store = loadFileStore();
    const index = store.notes.findIndex((n) => n.id === id);
    if (index === -1) return { ok: false, code: 'NOT_FOUND', message: 'Note not found' };
    const updated: NoteData = { ...store.notes[index], ...patch, updatedAt: Date.now() };
    store.notes[index] = updated;
    await saveFileStore(store);
    return { ok: true, value: updated };
  } catch (err) {
    return { ok: false, code: 'INTERNAL_ERROR', message: (err as Error).message };
  }
}

export async function deleteNote(
  sb: SupabaseClient | null,
  id: string
): Promise<StoreResult<{ deleted: string }>> {
  if (sb) {
    try {
      const existing = await sb.from(NOTES_TABLE).select('id').eq('id', id).maybeSingle();
      if (existing.error) throw existing.error;
      if (!existing.data) return { ok: false, code: 'NOT_FOUND', message: 'Note not found' };
      const atts = await sb.from(ATTACHMENTS_TABLE).select('path').eq('note_id', id);
      if (atts.error) throw atts.error;
      const paths = (atts.data ?? [])
        .map((r: Record<string, unknown>) => String(r.path))
        .filter(Boolean);
      if (paths.length > 0) {
        await sb.storage.from(ATTACHMENTS_BUCKET).remove(paths);
      }
      const { error } = await sb.from(NOTES_TABLE).delete().eq('id', id);
      if (error) throw error;
      return { ok: true, value: { deleted: id } };
    } catch (err) {
      return { ok: false, code: 'INTERNAL_ERROR', message: (err as Error).message };
    }
  }

  try {
    const store = loadFileStore();
    const index = store.notes.findIndex((n) => n.id === id);
    if (index === -1) return { ok: false, code: 'NOT_FOUND', message: 'Note not found' };
    store.notes.splice(index, 1);
    store.attachments = store.attachments.filter((a) => a.noteId !== id);
    await saveFileStore(store);
    return { ok: true, value: { deleted: id } };
  } catch (err) {
    return { ok: false, code: 'INTERNAL_ERROR', message: (err as Error).message };
  }
}

export async function listAttachments(
  sb: SupabaseClient | null,
  noteId: string
): Promise<StoreResult<AttachmentData[]>> {
  if (sb) {
    try {
      const { data, error } = await sb
        .from(ATTACHMENTS_TABLE)
        .select('*')
        .eq('note_id', noteId)
        .order('createdAt', { ascending: true });
      if (error) throw error;
      return { ok: true, value: (data ?? []).map(rowToAttachment) };
    } catch (err) {
      return { ok: false, code: 'INTERNAL_ERROR', message: (err as Error).message };
    }
  }
  try {
    const store = loadFileStore();
    return { ok: true, value: store.attachments.filter((a) => a.noteId === noteId) };
  } catch (err) {
    return { ok: false, code: 'INTERNAL_ERROR', message: (err as Error).message };
  }
}

export async function addAttachment(
  sb: SupabaseClient | null,
  userId: string | undefined,
  input: AttachmentInput
): Promise<StoreResult<AttachmentData>> {
  const attachment: AttachmentData = {
    id: `att_${Date.now()}_${randomUUID().slice(0, 8)}`,
    noteId: input.noteId,
    userId: userId ?? '',
    name: input.name,
    path: input.path,
    size: input.size,
    type: input.type,
    url: input.url,
    createdAt: Date.now(),
  };

  if (sb) {
    try {
      const { data, error } = await sb
        .from(ATTACHMENTS_TABLE)
        .insert({
          id: attachment.id,
          note_id: attachment.noteId,
          user_id: attachment.userId,
          name: attachment.name,
          path: attachment.path,
          size: attachment.size,
          type: attachment.type,
          url: attachment.url,
          createdAt: attachment.createdAt,
        })
        .select()
        .single();
      if (error) throw error;
      return { ok: true, value: rowToAttachment(data as unknown as Record<string, unknown>) };
    } catch (err) {
      return { ok: false, code: 'INTERNAL_ERROR', message: (err as Error).message };
    }
  }

  try {
    const store = loadFileStore();
    store.attachments.push(attachment);
    await saveFileStore(store);
    return { ok: true, value: attachment };
  } catch (err) {
    return { ok: false, code: 'INTERNAL_ERROR', message: (err as Error).message };
  }
}

export async function removeAttachment(
  sb: SupabaseClient | null,
  id: string
): Promise<StoreResult<{ deleted: string }>> {
  if (sb) {
    try {
      const existing = await sb.from(ATTACHMENTS_TABLE).select('*').eq('id', id).maybeSingle();
      if (existing.error) throw existing.error;
      if (!existing.data) return { ok: false, code: 'NOT_FOUND', message: 'Attachment not found' };
      const att = rowToAttachment(existing.data as unknown as Record<string, unknown>);
      const { error: delErr } = await sb.from(ATTACHMENTS_TABLE).delete().eq('id', id);
      if (delErr) throw delErr;
      await sb.storage.from(ATTACHMENTS_BUCKET).remove([att.path]);
      return { ok: true, value: { deleted: id } };
    } catch (err) {
      return { ok: false, code: 'INTERNAL_ERROR', message: (err as Error).message };
    }
  }

  try {
    const store = loadFileStore();
    const index = store.attachments.findIndex((a) => a.id === id);
    if (index === -1) return { ok: false, code: 'NOT_FOUND', message: 'Attachment not found' };
    store.attachments.splice(index, 1);
    await saveFileStore(store);
    return { ok: true, value: { deleted: id } };
  } catch (err) {
    return { ok: false, code: 'INTERNAL_ERROR', message: (err as Error).message };
  }
}
