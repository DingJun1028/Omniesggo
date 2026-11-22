/**
 * OmniGateway — 神聖契約 / 核心禁區 (維度四: 安全自癒治理)
 *
 * 唯一對外信任邊界:
 * - ingress: 強制 IComponentCore 契約形狀 (uuid/version/timestamp/source_origin),
 *   缺一即 fail-fast; 戒嚴期間 (martial law) 拒絕一切寫入。
 * - egress: source_origin 強制標註 + egressLock Hash Lock + deepFreeze, 100% 溯源。
 */
import { deepFreeze, egressLock, type EgressSeal } from '@esggo/omni-core';
import { OmniArchError } from './types';
import type { BusEvent } from './types';
import type { OmniHealing } from './healing';

export class OmniGateway {
  constructor(private readonly healing: OmniHealing) {}

  /** 對外入口: 契約形狀驗證 + 戒嚴寫入鎖 + 深凍結 */
  ingress<T extends { uuid: string; version: string; timestamp: number; source_origin: string }>(
    component: T
  ): Readonly<T> {
    if (this.healing.isLocked()) {
      throw new OmniArchError('E_MARTIAL_LAW', `戒嚴中 (${this.healing.lockReason()}), 拒絕寫入`);
    }
    for (const field of ['uuid', 'version', 'timestamp', 'source_origin'] as const) {
      const value = component[field];
      if (value === undefined || value === null || value === '') {
        throw new OmniArchError('E_CONTRACT_SHAPE', `入口契約缺 ${field} 欄位, 拒絕放行`);
      }
    }
    return deepFreeze(component);
  }

  /** 對外出口: source_origin 溯源標註 + Hash Lock 封裝 */
  egress(event: BusEvent, sourceOriginOverride?: string): EgressSeal<BusEvent> {
    const stamped: BusEvent = sourceOriginOverride
      ? { ...event, source_origin: sourceOriginOverride }
      : event;
    if (stamped.source_origin === '') {
      throw new OmniArchError('E_MISSING_ORIGIN', '出口事件必須標註 source_origin (100% 溯源)');
    }
    return egressLock(stamped, 'ISO-14064-1');
  }
}