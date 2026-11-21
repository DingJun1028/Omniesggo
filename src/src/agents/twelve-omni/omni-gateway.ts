/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * ==========================================
 * 🌌 OmniGateway — 萬能網關實現 (增強版)
 * ==========================================
 * Security gateway with ingress/egress, hash lock, and martial law control.
 * OAG: 安全網關，支持 Hash Lock、戒嚴、先知預判
 */

import { randomUUID, createHash } from 'crypto';
import {
  IOmniGatewayV2,
  LockedEvent,
  SecurityPolicy,
} from '../../types/twelve-omni';
import { IBusEvent } from '../../lib/omni-core/contracts';

/**
 * OmniGatewayV2 實現
 * 安全網關，所有事件必須通過此網關
 */
export class OmniGatewayV2 implements IOmniGatewayV2 {
  readonly uuid: string;
  readonly version: string = '1.0.0';
  readonly timestamp: number;
  evidence: {
    originCause: string;
    processTrace: string[];
    finalEffect: string;
    } = { originCause: 'unknown', processTrace: [], finalEffect: 'unknown' };

  /** 戒嚴狀態 */
  private martialLawActive: boolean = false;
  private martialLawReason: string = '';
  private martialLawActivatedAt: number = 0;

  /** 安全策略 */
  private policy: SecurityPolicy = {
    maxEventSize: 1024 * 1024, // 1MB
    allowedTopics: ['*'],
    blockedSources: [],
    martialLawThreshold: 100,
  };

  /** 入口驗證歷史 */
  private ingressHistory: Array<{ eventId: string; valid: boolean; timestamp: number }> = [];

  constructor() {
    this.uuid = randomUUID();
    this.timestamp = Date.now();
  }

  /**
   * 入口驗證
   * 所有進入系統的事件必須通過此驗證
   */
  async ingress(event: IBusEvent): Promise<IBusEvent> {
    // 檢查戒嚴
    if (this.martialLawActive) {
      throw new Error(`System under martial law: ${this.martialLawReason}`);
    }

    // 驗證事件大小
    const eventSize = JSON.stringify(event).length;
    if (eventSize > this.policy.maxEventSize) {
      this.ingressHistory.push({ eventId: event.uuid, valid: false, timestamp: Date.now() });
      throw new Error(`Event size ${eventSize} exceeds maximum ${this.policy.maxEventSize}`);
    }

    // 驗證主題
    if (
      !this.policy.allowedTopics.includes('*') &&
      !this.policy.allowedTopics.includes(event.topic)
    ) {
      this.ingressHistory.push({ eventId: event.uuid, valid: false, timestamp: Date.now() });
      throw new Error(`Topic ${event.topic} not allowed`);
    }

    // 驗證來源
    if (this.policy.blockedSources.includes(event.source_origin)) {
      this.ingressHistory.push({ eventId: event.uuid, valid: false, timestamp: Date.now() });
      throw new Error(`Source ${event.source_origin} is blocked`);
    }

    // 添加安全標記
    const securedEvent: IBusEvent = {
      ...event,
      lifecycle_path: [
        ...(event.lifecycle_path ?? []),
        {
          stage: 'EMERGED',
          timestamp: Date.now(),
          node: 'gateway-ingress',
        },
      ],
    };

    this.ingressHistory.push({ eventId: event.uuid, valid: true, timestamp: Date.now() });
    return securedEvent;
  }

  /**
   * 安全轉發
   * Hash Lock + Object.freeze()
   */
  async secureForward(event: IBusEvent): Promise<IBusEvent> {
    const locked = await this.hashLock(event);

    // 凍結事件（內層事件與外層封裝皆不可變，確保呼叫端拿到的物件已凍結）
    Object.freeze(locked.event);
    return Object.freeze(locked) as unknown as IBusEvent;
  }

  /**
   * Hash Lock 鎖定
   * 計算事件哈希並鎖定
   */
  async hashLock(event: IBusEvent): Promise<LockedEvent> {
    const lockHash = createHash('sha256')
      .update(JSON.stringify(event))
      .digest('hex');

    return {
      event,
      lockHash,
      lockedAt: Date.now(),
      frozen: false,
    };
  }

  /**
   * 戒嚴控制
   */
  onMartialLaw(reason: string): void {
    this.martialLawActive = true;
    this.martialLawReason = reason;
    this.martialLawActivatedAt = Date.now();
    Object.assign((this as any).evidence, { martial_law: { reason, activatedAt: Date.now() } });
  }

  liftMartialLaw(): void {
    this.martialLawActive = false;
    this.martialLawReason = '';
    this.martialLawActivatedAt = 0;
  }

  isUnderMartialLaw(): boolean {
    return this.martialLawActive;
  }

  /**
   * 安全策略
   */
  securityPolicy(): SecurityPolicy {
    return { ...this.policy };
  }
}

/**
 * OmniGatewayV2 單例工廠
 */
let _instance: OmniGatewayV2 | null = null;

export function getOmniGateway(): OmniGatewayV2 {
  if (!_instance) {
    _instance = new OmniGatewayV2();
  }
  return _instance;
}
