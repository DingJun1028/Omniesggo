import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
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
    });
  } catch (error: any) {
    console.error('Fetch supply chain vendors error:', error);
    return NextResponse.json(
      { success: false, error: error.message || '查詢供應商清單失敗' },
      { status: 500 }
    );
  }
}
