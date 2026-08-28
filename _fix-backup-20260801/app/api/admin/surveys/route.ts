import { NextResponse } from 'next/server';

type SurveyRow = {
  id?: string;
  week: number;
  date: string;
  topic: string;
  instructor: string;
  studentName?: string | null;
  organization?: string | null;
  ratings: Record<string, number>;
  feedbacks: { valuable?: string | null; improvement?: string | null; question?: string | null };
  submittedAt?: string;
};

const memoryStore: SurveyRow[] = [];
let memoryId = 1;

function addMemoryRow(row: SurveyRow): SurveyRow {
  const record = { ...row, id: String(memoryId++) };
  memoryStore.push(record);
  return record;
}

function getMemoryRows(): SurveyRow[] {
  return memoryStore.slice().sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || '')).slice(0, 200);
}

function findMemoryRow(id: string): SurveyRow | undefined {
  return memoryStore.find((item) => item.id === id);
}

function deleteMemoryRow(id: string): boolean {
  const index = memoryStore.findIndex((item) => item.id === id);
  if (index < 0) return false;
  memoryStore.splice(index, 1);
  return true;
}

export async function GET() {
  try {
    const backend = (process.env.SURVEY_BACKEND || '').trim().toLowerCase();
    if (backend === 'firebase') {
      const imported = await import('@/lib/firebase-admin');
      const adminDb = imported.adminDb;
      if (!adminDb || !adminDb.collection) {
        return NextResponse.json({ ok: true, rows: getMemoryRows() }, { status: 200 });
      }
      const collection = adminDb.collection('surveys');
      if (!collection) {
        return NextResponse.json({ ok: true, rows: getMemoryRows() }, { status: 200 });
      }
      const snap = await collection.orderBy('submittedAt', 'desc').limit(200).get();
      const rows = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      return NextResponse.json({ ok: true, rows }, { status: 200 });
    }
    return NextResponse.json({ ok: true, rows: getMemoryRows() }, { status: 200 });
  } catch (error) {
    console.error('[API] /api/admin/surveys GET error:', error);
    return NextResponse.json({ ok: false, message: 'Failed to load surveys' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ ok: false, message: 'Missing id' }, { status: 400 });
    }
    const backend = (process.env.SURVEY_BACKEND || '').trim().toLowerCase();
    if (backend === 'firebase') {
      const imported = await import('@/lib/firebase-admin');
      const adminDb = imported.adminDb;
      const docRef = adminDb.doc('surveys/' + id);
      if (!docRef) {
        const deleted = deleteMemoryRow(id);
        return NextResponse.json({ ok: deleted }, { status: deleted ? 200 : 404 });
      }
      await docRef.delete();
      return NextResponse.json({ ok: true }, { status: 200 });
    }
    const deleted = deleteMemoryRow(id);
    return NextResponse.json({ ok: deleted }, { status: deleted ? 200 : 404 });
  } catch (error) {
    console.error('[API] /api/admin/surveys DELETE error:', error);
    return NextResponse.json({ ok: false, message: 'Failed to delete survey' }, { status: 500 });
  }
}
