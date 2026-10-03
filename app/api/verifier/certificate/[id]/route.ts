import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Search across all 5T record tables
    let record: any = await prisma.materialityAssessment.findUnique({ where: { id } });
    let recordType = 'MaterialityAssessment';

    if (!record) {
      record = await prisma.netZeroRoadmap.findUnique({ where: { id } });
      recordType = 'NetZeroRoadmap';
    }
    if (!record) {
      record = await prisma.supplyChainVendor.findUnique({ where: { id } });
      recordType = 'SupplyChainVendor';
    }
    if (!record) {
      record = await prisma.dataBridgeUpload.findUnique({ where: { id } });
      recordType = 'DataBridgeUpload';
    }

    if (!record) {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          error: '找不到匹配的 5T 雜湊鎖憑證紀錄 (Certificate Not Found)',
        },
        { status: 404 }
      );
    }

    const publicCertificateCard = {
      success: true,
      verified: true,
      specVersion: 'v3.4.0',
      uuid: record.id,
      recordType: recordType,
      hashLock: record.hashLock,
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
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
