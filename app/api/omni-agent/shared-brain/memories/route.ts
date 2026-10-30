import { NextResponse } from 'next/server';
import { MOCK_MEMORIES } from '../../../../omni-agent-zone/_shared/mock-brain';

export async function GET() {
  try {
    return NextResponse.json({ memories: MOCK_MEMORIES });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch memories' },
      { status: 500 }
    );
  }
}
