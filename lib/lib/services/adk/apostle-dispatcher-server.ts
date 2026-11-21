import { ApostleSquadManager } from './apostle-squad-manager';
import { AdkSquadFactory } from './adk-squad-factory';
import { PersistentSessionService } from './persistent-session-service';
import { AgentNetworkBus } from '../EntropyAgent';
import { omniIndex } from '@lib/core/omni-index';
import { ApostleMetadata } from '@lib/adk/types';

const runners = new Map<string, any>();
const sessionService = new PersistentSessionService();

/**
 * 伺服器端使徒執行器
 */
export async function dispatchToApostleServer(id: string, input: string) {
  ApostleSquadManager.init();
  ApostleSquadManager.initAgents();
  const apostle = ApostleSquadManager.allApostles.find((a: ApostleMetadata) => a.id === id);
  if (!apostle || !apostle.agent) {
    throw new Error(`Apostle [${id}] not initialized or not found.`);
  }

  let runner = runners.get(id);
  if (!runner) {
    runner = AdkSquadFactory.createRunner(apostle.agent, sessionService);
    runners.set(id, runner);
  }

  AgentNetworkBus.broadcast({ 
    agentId: apostle.nameEn, 
    status: "PROCESSING", 
    category: "AGENT",
    currentTask: `Executing ${apostle.arcane}: ${input.substring(0, 30)}...` 
  });

  try {
    const generator = runner.runAsync({
      userId: 'system-admin',
      sessionId: 'apostle-squad-session',
      newMessage: { role: 'user', parts: [{ text: input }] }
    });

    let lastEvent: any = null;
    for await (const event of generator) {
      lastEvent = event;
      AgentNetworkBus.broadcast({ 
        agentId: apostle.nameEn, 
        status: "PROCESSING", 
        category: "AGENT",
        currentTask: `Executing ${apostle.arcane}`,
        adkEvent: event
      });
    }
    
    omniIndex.evolveNode(
      `apostle-${apostle.id}`,
      "INTERACTED",
      "USER_ADMIN",
      `${apostle.arcane} executed successfully.`
    );

    AgentNetworkBus.broadcast({ 
      agentId: apostle.nameEn, 
      status: "COMPLETED", 
      category: "AGENT",
      adkEvent: lastEvent
    });

    return lastEvent;
  } catch (error) {
    AgentNetworkBus.broadcast({ agentId: apostle.nameEn, status: "ERROR", category: "AGENT" });
    throw error;
  }
}
