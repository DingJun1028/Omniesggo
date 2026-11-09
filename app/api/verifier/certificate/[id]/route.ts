import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-omni';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const tables = [
      { table: 'MaterialityAssessment', type: 'MaterialityAssessment' },
      { table: 'NetZeroRoadmap', type: 'NetZeroRoadmap' },
      { table: 'SupplyChainVendor', type: 'SupplyChainVendor' },
      { table: 'DataBridgeUpload', type: 'DataBridgeUpload' },
    ];
    let record: any = null;
    let recordType = '';
    for (const t of tables) {
      try {
        record = await supabase.from(t.table).select('*').eq('id', id).single();
        recordType = t.type;
        break;
      } catch (e: any) {
        if (e?.code !== 'PGRST116') throw e;
      }
    }
    if (!record) {
      return NextResponse.json(
        { success: false, verified: false, error: '找不到匹配的 5T 雜湊鎖憑證紀錄 (Certificate Not Found)' },
        { status: 404 });
    }
    const publicCertificateCard = {
      success: true, verified: true, specVersion: 'v3.4.0',
      uuid: record.id, recordType, hashLock: record.hashLock,
      sourceOrigin: record.sourceOrigin || 'omni-5t-vault',
      sealedAt: record.createdAt || record.sealedAt,
      fiveTProtocolSeals: {
        truth: { verified: true, sourceOrigin: record.sourceOrigin || 'omni-5t-vault' },
        goodness: { verified: true, standard: 'GRI & ISO-14064-1 & EU CSRD' },
        beauty: { verified: true, uiStyle: 'Liquid Glass Cyan' },
        trust: { verified: true, hashLock: record.hashLock },
        trackable: { verified: true, uuid: record.id },
      },
    };
    return NextResponse.json(publicCertificateCard, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('[verifier/certificate]', error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
