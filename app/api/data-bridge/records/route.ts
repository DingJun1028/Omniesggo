import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const uploads = await prisma.dataBridgeUpload.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        _count: { select: { records: true } }
      }
    });

    const formatted = uploads.map((u: any) => ({
      id: u.id,
      sourceSystem: u.sourceSystem,
      dataType: u.dataType,
      recordCount: u.recordCount,
      hashLock: u.hashLock,
      metrics: u.metrics ? JSON.parse(u.metrics) : null,
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
