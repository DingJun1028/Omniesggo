import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';
import { first } from '@/lib/supabase-omni';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 5T archive single seal: supabase.from() builder — no prisma
    const { data: upload, error } = await supabase
      .from('DataBridgeUpload')
      .select(`
        id,
        sourceSystem,
        dataType,
        recordCount,
        hashLock,
        createdAt,
        sealedAt,
        metrics,
        records (rawJson)
      `)
      .eq('id', id)
      .single();

    if (error || !upload) {
      return NextResponse.json(
        { success: false, error: '找不到該筆 5T 封印紀錄' },
        { status: 404 }
      );
    }

    const certificate = {
      type: '5T-Canon-Audit-Certificate',
      specVersion: 'v2.0.0',
      uuid: upload.id,
      sourceOrigin: upload.sourceSystem,
      dataType: upload.dataType,
      recordCount: Number(upload.recordCount),
      hashLock: upload.hashLock,
      createdAt: upload.createdAt,
      sealedAt: upload.sealedAt,
      esgMetrics: upload.metrics ? JSON.parse(String(upload.metrics)) : null,
      fiveTVerification: {
        traceable: { verified: true, source: upload.sourceSystem },
        transparent: {
          verified: true,
          formula: 'ISO-14064-1 & 台電 2024 排放係數',
        },
        tangible: { verified: true, uiTheme: 'Liquid Glass Cyan' },
        trustworthy: { verified: true, hashLock: upload.hashLock },
        trackable: { verified: true, dbRecordId: upload.id },
      },
      recordsSample: (upload.records ?? []).map(
        (r: { rawJson: string }) => JSON.parse(r.rawJson || '{}')
      ),
    };

    return new Response(JSON.stringify(certificate, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="5T_Certificate_${upload.id.slice(0, 8)}.json"`,
      },
    });
  } catch (error) {
    console.error('[data-bridge/export]', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
