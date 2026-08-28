// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
/**
 * Surveys API — NCBDB 模式 (GCP Firebase 已停用, 力度 1, 2026-08-25)
 *
 * 2026-08-25 用戶指示「改用 NCBDB」: firebase backend 分支改接 ncbQuery。
 * NCBDB 無 API Key 時優雅回傳空陣列 (模擬模式), 故保留 memory fallback 作為開發期降級。
 */

import { NextResponse } from 'next/server';
import { ncbQuery } from '@lib/ncb-utils';

type SurveyRow = {
  id?: string;
  week: number;
  date: string;
  topic: string;
  instructor: string;
  studentName?: string | null;
  organization?: string | null;
  ratings: Record<string, number>;
  feedbacks: {
    valuable?: string | null;
    improvement?: string | null;
    question?: string | null;
  };
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

function isNcbdbConfigured(): boolean {
  return !!process.env.NCB_API_KEY;
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Partial<SurveyRow>;

    const missing = ['week', 'date', 'topic', 'instructor', 'ratings'].filter(
      (key) => typeof (payload as Record<string, unknown>)[key] === 'undefined'
    );
    if (missing.length > 0) {
      return NextResponse.json({ ok: false, message: 'Missing required fields: ' + missing.join(', ') }, { status: 400 });
    }

    const row: SurveyRow = {
      week: payload.week as number,
      date: payload.date as string,
      topic: payload.topic as string,
      instructor: payload.instructor as string,
      studentName: payload.studentName ?? null,
      organization: payload.organization ?? null,
      ratings: (payload.ratings as SurveyRow['ratings']) ?? {},
      feedbacks: {
        valuable: payload.feedbacks?.valuable ?? null,
        improvement: payload.feedbacks?.improvement ?? null,
        question: payload.feedbacks?.question ?? null,
      },
      submittedAt: new Date().toISOString(),
    };

    if (isNcbdbConfigured()) {
      const result = await ncbQuery<{ id?: string }>({
        table: 'surveys',
        method: 'POST',
        body: row,
      });
      return NextResponse.json({ ok: true, id: result?.id ?? String(memoryId++) }, { status: 200 });
    }

    // NCBDB 未設定 → memory fallback (開發期)
    const memRow = addMemoryRow(row);
    return NextResponse.json({ ok: true, id: memRow.id }, { status: 200 });
  } catch (error) {
    console.error('[API] /api/surveys POST error:', error);
    return NextResponse.json({ ok: false, message: 'Failed to save survey' }, { status: 500 });
  }
}

export async function GET() {
  try {
    if (isNcbdbConfigured()) {
      const rows = await ncbQuery<SurveyRow[]>({
        table: 'surveys',
        method: 'GET',
        params: { orderBy: 'submittedAt', order: 'desc', limit: '200' },
      });
      return NextResponse.json({ ok: true, rows: Array.isArray(rows) ? rows : [] }, { status: 200 });
    }

    return NextResponse.json({ ok: true, rows: getMemoryRows() }, { status: 200 });
  } catch (error) {
    console.error('[API] /api/surveys GET error:', error);
    return NextResponse.json({ ok: false, message: 'Failed to load surveys' }, { status: 500 });
  }
}
