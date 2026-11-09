/**
 * /api/notes/[id]/attachments — note attachment metadata (Supabase)
 * GET    /api/notes/[id]/attachments          list attachments of a note
 * POST   /api/notes/[id]/attachments          register { name, path, size, type, url }
 * DELETE /api/notes/[id]/attachments?id=attId remove metadata row + storage object
 *
 * The file itself is uploaded to the `note-attachments` bucket from the
 * browser (Supabase Storage, RLS owner-write); this route only tracks metadata.
 */
import { NextRequest } from 'next/server';
import { jsonResponse, jsonError } from '@lib/api-utils';
import {
  listAttachments,
  addAttachment,
  removeAttachment,
  resolveRequestClient,
} from '@/lib/notes-store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return jsonError('INVALID_PARAMS', 'Note ID is required', 400);
  }
  const resolved = await resolveRequestClient(request);
  if ('error' in resolved) {
    return jsonError(resolved.error.code, resolved.error.message, 401);
  }
  const result = await listAttachments(resolved.sb, id);
  if (!result.ok) {
    return jsonError(result.code, result.message, 500);
  }
  return jsonResponse({ attachments: result.value });
}

export async function POST(
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
    const name = String(body?.name ?? '').trim();
    const storagePath = String(body?.path ?? '').trim();
    if (!name || !storagePath) {
      return jsonError('INVALID_PARAMS', 'name and path are required', 400);
    }

    const result = await addAttachment(resolved.sb, resolved.userId, {
      noteId: id,
      name,
      path: storagePath,
      size: Number(body?.size ?? 0),
      type: String(body?.type ?? ''),
      url: String(body?.url ?? ''),
    });
    if (!result.ok) {
      return jsonError(result.code, result.message, 500);
    }
    return jsonResponse({ attachment: result.value }, 201);
  } catch (err) {
    console.error('[API] /api/notes/[id]/attachments POST error:', err);
    return jsonError('INTERNAL_ERROR', 'Failed to register attachment', 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const resolved = await resolveRequestClient(request);
    if ('error' in resolved) {
      return jsonError(resolved.error.code, resolved.error.message, 401);
    }
    const url = new URL(request.url);
    const attId = url.searchParams.get('id') || '';
    if (!attId) {
      return jsonError('INVALID_PARAMS', 'id query param is required', 400);
    }
    const result = await removeAttachment(resolved.sb, attId);
    if (!result.ok) {
      return jsonError(result.code, result.message, result.code === 'NOT_FOUND' ? 404 : 500);
    }
    return jsonResponse(result.value);
  } catch (err) {
    console.error('[API] /api/notes/[id]/attachments DELETE error:', err);
    return jsonError('INTERNAL_ERROR', 'Failed to remove attachment', 500);
  }
}
