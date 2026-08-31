/**
 * GET /api/notes — Fetch all notes from Firestore (server-side)
 * Used by Sustain Write to reference notes in report generation
 */
import { jsonResponse, jsonError } from '@lib/api-utils';

export interface NoteData {
  id: string;
  title: string;
  content: string;
  tags: string[];
  fiveTGate?: string;
  createdAt: number;
}

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { adminDb } = await import('@/lib/firebase-admin');

    if (!adminDb) {
      return jsonError('INTERNAL_ERROR', 'Firebase Admin not configured', 503);
    }

    const notesCol = adminDb.collection('notes');
    if (!notesCol) {
      return jsonError('INTERNAL_ERROR', 'Firestore collection unavailable', 503);
    }

    const snapshot = await notesCol
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    const notes: NoteData[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as NoteData[];

    return jsonResponse({ notes, total: notes.length });
  } catch (err) {
    console.error('[API] /api/notes GET error:', err);
    return jsonError('INTERNAL_ERROR', 'Failed to fetch notes', 500);
  }
}
