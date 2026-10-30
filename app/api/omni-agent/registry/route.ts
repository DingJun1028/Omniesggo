import { NextResponse } from 'next/server';
import { REGISTRY_AGENTS } from '../../../omni-agent-zone/_shared/registry-data';

export async function GET() {
  try {
    const agents = REGISTRY_AGENTS;
    return NextResponse.json({ agents, total: agents.length });
  } catch (error) {
    // Mock 資料端點；序列化失敗時如實回 500，不做吞異常重試。
    return NextResponse.json(
      { error: 'Failed to fetch agents' },
      { status: 500 }
    );
  }
}
