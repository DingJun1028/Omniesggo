// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
/**
 * OmniCoreEcosystem – Core integration of OA, OAB, OAG
 * Implements the contract from the specification.
 */

import { IOmniAgentGateway } from '@/lib/omni-core/contracts';
import { IOmniAgentBus } from '@/lib/omni-core/contracts';
import { IOmniAgent } from '@/lib/omni-core/contracts';

/**
 * OmniCoreEcosystem binds together a gateway, a bus, and a registry of agents.
 */
export class OmniCoreEcosystem {
  private gateway: IOmniAgentGateway;
  private bus: IOmniAgentBus;
  private agents: Map<string, IOmniAgent> = new Map();

  constructor(gateway: IOmniAgentGateway, bus: IOmniAgentBus) {
    this.gateway = gateway;
    this.bus = bus;
  }

  /**
   * Register an agent with the ecosystem.
   * @param id Unique identifier for the agent
   * @param agent The agent instance
   */
  public registerAgent(id: string, agent: IOmniAgent): void {
    this.agents.set(id, agent);
  }

  /**
   * Retrieve an agent by its ID.
   */
  public getAgent(id: string): IOmniAgent | undefined {
    return this.agents.get(id);
  }

  /**
   * Get the internal bus (for publishing/subscribing).
   */
  public getBus(): IOmniAgentBus {
    return this.bus;
  }

  /**
   * Get the internal gateway (for ingress/egress).
   */
  public getGateway(): IOmniAgentGateway {
    return this.gateway;
  }

  /**
   * Core security method: lock and freeze an object to prevent tampering.
   * Mimics the Hash Lock + Object.freeze() behaviour.
   */
  public static lockAndFreeze<T extends object & { evidence?: Record<string, unknown> }>(obj: T): T {
    // Attach a hash lock (simulated) to the object's evidence field
    obj.evidence = obj.evidence || {};
    (obj as any).evidence['hash_lock'] = `0xCELESTIAL_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 9)}`;

    // Freeze the object to prevent further modifications
    return Object.freeze(obj);
  }
}

export default OmniCoreEcosystem;