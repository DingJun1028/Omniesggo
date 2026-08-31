// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
// Minimal implementation for TypeScript compilation.
// The full implementation lives in other parts of the codebase (e.g., src/impl).

import { IComponentCore, IBusEvent } from '../omni-core/contracts';

export class OmniAgent {
  static getInstance(): OmniAgent { return new OmniAgent(); }
  readonly signature: IComponentCore;
  constructor() {
    this.signature = {
      uuid: `agent-${Date.now()}`,
      version: '2.1.0',
      timestamp: Date.now(),
      evidence: { originCause: 'unknown', processTrace: [], finalEffect: 'unknown' },
    };
  }
  async execute(event: IBusEvent): Promise<void> {
    console.log('[OmniAgent] execute', event.topic);
  }
  // Minimal status method used by console route
  getStatus(): string { return 'idle'; }
  // Martial law handling
  onMartialLaw(reason: string): void {
    console.warn('[OmniAgent] martial law', reason);
  }
}

export const DEFAULT_CAPABILITIES = [] as const;

export const OMNI_AGENT_META = Object.freeze({
  version: '2.1.0',
  maxConcurrentTasks: 10,
  supportedFormats: ['html', 'markdown', 'json', 'pdf-ready'] as const,
  gateOrder: ['traceable', 'transparent', 'tangible', 'trustworthy', 'trackable'] as const,
});
