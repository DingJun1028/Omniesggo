/**
 * /api/notes/[id] — Universal Notes API
 * PUT    /api/notes/[id]   update { title?, content?, tags?, fiveTGate? }
 * DELETE /api/notes/[id]   delete a note
 *
 * Storage: Supabase table `notes` with RLS (per-user client from the Bearer
 * token); local JSON file fallback when Supabase env is absent.
 */
import { NextRequest } from 'next/server';
import { jsonResponse, jsonError } from '@lib/api-utils';
import { updateNote, deleteNote, resolveRequestClient } from '@/lib/notes-store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return jsonError('INVALID_PARAMS', 'Note ID is required', 400);
    }

    const resolved = await resolveRequestClient(request);
    if ('error' in resolved) {
      return jsonError(resolved.error.code, resolved.error.message, 401);
    }

    const body = await request.json();
    const patch: Record<string, unknown> = {};

    if (body?.title !== undefined) {
      const title = String(body.title).trim();
      if (!title) {
        return jsonError('INVALID_PARAMS', 'title must not be empty', 400);
      }
      patch.title = title;
    }
    if (body?.content !== undefined) patch.content = String(body.content);
    if (body?.tags !== undefined) {
      patch.tags = Array.isArray(body.tags)
        ? body.tags.map((t: unknown) => String(t).trim()).filter(Boolean)
        : [];
    }
    if (body?.fiveTGate !== undefined) patch.fiveTGate = String(body.fiveTGate);

    const result = await updateNote(resolved.sb, id, patch);
    if (!result.ok) {
      return jsonError(result.code, result.message, result.code === 'NOT_FOUND' ? 404 : 500);
    }
    return jsonResponse({ note: result.value });
  } catch (err) {
    console.error('[API] /api/notes/[id] PUT error:', err);
    return jsonError('INTERNAL_ERROR', 'Failed to update note', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return jsonError('INVALID_PARAMS', 'Note ID is required', 400);
    }

    const resolved = await resolveRequestClient(request);
    if ('error' in resolved) {
      return jsonError(resolved.error.code, resolved.error.message, 401);
    }

    const result = await deleteNote(resolved.sb, id);
    if (!result.ok) {
      return jsonError(result.code, result.message, result.code === 'NOT_FOUND' ? 404 : 500);
    }
    return jsonResponse(result.value);
  } catch (err) {
    console.error('[API] /api/notes/[id] DELETE error:', err);
    return jsonError('INTERNAL_ERROR', 'Failed to delete note', 500);
  }
}
