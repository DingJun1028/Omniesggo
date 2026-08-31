// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
import { EventEmitter } from 'events';
import { CelestialCoreProcessor } from './omni-core/celestial-core-processor';

/** Simple event shape used throughout the project */
export interface IBusEvent {
  event: string;
  payload: unknown;
  ts: number;
  uuid?: string;
  [key: string]: unknown;
}

/** Simple OmniBus implementation */
class SimpleOmniBus {
  private emitter = new EventEmitter();
  private queueLengths: Record<string, number> = {};
  private entropyProcessor = new CelestialCoreProcessor();

  /** Publish an event */
  publish(topic: string, event: IBusEvent | unknown): void {
    let ev: IBusEvent;
    if (typeof event === 'object' && event && 'event' in event) {
      ev = event as IBusEvent;
    } else {
      ev = { event: topic, payload: event as unknown, ts: Date.now() };
    }
    this.emitter.emit(topic, ev);
    this.queueLengths[topic] = (this.queueLengths[topic] || 0) + 1;
  }

  /** Subscribe to a topic – returns an unsubscribe function */
  subscribe(topic: string, callback: (event: IBusEvent) => void): () => void {
    this.emitter.on(topic, callback);
    return () => this.emitter.off(topic, callback);
  }

  /** Monitor back‑pressure for a given topic */
  monitorBackpressure(topic: string, threshold: number = 1000): void {
    const size = this.queueLengths[topic] || 0;
    if (size > threshold) {
      const component = {
        uuid: `${topic}-clone`,
        version: '1.0',
        timestamp: Date.now(),
        evidence: { originCause: 'unknown', processTrace: [], finalEffect: 'unknown' },
      };
      this.entropyProcessor.monitorBackpressure(
        component as unknown as Parameters<typeof this.entropyProcessor.monitorBackpressure>[0],
        topic,
      );
      console.warn(`[Backpressure] ${topic} size ${size} > ${threshold}, cloned OA.`);
    }
  }

  /** Lifecycle cleanup when a topic queue becomes empty */
  cleanup(topic: string): void {
    if ((this.queueLengths[topic] || 0) === 0) {
      const marker = this.entropyProcessor.lifecycleCleanup(topic);
      console.info(`[Lifecycle] Cleaned up ${topic}:`, marker);
    }
  }
}

/** Export a singleton used throughout the codebase */
export const enhancedOmniBus = new SimpleOmniBus();

/* ----- Dynamic Entropy Gating Integration ----- */
const entropyProcessor = new CelestialCoreProcessor();

/** Monitor back‑pressure (wrapper) */
export const monitorBackpressure = (component: Record<string, unknown>, sourceOrigin: string) =>
  entropyProcessor.monitorBackpressure(
    component as unknown as Parameters<typeof entropyProcessor.monitorBackpressure>[0],
    sourceOrigin,
  );

/** Shadow test ingress */
export const shadowTestIngress = (payload: unknown) =>
  entropyProcessor.shadowTestIngress(payload);

/** Predict & pre‑fetch */
export const predictAndPreFetch = () => entropyProcessor.predictAndPreFetch();

/** Inject chaos */
export const injectChaos = (targetUuid: string) =>
  entropyProcessor.injectChaos(targetUuid);

/** Lifecycle cleanup */
export const lifecycleCleanup = (agentId: string) =>
  entropyProcessor.lifecycleCleanup(agentId);
