/**
 * OESG-Pulse 型別契約 — 碳排脈動 (OESG 五路線圖首站)
 *
 * MECE 邊界:
 * - PulseReading: 單筆活動數據 (電表/燃料/冷媒等原始清冊, A06「始」)
 * - PulseTick: 一次脈動的封存結晶 (彙總 + 驗算 + 溯源, A06「合」)
 * - PulseSource / PulseSink: 可插拔邊界 (讀取來源 / 寫出埠), 與 NCB/Supabase 解耦
 */
export type CarbonScope = 'S1' | 'S2' | 'S3';

export type ActivityUnit = 'kWh' | 'L' | 'kg';

/** 活動數據讀值: 活動量 × 排放係數 之原始輸入 (ISO-14064-1 activity_data) */
export interface PulseReading {
  readonly scope: CarbonScope;
  readonly sourceId: string;
  readonly activity: number;
  readonly unit: ActivityUnit;
  readonly factor: number;
  readonly takenAt: number;
}

/** 單範疇彙總排放量 (kgCO2e) */
export interface ScopeEmission {
  readonly scope: CarbonScope;
  readonly kgCo2e: number;
}

/** 脈動封存結晶: 對齊 IComponentCore 欄位 (uuid/version/timestamp/source_origin) */
export interface PulseTick {
  readonly uuid: string;
  readonly version: string;
  readonly timestamp: number;
  readonly source_origin: string;
  readonly orgId: string;
  readonly periodStart: number;
  readonly periodEnd: number;
  readonly readings: readonly PulseReading[];
  readonly emissions: readonly ScopeEmission[];
  readonly totalKgCo2e: number;
  readonly verified: boolean;
  readonly attestationHash: string;
  readonly failures: readonly PulseSinkFailure[];
}

/** 寫出埠失敗結晶: sink 失敗不毀 tick, 留痕供自癒復用 (混沌自癒模板語彙) */
export interface PulseSinkFailure {
  readonly sinkId: string;
  readonly error: string;
}

/** 活動數據來源 (可插拔: 靜態/NCB/Supabase/電表 API) */
export interface PulseSource {
  readonly id: string;
  readonly label: string;
  read(): Promise<readonly PulseReading[]>;
}

/** 脈動寫出埠 (可插拔: 記憶體/NCB/Supabase) */
export interface PulseSink {
  readonly id: string;
  write(tick: Readonly<PulseTick>): Promise<void>;
}

/** 脈動期間契約 */
export interface PulsePeriod {
  readonly start: number;
  readonly end: number;
}

export class PulseError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'PulseError';
    this.code = code;
  }
}
