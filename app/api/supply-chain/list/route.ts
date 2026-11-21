import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({
      success: true,
      data: [],
      persistence: 'unavailable',
      notice: '供應鏈資料庫尚未設定；清單目前為空，紀錄不會持久保存。',
    });
  }

  try {
    const vendors = await prisma.supplyChainVendor.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const formatted = vendors.map((v) => ({
      ...v,
      strengths: JSON.parse(v.strengthsJson),
      weaknesses: JSON.parse(v.weaknessesJson),
    }));

    return NextResponse.json({
      success: true,
      data: formatted,
      persistence: 'available',
    });
  } catch (error: any) {
    console.error('Fetch supply chain vendors error:', error);
    return NextResponse.json(
      {
        success: false,
        code: 'SUPPLY_CHAIN_LIST_FAILED',
        error: '目前無法載入供應商清單，請稍後重試。',
      },
      { status: 500 }
    );
  }
}
