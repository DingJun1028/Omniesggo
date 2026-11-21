/**
 * @esggo/omni-bridge v1.0.0
 *
 * 跨平台符文 API + 事件匯流排 (Quantum Event Bus)
 * MECE 角色: 傳輸管道層 (Trackable lifecycle)
 */

import {
  createComponentCore,
  sealComponentCore,
  type IComponentCore,
} from '@esggo/omni-core';

export type OmniLayer =
  | 'OmniMemory'
  | 'OmniTag'
  | 'OmniAgent'
  | 'OmniDB'
  | 'OmniUI'
  | 'OmniForge'
  | 'OmniBridge';

export type EventType =
  | 'memory.recall'
  | 'memory.store'
  | 'tag.route'
  | 'agent.dispatch'
  | 'db.reason'
  | 'ui.render'
  | 'forge.iterate'
  | 'bridge.publish';

/**
 * BridgeEvent implements IComponentCore (Trustworthy sealable)
 */
export interface BridgeEvent extends IComponentCore {
  event_type: EventType;
  payload: unknown;
  source_layer: OmniLayer;
  target_layer: OmniLayer;
  tracked_at: number; // ms since publish
}

export type RuneProtocolKind = 'stdio' | 'sse' | 'websocket' | 'http';
export type RuneAdapterKind = 'mcp' | 'grpc' | 'rest' | 'graphql';

export interface RuneProtocol {
  rune_id: string;
  protocol: RuneProtocolKind;
  endpoint: string;
  adapter: RuneAdapterKind;
}

export class OmniBridge {
  private runes = new Map<string, RuneProtocol>();
  private subscribers = new Set<(event: BridgeEvent) => void>();
  private eventLog: BridgeEvent[] = [];

  /**
   * 發布事件到匯流排
   * 自動 seal (Trustworthy) + 廣播給 subscribers
   */
  async publishEvent(
    eventType: EventType,
    payload: unknown,
    source: OmniLayer,
    target: OmniLayer
  ): Promise<BridgeEvent> {
    const core = createComponentCore(`omni-bridge://events/${source}/${eventType}`);
    const sealed = await sealComponentCore(core);

    const event: BridgeEvent = {
      ...sealed,
      event_type: eventType,
      payload,
      source_layer: source,
      target_layer: target,
      tracked_at: Date.now(),
    };

    this.eventLog.push(event);

    // 廣播給 subscribers
    for (const sub of this.subscribers) {
      try {
        sub(event);
      } catch (e) {
        console.error(`Subscriber error: ${e}`);
      }
    }

    return event;
  }

  /**
   * 訂閱事件流
   */
  subscribe(callback: (event: BridgeEvent) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * 取得事件歷史 (Trackable)
   */
  getEventLog(): readonly BridgeEvent[] {
    return [...this.eventLog];
  }

  /**
   * 註冊符文 (外部 API 網關)
   */
  registerRune(protocol: RuneProtocol): void {
    this.runes.set(protocol.rune_id, protocol);
  }

  /**
   * 列出已註冊符文
   */
  listRunes(): readonly RuneProtocol[] {
    return [...this.runes.values()];
  }

  /**
   * 透過符文調用外部 API
   * (簡化實作: 真實 production 需 4 種 protocol adapter)
   */
  async invokeRune(
    runeId: string,
    method: string,
    path: string,
    body?: unknown
  ): Promise<unknown> {
    const rune = this.runes.get(runeId);
    if (!rune) throw new Error(`Rune ${runeId} not registered`);

    // 簡化: 記錄 invocation 到 event log
    return this.publishEvent(
      'bridge.publish',
      { runeId, method, path, body },
      'OmniBridge',
      'OmniAgent'
    );
  }
}

/**
 * 預設單例 (DI-friendly)
 */
export const omniBridge = new OmniBridge();
