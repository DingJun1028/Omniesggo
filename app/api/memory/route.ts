import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'default-user';
    
    const context = await prisma.avatarContext.findUnique({
      where: { userId }
    });
    
    return NextResponse.json({
      success: true,
      context: context ? JSON.parse(context.preferences || '{}') : {}
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId = 'default-user', agentId = 'omni-core', content, role = 'user' } = body;

    // Save chat interaction to local memory
    const memory = await prisma.omniMemory.create({
      data: {
        userId,
        agentId,
        role,
        content
      }
    });

    return NextResponse.json({ success: true, memoryId: memory.id });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
