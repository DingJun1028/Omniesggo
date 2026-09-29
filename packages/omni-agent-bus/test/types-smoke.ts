/**
 * served-surface 型別煙霧 (minimal consumer)
 *
 * 存在理由: dist-smoke.mjs 只驗 runtime 匯入，驗不到 package.json 的 `types`
 * 欄位是否真的可被**外部** consumer 的 tsc 解析。`types` 欄位壞掉時 runtime
 * 全綠（node 不讀 .d.ts），但任何 import 此 package 的 TS 檔都會紅。
 * 這是 dependency/build metadata 改動最典型的「本機全綠、CI 紅燈」缺口。
 *
 * 刻意 import '../dist/index.js'（相對於 package 根），而非 '@esggo/omni-agent-bus'：
 * 走 package name 需依賴 workspace symlink 與 self-reference 解析設定，
 * 相對路徑直接指向 consumer 實際拿到的 dist 面。
 *
 * 驗證方式: tsc -p tsconfig.types-smoke.json（noEmit，只驗型別）。
 * 若 dist/index.d.ts 未匯出下列任一型別 → TS2305 紅燈。
 *
 * 5T-Traceable: 本檔曾抓到真實缺陷 —— bus5TGate 公開回傳型別含
 *   FiveTDimension[]，但該型別當時未 export（consumer 無法標註該欄位型別）。
 *   修正見 src/bus.ts 的 `export type FiveTDimension`。
 */
import type {
  BusHandler,
  BusMessage,
  FiveTDimension,
  IComponentCore,
  OATaskResult,
  OAFrameworkModule,
  SubFrameId,
} from '../dist/index.js';
import { OmniAgentBus, bus5TGate, createBus } from '../dist/index.js';

/** 型別存在性斷言: dist/index.d.ts 未匯出即報 TS2305/TS2724 */
type AssertsAllTypesExist = [
  BusHandler,
  BusMessage,
  FiveTDimension,
  IComponentCore,
  OATaskResult,
  OAFrameworkModule,
  SubFrameId,
];

export function typeSurfaceSmoke(): {
  exportsOk: true;
  failed: readonly FiveTDimension[];
  subFrame: SubFrameId;
} {
  // 驗證 5T 閘的型別簽章: 回傳 failed 欄位必須可被命名為 FiveTDimension[]
  const result: OATaskResult = {
    uuid: 'consumer-test',
    version: '0.1.0',
    timestamp: Date.now(),
    subFrame: 'adk',
    output: 'x'.repeat(210),
    t5: {
      traceable: true, trackable: true, tangible: true,
      transparent: true, trustworthy: true,
    },
    hashLock: 'a'.repeat(64),
  };
  const gate = bus5TGate(result);

  // 這行是本檔的核心斷言: failed 若無法標註型別 → TS2742/TS2305
  const failed: FiveTDimension[] = gate.failed;

  // 驗證總線型別面（dist 面，非僅 runtime）
  const bus = createBus(true);
  const instance: OmniAgentBus = bus;

  return { exportsOk: true, failed, subFrame: result.subFrame };
}
