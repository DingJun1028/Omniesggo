import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const filter = searchParams.get('filter') || 'all';
    
    let whereClause = {};
    if (filter !== 'all') {
      whereClause = { type: filter };
    }

    const traces = await prisma.omniTraceLog.findMany({
      where: whereClause,
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
    
    return NextResponse.json({ success: true, data: traces });
  } catch (error: any) {
    console.error('API /omni-trace Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { uuid, originCause, hashLock, type, agent } = body;
    
    const trace = await prisma.omniTraceLog.create({
      data: {
        uuid,
        originCause,
        hashLock,
        type,
        agent,
      },
    });

    return NextResponse.json({ success: true, data: trace });
  } catch (error: any) {
    console.error('API /omni-trace POST Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
