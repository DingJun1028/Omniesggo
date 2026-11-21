import { type IBusEvent } from '../../lib/omni-agent-bus';
import { publishBusEvent } from '../../lib/bus';
import { monitorBackpressure, shadowTestIngress, predictAndPreFetch, injectChaos, lifecycleCleanup } from '../../lib/omni-agent-bus';

/**
 * Simplified OmniAgentGateway – only demonstrates integration with Dynamic Entropy Gating.
 * The original complex gateway logic (validate5TGate, UI feedback, ecosystem wiring) is omitted
 * for this exercise, focusing on the four core functions.
 */
export async function secureForward(event: IBusEvent): Promise<{ status: string; hashLock: string }> {
  // 委託統一發布原語（含 SHA-256 hashLock 溯源 + 發布至 omni-agent-bus）
  const { hashLock } = publishBusEvent('external-forward', event);
  return { status: 'routed', hashLock };
}

// Re‑export the Dynamic Entropy Gating utilities for external callers
export const monitorBackpressureWrapper = monitorBackpressure;
export const shadowTestIngressWrapper = shadowTestIngress;
export const predictAndPreFetchWrapper = predictAndPreFetch;
export const injectChaosWrapper = injectChaos;
export const lifecycleCleanupWrapper = lifecycleCleanup;
