import { NextResponse } from 'next/server';
import { list } from '@/lib/supabase-omni';

export async function GET() {
  try {
    // Supabase query builder — all reads go through supabase.from()
    // (orderBy created desc, 20 rows, no nested child records: recordCount is
    // already denormalized on DataBridgeUpload; children live in DataBridgeRecord
    // keyed by uploadId)
    const uploads = await list<Record<string, unknown>>(
      'DataBridgeUpload',
      undefined,
      { field: 'createdAt', dir: 'desc' },
      20
    );

    const formatted = uploads.map((u) => ({
      id: u.id,
      sourceSystem: u.sourceSystem,
      dataType: u.dataType,
      recordCount: Number(u.recordCount),
      hashLock: u.hashLock,
      metrics: u.metrics ? JSON.parse(String(u.metrics)) : null,
      createdAt: u.createdAt,
      sealedAt: u.sealedAt,
    }));

    return NextResponse.json({
      success: true,
      uploads: formatted,
    });
  } catch (error) {
    console.error('[data-bridge/records]', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message, uploads: [] },
      { status: 500 }
    );
  }
}
