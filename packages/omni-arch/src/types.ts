/**
 * types — 12大萬能架構共用型別
 *
 * 四大維度 (MECE):
 *   physical  物理空間與記憶: OmniBase / OmniMemory / OmniTime
 *   semantic  邊界實體語義:  OmniComponent / OmniTag / OmniEvidence
 *   dynamic   動態驅動通訊:  OmniAgent / OmniAPI / OmniBus
 *   governance 安全自癒治理: OmniGateway / OmniHealing / OmniEvolution
 */
import { randomUUID } from 'node:crypto';

export type OmniDimension = 'physical' | 'semantic' | 'dynamic' | 'governance';

/** 萬能主題三視覺狀態: 液態玻璃 / 戒嚴鎖定 / 星辰輝煌 */
export type ThemeState = 'LiquidGlass' | 'MartialLock' | 'CelestialGlow';

export const MODULE_IDS = [
  'OmniBase',
  'OmniMemory',
  'OmniTime',
  'OmniComponent',
  'OmniTag',
  'OmniEvidence',
  'OmniAgent',
  'OmniAPI',
  'OmniBus',
  'OmniGateway',
  'OmniHealing',
  'OmniEvolution',
] as const;

export type ModuleId = (typeof MODULE_IDS)[number];

/** 架構級錯誤 (fail-fast, 攜帶穩定錯誤碼) */
export class OmniArchError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'OmniArchError';
    this.code = code;
  }
}

/** 總線事件契約 (對齊 @esggo/omni-core LockableEvent 子集, 供 egressLock 封裝) */
export interface BusEvent {
  readonly uuid: string;
  readonly version: string;
  readonly timestamp: number;
  readonly source_origin: string;
  readonly topic: string;
  payload: unknown;
  evidence?: Record<string, unknown>;
}

/** 事件工廠: 任何進入總線/閘道的載荷必須實現 IComponentCore 欄位 (OAB 契約) */
export function mintEvent(
  source_origin: string,
  topic: string,
  payload: unknown,
  partial: Partial<Pick<BusEvent, 'uuid' | 'version' | 'timestamp'>> = {}
): BusEvent {
  return {
    uuid: partial.uuid ?? randomUUID(),
    version: partial.version ?? '1.0.0',
    timestamp: partial.timestamp ?? Date.now(),
    source_origin,
    topic,
    payload,
  };
}