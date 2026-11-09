/**
 * /api/notes — Universal Notes API
 * GET  /api/notes   list notes (newest first, max 100) — requires Bearer token when Supabase is configured
 * POST /api/notes   create a note { title, content, tags }
 *
 * Storage: Supabase table `notes` with RLS (src/lib/notes-store.ts, per-user
 * client from the Bearer token); local JSON file fallback when Supabase env
 * is absent.
 */
import { jsonResponse, jsonError } from '@lib/api-utils';
import { rateLimit } from '@lib/rate-limit';
import {
  listNotes,
  createNote,
  resolveRequestClient,
  validateNoteFields,
  type NoteData,
} from '@/lib/notes-store';

async function throttleWrite(req: Request, userId?: string): Promise<boolean> {
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'anon';
  const rl = await rateLimit(`notes-write:${userId ?? ip}`, 60, 60);
  return rl.success;
}



export type { NoteData };

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  const resolved = await resolveRequestClient(req);
  if ('error' in resolved) {
    return jsonError(resolved.error.code, resolved.error.message, 401);
  }
  const result = await listNotes(resolved.sb);
  if (!result.ok) {
    return jsonError(result.code, result.message, result.code === 'NOT_FOUND' ? 404 : 500);
  }
  return jsonResponse(result.value);
}

export async function POST(req: Request) {
  try {
    const resolved = await resolveRequestClient(req);
    if ('error' in resolved) {
      return jsonError(resolved.error.code, resolved.error.message, 401);
    }
    if (!(await throttleWrite(req, resolved.userId))) {
      return jsonError('RATE_LIMITED', '寫入頻率過高，請稍後再試', 429);
    }

    const body = await req.json();
    const title = String(body?.title ?? '').trim();
    const content = String(body?.content ?? '');
    const tags = Array.isArray(body?.tags)
      ? body.tags.map((t: unknown) => String(t).trim()).filter(Boolean)
      : [];

    const invalid = validateNoteFields({ title, content, tags });
    if (invalid) {
      return jsonError('INVALID_PARAMS', invalid, 400);
    }

    const result = await createNote(resolved.sb, resolved.userId, { title, content, tags });
    if (!result.ok) {
      return jsonError(result.code, result.message, result.code === 'NOT_FOUND' ? 404 : 500);
    }
    return jsonResponse({ note: result.value }, 201);
  } catch (err) {
    console.error('[API] /api/notes POST error:', err);
    return jsonError('INTERNAL_ERROR', 'Failed to create note', 500);
  }
}
