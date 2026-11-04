/**
 * Universal Notes store.
 *
 * Primary: Supabase table `notes` via @supabase/supabase-js (server-side env:
 * SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY, anon as fallback; secondary line
 * SUPABASE_OMNI_URL + SUPABASE_OMNI_SERVICE_ROLE_KEY).
 * Fallback: local JSON file data/notes.json when Supabase env is absent
 * (keeps local dev / tests working; same pattern as app/api/memory).
 *
 * Table shape (SQL):
 *   create table if not exists notes (
 *     id text primary key,
 *     title text not null,
 *     content text not null default '',
 *     tags jsonb not null default '[]'::jsonb,
 *     "fiveTGate" text,
 *     "createdAt" bigint not null,
 *     "updatedAt" bigint
 *   );
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
  createdAt: number;
  updatedAt?: number;
}

export type NoteInput = Pick<NoteData, 'title' | 'content' | 'tags'>;
export type NotePatch = Partial<Pick<NoteData, 'title' | 'content' | 'tags' | 'fiveTGate'>>;

export type StoreResult<T> =
  | { ok: true; value: T }
  | { ok: false; code: 'NOT_FOUND' | 'INTERNAL_ERROR'; message: string };

const NOTES_TABLE = 'notes';
const NOTES_FILE = path.join(process.cwd(), 'data', 'notes.json');

interface NotesFileStore {
  notes: NoteData[];
}

let cachedClient: SupabaseClient | null = null;

function getSupabase(): SupabaseClient | null {
  if (cachedClient) return cachedClient;
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_OMNI_URL ||
    '';
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_OMNI_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    '';
  if (!url || !key) return null;
  cachedClient = createClient(url, key, { auth: { persistSession: false } });
  return cachedClient;
}

let fileQueue: Promise<void> = Promise.resolve();

function loadFileStore(): NotesFileStore {
  const dir = path.dirname(NOTES_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(NOTES_FILE)) {
    fs.writeFileSync(NOTES_FILE, JSON.stringify({ notes: [] }, null, 2));
  }
  return JSON.parse(fs.readFileSync(NOTES_FILE, 'utf-8')) as NotesFileStore;
}

function saveFileStore(store: NotesFileStore): Promise<void> {
  const run = fileQueue.then(() => {
    fs.writeFileSync(NOTES_FILE, JSON.stringify(store, null, 2));
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
    createdAt: Number(row.createdAt ?? 0),
    updatedAt: row.updatedAt != null ? Number(row.updatedAt) : undefined,
  };
}

export async function listNotes(): Promise<StoreResult<{ notes: NoteData[]; total: number }>> {
  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error, count } = await sb
        .from(NOTES_TABLE)
        .select('*', { count: 'exact' })
        .order('createdAt', { ascending: false })
        .limit(100);
      if (error) throw error;
      return {
        ok: true,
        value: { notes: (data ?? []).map(rowToNote), total: count ?? (data ?? []).length },
      };
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

export async function createNote(input: NoteInput): Promise<StoreResult<NoteData>> {
  const now = Date.now();
  const note: NoteData = {
    id: `note_${now}_${randomUUID().slice(0, 8)}`,
    title: input.title,
    content: input.content,
    tags: input.tags,
    createdAt: now,
    updatedAt: now,
  };

  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb
        .from(NOTES_TABLE)
        .insert({
          id: note.id,
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

export async function updateNote(id: string, patch: NotePatch): Promise<StoreResult<NoteData>> {
  const sb = getSupabase();
  if (sb) {
    try {
      const existing = await sb.from(NOTES_TABLE).select('*').eq('id', id).maybeSingle();
      if (existing.error) throw existing.error;
      if (!existing.data) return { ok: false, code: 'NOT_FOUND', message: 'Note not found' };

      const row: Record<string, unknown> = { ...existing.data, updatedAt: Date.now() };
      if (patch.title !== undefined) row.title = patch.title;
      if (patch.content !== undefined) row.content = patch.content;
      if (patch.tags !== undefined) row.tags = patch.tags;
      if (patch.fiveTGate !== undefined) row.fiveTGate = patch.fiveTGate;

      const { data, error } = await sb
        .from(NOTES_TABLE)
        .update({
          title: row.title,
          content: row.content,
          tags: row.tags,
          ...(row.fiveTGate !== undefined ? { fiveTGate: row.fiveTGate } : {}),
          updatedAt: row.updatedAt,
        })
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

export async function deleteNote(id: string): Promise<StoreResult<{ deleted: string }>> {
  const sb = getSupabase();
  if (sb) {
    try {
      const existing = await sb.from(NOTES_TABLE).select('id').eq('id', id).maybeSingle();
      if (existing.error) throw existing.error;
      if (!existing.data) return { ok: false, code: 'NOT_FOUND', message: 'Note not found' };

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
    await saveFileStore(store);
    return { ok: true, value: { deleted: id } };
  } catch (err) {
    return { ok: false, code: 'INTERNAL_ERROR', message: (err as Error).message };
  }
}
