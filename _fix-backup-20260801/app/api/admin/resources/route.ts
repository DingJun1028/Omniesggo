// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
/**
 * Admin Resources API — NCBDB 模式 (GCP Firebase 已停用, 力度 1, 2026-08-25)
 *
 * 2026-08-25 用戶指示「改用 NCBDB」: 資料層改接 ncbQuery, 移除 firebase-admin 依賴。
 * NCBDB 無 API Key 時優雅回傳空陣列 (模擬模式), 保留 memory fallback 作為開發期降級。
 */

import { NextResponse } from 'next/server';
import { ncbQuery } from '@/lib/ncb-utils';

export const runtime = 'nodejs';

type ResourceRow = {
  id?: string;
  title: string;
  category: 'shared_resource' | 'assignment' | 'replay' | 'consulting' | 'question' | 'survey' | 'other';
  url?: string;
  week?: number;
  createdBy?: string;
  createdAt?: string;
};

const memoryStore: ResourceRow[] = [];
let memoryId = 1;

function addMemoryRow(row: ResourceRow): ResourceRow {
  const record = { ...row, id: String(memoryId++) };
  memoryStore.push(record);
  return record;
}

function getMemoryRows(): ResourceRow[] {
  return memoryStore.slice().sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).slice(0, 200);
}

function isNcbdbConfigured(): boolean {
  return !!process.env.NCB_API_KEY;
}

export async function GET() {
  try {
    if (isNcbdbConfigured()) {
      const rows = await ncbQuery<ResourceRow[]>({
        table: 'resources',
        method: 'GET',
        params: { orderBy: 'createdAt', order: 'desc', limit: '200' },
      });
      return NextResponse.json({ ok: true, rows: Array.isArray(rows) ? rows : [] }, { status: 200 });
    }
    return NextResponse.json({ ok: true, rows: getMemoryRows() }, { status: 200 });
  } catch (error) {
    console.error('[API] /api/admin/resources GET error:', error);
    return NextResponse.json({ ok: false, message: 'Failed to load resources' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Partial<ResourceRow>;
    const title = typeof payload.title === 'string' ? payload.title.trim() : '';
    const category = typeof payload.category === 'string' ? payload.category : 'other';
    if (!title) {
      return NextResponse.json({ ok: false, message: 'Missing title' }, { status: 400 });
    }

    const row: ResourceRow = {
      title,
      category,
      url: typeof payload.url === 'string' ? payload.url.trim() : '',
      week: typeof payload.week === 'number' ? payload.week : undefined,
      createdBy: typeof payload.createdBy === 'string' ? payload.createdBy : undefined,
      createdAt: new Date().toISOString(),
    };

    if (isNcbdbConfigured()) {
      const result = await ncbQuery<{ id?: string }>({
        table: 'resources',
        method: 'POST',
        body: row,
      });
      return NextResponse.json({ ok: true, row: { ...row, id: result?.id ?? String(memoryId++) } }, { status: 200 });
    }

    const memRow = addMemoryRow(row);
    return NextResponse.json({ ok: true, row: memRow }, { status: 200 });
  } catch (error) {
    console.error('[API] /api/admin/resources POST error:', error);
    return NextResponse.json({ ok: false, message: 'Failed to save resource' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ ok: false, message: 'Missing id' }, { status: 400 });
    }

    if (isNcbdbConfigured()) {
      await ncbQuery({
        table: 'resources',
        method: 'DELETE',
        params: { id },
      });
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const index = memoryStore.findIndex((item) => item.id === id);
    if (index < 0) return NextResponse.json({ ok: false, message: 'Not found' }, { status: 404 });
    memoryStore.splice(index, 1);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error('[API] /api/admin/resources DELETE error:', error);
    return NextResponse.json({ ok: false, message: 'Failed to delete resource' }, { status: 500 });
  }
}
