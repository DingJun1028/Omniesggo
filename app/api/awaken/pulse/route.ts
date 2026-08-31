import { NextResponse } from 'next/server';
import { dispatchToApostleServer } from '@lib/services/adk/apostle-dispatcher-server';
import { ApostleSquadManager } from '@lib/services/adk/apostle-squad-manager';

export async function POST(request: Request) {
  try {
    const { id, input } = await request.json();
    
    console.log(`🌌 [API] Executing Autonomous Pulse for Apostle: ${id}`);
    
    // Execute on Server
    const result = await dispatchToApostleServer(id, input || "執行您的聖典奧義，代主通典自行。");

    return NextResponse.json({ 
      success: true, 
      result: result 
    });
  } catch (error: unknown) {
    console.error('❌ [API] Execution Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
