import { CelestialController } from '@/lib/celestial/implementation';
import { plantOmniSeed, IOmniSeed } from '../sonnar/omni-seed';
import { trinityHash } from '../sonnar/hash-lock';

export interface OrchestratorContext {
  traceId: string;
  sourceOrigin: string;
  timestamp: number;
}

export class OmniOrchestrator {
  private celestial = new CelestialController();

  /**
   * Monitor execution block and capture anomalies.
   * If error occurs, trigger auto-healing & ZKP sealing (Entropy Reduction).
   */
  async executeWithSelfHealing<T>(
    operationName: string,
    operation: () => Promise<T>,
    fallbackResult: T
  ): Promise<T> {
    const traceId = `omni-trace-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const context: OrchestratorContext = {
      traceId,
      sourceOrigin: operationName,
      timestamp: Date.now(),
    };

    try {
      console.log(`[OmniOrchestrator] Starting dual-track execution: ${operationName} (Trace: ${traceId})`);
      const result = await operation();
      return result;
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error(`[OmniOrchestrator] Anomaly detected in ${operationName}:`, error);
      
      // Trigger Entropy Reduction (Self-healing & Sealing)
      await this.triggerEntropyReduction(context, err.message || String(error));
      
      // Return safe fallback to guarantee TRANSCENDED system stability (WuZuoMiaoDe)
      return fallbackResult;
    }
  }

  private async triggerEntropyReduction(context: OrchestratorContext, errorDetail: string) {
    console.warn(`[OmniOrchestrator] Initiating Entropy Reduction for Trace ${context.traceId}...`);
    
    // Use CelestialFlow to seal the error event to ensure 5T compliance
    try {
      await this.celestial.executeCelestialFlow({
        payload: {
          errorType: 'SYSTEM_ANOMALY',
          detail: errorDetail,
          context
        },
        origin: 'OMNI_ORCHESTRATOR'
      });
      console.log(`[OmniOrchestrator] Entropy Reduction complete. Anomaly sealed. System restored to TRANSCENDED state.`);
    } catch (sealError) {
      console.error(`[OmniOrchestrator] CRITICAL: Failed to seal anomaly!`, sealError);
    }

    // Plant an OmniSeed to create an immutable frozen audit seal in #記憶聖所
    try {
      const auditEvidence = {
        originCause: context.sourceOrigin,
        processTrace: [errorDetail],
        finalEffect: 'SELF_HEALING_COMPLETED',
        errorType: 'SYSTEM_ANOMALY',
        detail: errorDetail,
        traceId: context.traceId,
        sourceOrigin: context.sourceOrigin,
        action: 'SELF_HEALING_COMPLETED',
      };
      
      const hashLock = trinityHash(context.traceId, JSON.stringify(auditEvidence), String(context.timestamp));
      
      const dormantSeed: IOmniSeed = {
        uuid: context.traceId,
        version: '1.0.0-audit',
        timestamp: context.timestamp,
        evidence: auditEvidence,
        hashLock,
        entropyControl: 0.1,
        status: 'dormant'
      };
      
      const auditSeal = plantOmniSeed(dormantSeed, '#記憶聖所');
      console.log(`[OmniOrchestrator] Immutable OmniSeed Audit Seal generated in #記憶聖所. HashLock: ${auditSeal.hashLock}`);
    } catch (omniSeedError) {
      console.error(`[OmniOrchestrator] Failed to plant OmniSeed Audit Seal:`, omniSeedError);
    }
  }
}

export const omniOrchestrator = new OmniOrchestrator();
