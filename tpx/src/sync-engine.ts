import { SyncEvent, NodeInfo, SyncMetadata } from './types.js';

export class SyncEngine {
  private EVENTS: SyncEvent[] = [];
  private NODES = new Map<string, NodeInfo>();

  recordEvent(event: SyncEvent): void {
    this.EVENTS.push(event);
  }

  getEvents(): SyncEvent[] {
    return [...this.EVENTS];
  }

  registerNode(info: NodeInfo): void {
    this.NODES.set(info.id, info);
  }

  getNode(id: string): NodeInfo | undefined {
    return this.NODES.get(id);
  }

  sync(metadata: SyncMetadata): void {
    // Simplified: push to target, pull from source
    if (metadata.type === 'push' || metadata.type === 'full') {
      // push logic here
    }
    if (metadata.type === 'pull' || metadata.type === 'full') {
      // pull logic here
    }
  }
}
