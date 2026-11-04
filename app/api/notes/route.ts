/**
 * /api/notes — Universal Notes API
 * GET  /api/notes   list notes (newest first, max 100)
 * POST /api/notes   create a note { title, content, tags }
 *
 * Storage: Supabase table `notes` (src/lib/notes-store.ts); local JSON file
 * fallback when Supabase env is not configured.
 */
import { jsonResponse, jsonError } from '@lib/api-utils';
import { listNotes, createNote, type NoteData } from '@/lib/notes-store';

export type { NoteData };

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const result = await listNotes();
  if (!result.ok) {
    return jsonError(result.code, result.message, result.code === 'NOT_FOUND' ? 404 : 500);
  }
  return jsonResponse(result.value);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const title = String(body?.title ?? '').trim();
    const content = String(body?.content ?? '');
    const tags = Array.isArray(body?.tags)
      ? body.tags.map((t: unknown) => String(t).trim()).filter(Boolean)
      : [];

    if (!title) {
      return jsonError('INVALID_PARAMS', 'title is required', 400);
    }

    const result = await createNote({ title, content, tags });
    if (!result.ok) {
      return jsonError(result.code, result.message, result.code === 'NOT_FOUND' ? 404 : 500);
    }
    return jsonResponse({ note: result.value }, 201);
  } catch (err) {
    console.error('[API] /api/notes POST error:', err);
    return jsonError('INTERNAL_ERROR', 'Failed to create note', 500);
  }
}
