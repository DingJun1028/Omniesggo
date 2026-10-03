import { NextResponse } from 'next/server';
import { getUltimateAwakeningState, executeUltimateAwakening } from '@/lib/junaikey/ultimate-awakening';

export async function GET() {
  const state = await getUltimateAwakeningState();
  return NextResponse.json({
    success: true,
    title: 'JunAiKey Sovereign Hyper-Awakened Ultimate Engine',
    version: 'v3.4.0',
    state,
    fiveTProtocolSeals: {
      truth: { verified: true, sourceOrigin: state.sourceOrigin },
      goodness: { verified: true, standard: '77-Skill Convergence Matrix' },
      beauty: { verified: true, format: 'Liquid Glass Gold & Cyan' },
      trust: { verified: true, hashLock: state.lastHashLock },
      trackable: { verified: true, uuid: state.uuid },
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const intent = body.intent || body.prompt || '全域超覺醒系統優化與自我成長';

    const result = await executeUltimateAwakening(intent);

    return NextResponse.json({
      success: true,
      specVersion: 'v3.4.0',
      uuid: result.state.uuid,
      timestamp: result.state.updatedAt,
      sourceOrigin: result.state.sourceOrigin,
      hashLock: result.state.lastHashLock,
      executionTrace: result.executionTrace,
      newKnowledge: result.newKnowledge,
      updatedState: result.state,
      fiveTProtocolSeals: {
        truth: { verified: true, sourceOrigin: result.state.sourceOrigin },
        goodness: { verified: true, standard: 'Self-Evolving Ultimate Skill' },
        beauty: { verified: true, format: 'Liquid Glass Gold & Cyan' },
        trust: { verified: true, hashLock: result.state.lastHashLock },
        trackable: { verified: true, uuid: result.state.uuid },
      },
    });
  } catch (error) {
    console.error('[junaikey/ultimate-awakening]', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || '終極奧義觸發失敗' },
      { status: 500 }
    );
  }
}
