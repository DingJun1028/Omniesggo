/**
 * Universal Notes API tests (/api/notes)
 *
 * Uses the local JSON file fallback: tests/setup.ts sets only the
 * NEXT_PUBLIC_* dummies, so getSupabaseEnv() returns null (no service key)
 * and the store falls back to NOTES_FILE (a temp file set in beforeAll).
 *
 * Covers: create/list/update/delete + attachments CRUD + validation
 * (400s) + 404s + 401 when Supabase env is configured but no Bearer token.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';

let tmpFile: string;
let routes: any;
let noteId = '';
let attId = '';

async function load() {
  if (!routes) {
    routes = {
      notes: await import('../app/api/notes/route'),
      note: await import('../app/api/notes/[id]/route'),
      att: await import('../app/api/notes/[id]/attachments/route'),
    };
  }
  return routes;
}

function req(url: string, init?: RequestInit): Request {
  return new Request(`http://localhost${url}`, init);
}

function jsonPost(url: string, body: unknown): Request {
  return req(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

beforeAll(() => {
  tmpFile = path.join(os.tmpdir(), `notes-test-${process.pid}-${Date.now()}.json`);
  process.env.NOTES_FILE = tmpFile;
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.SUPABASE_OMNI_URL;
  delete process.env.SUPABASE_OMNI_SERVICE_ROLE_KEY;
});

afterAll(() => {
  delete process.env.NOTES_FILE;
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  try { fs.unlinkSync(tmpFile); } catch {}
});

describe('POST /api/notes validation', () => {
  it('rejects missing title with 400', async () => {
    const { notes: r } = await load();
    const res = await r.POST(jsonPost('/api/notes', { content: 'x' }));
    expect(res.status).toBe(400);
  });

  it('rejects oversize title with 400', async () => {
    const { notes: r } = await load();
    const res = await r.POST(jsonPost('/api/notes', { title: 't'.repeat(201) }));
    expect(res.status).toBe(400);
  });

  it('rejects too many tags with 400', async () => {
    const { notes: r } = await load();
    const res = await r.POST(jsonPost('/api/notes', { title: 'ok', tags: Array(21).fill('a') }));
    expect(res.status).toBe(400);
  });
});

describe('notes CRUD (file fallback)', () => {
  it('creates a note (201) and lists it', async () => {
    const { notes: r } = await load();
    const res = await r.POST(jsonPost('/api/notes', { title: 'Hello', content: '# hi', tags: ['a', 'b'] }));
    expect(res.status).toBe(201);
    const j: any = await res.json();
    expect(j.data.note.title).toBe('Hello');
    expect(j.data.note.tags).toEqual(['a', 'b']);
    noteId = j.data.note.id;

    const list = await r.GET(req('/api/notes'));
    const lj: any = await list.json();
    expect(lj.data.total).toBe(1);
    expect(lj.data.notes[0].id).toBe(noteId);
  });

  it('updates a note (200), 404 on missing, 400 on empty title', async () => {
    const { note: r } = await load();
    const ok = await r.PUT(jsonPost(`/api/notes/${noteId}`, { title: 'Hello2', tags: ['c'] }), ctx(noteId) as any);
    expect(ok.status).toBe(200);
    const oj: any = await ok.json();
    expect(oj.data.note.title).toBe('Hello2');

    const missing = await r.PUT(jsonPost('/api/notes/nope', { title: 'x' }), ctx('nope') as any);
    expect(missing.status).toBe(404);

    const empty = await r.PUT(jsonPost(`/api/notes/${noteId}`, { title: '   ' }), ctx(noteId) as any);
    expect(empty.status).toBe(400);
  });

  it('attachments: register (201), oversize rejected (400), list, delete (200), re-delete (404)', async () => {
    const { att: r } = await load();
    const created = await r.POST(
      jsonPost(`/api/notes/${noteId}/attachments`, { name: 'f.txt', path: `u/${noteId}/f.txt`, size: 3, type: 'text/plain', url: 'http://x/f.txt' }),
      ctx(noteId) as any
    );
    expect(created.status).toBe(201);
    const cj: any = await created.json();
    attId = cj.data.attachment.id;

    const big = await r.POST(
      jsonPost(`/api/notes/${noteId}/attachments`, { name: 'big.bin', path: `u/${noteId}/big.bin`, size: 11 * 1024 * 1024 }),
      ctx(noteId) as any
    );
    expect(big.status).toBe(400);

    const list = await r.GET(req(`/api/notes/${noteId}/attachments`), ctx(noteId) as any);
    const lj: any = await list.json();
    expect(lj.data.attachments.length).toBe(1);

    const del = await r.DELETE(req(`/api/notes/${noteId}/attachments?id=${attId}`, { method: 'DELETE' }));
    expect(del.status).toBe(200);
    const delAgain = await r.DELETE(req(`/api/notes/${noteId}/attachments?id=${attId}`, { method: 'DELETE' }));
    expect(delAgain.status).toBe(404);
  });

  it('deletes the note (200), then list is empty, re-delete is 404', async () => {
    const { notes: r, note: r2 } = await load();
    const del = await r2.DELETE(req(`/api/notes/${noteId}`, { method: 'DELETE' }), ctx(noteId) as any);
    expect(del.status).toBe(200);

    const list = await r.GET(req('/api/notes'));
    const lj: any = await list.json();
    expect(lj.data.total).toBe(0);

    const delAgain = await r2.DELETE(req(`/api/notes/${noteId}`, { method: 'DELETE' }), ctx(noteId) as any);
    expect(delAgain.status).toBe(404);
  });
});

describe('auth gate when Supabase is configured', () => {
  it('returns 401 without a Bearer token', async () => {
    process.env.SUPABASE_URL = 'https://dummy.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'dummy-service-key';
    try {
      const { notes: r } = await load();
      const res = await r.GET(req('/api/notes'));
      expect(res.status).toBe(401);
    } finally {
      delete process.env.SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    }
  });
});
