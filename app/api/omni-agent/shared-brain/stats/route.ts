import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const stats = {
      totalMemories: 1247,
      sharedMemories: 892,
      agents: 8,
      connections: 3456,
      lastSync: new Date().toISOString(),
    };
    
    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
