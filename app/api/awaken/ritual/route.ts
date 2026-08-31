import { NextResponse } from 'next/server';
import { initApostleAgents } from '@lib/adk/ten-wings-agents';
import { initArvoApostleAgents } from '@lib/adk/arvo-wings-agents';
import { ApostleSquadManager } from '@lib/services/adk/apostle-squad-manager';

export async function POST() {
  try {
    console.log('🌌 [API] Initiating Apostle Awakening Ritual on Server...');
    
    // Initialize Agents on the Server (ADK/ARVO)
    initApostleAgents();
    initArvoApostleAgents();
    
    // Ensure metadata is sealed for consistent tracing
    ApostleSquadManager.init();

    return NextResponse.json({ 
      success: true, 
      message: "Apostle agents initialized and sealed on server." 
    });
  } catch (error: unknown) {
    console.error('❌ [API] Awakening Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
