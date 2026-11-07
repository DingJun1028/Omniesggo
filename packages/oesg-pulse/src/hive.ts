/**
 * PulseHive — 全知蜂巢競標 × OESG-Pulse 脈動調度 (正典 §7 後續編排)
 *
 * 設計哲師 (MECE 不重造輪子):
 *   - 競標語義由 @esggo/omni-arch OmniHive 承擔 (黑板 + 多輪競標 + 得標軌跡);
 *   - 本模組僅做「脈動語義的競標者轉接」: SweepBidder (掃描策略 + 出價)
 *     轉接為 HiveWorker, tenderSweep 負責上板、入伍、競標、回傳結晶。
 *   - 得標軌跡 hive.awarded 由 arch.germinate 預設接線上總線留痕,
 *     脈動由哪個策略執行全程公開可追溯 (Transparent/Trackable)。
 *   - 全員棄標/流標由 OmniHive fail-fast; 本模組僅補「無競標者」邊界。
 *
 * 使用限制 (如實聲明): 同一 wire 之蜂巢為持續入伍制, 重複呼叫
 * tenderSweep 需以不同 bidder id 或新 germinate wire, 否則 E_HIVE_WORKER_DUPLICATE。
 */
import { mintEvent, type ArchWire, type HiveAwardRecord, type HiveWorker } from '@esggo/omni-arch';
import { PulseError, type PulsePeriod, type PulseTick } from './types';

/** 脈動競標者: 出價 + 得標後執行的掃描策略 (如 OesgPulseEngine.sweep) */
export interface SweepBidder {
  readonly id: string;
  readonly score: number;
  readonly note?: string;
  readonly sweep: (period: PulsePeriod) => Promise<Readonly<PulseTick>>;
}

/** 一次脈動競標的結果: 得標者產出之結晶 + 得標軌跡 (可追溯) */
export interface SweepAward {
  readonly tick: Readonly<PulseTick>;
  readonly award: HiveAwardRecord;
}

/** SweepBidder → HiveWorker 轉接: 任務 payload 攜帶 PulsePeriod */
export function createSweepWorker(bidder: SweepBidder): HiveWorker {
  return {
    id: bidder.id,
    bid: () => ({ score: bidder.score, note: bidder.note }),
    execute: async (task) => {
      const payload = task.payload as { period: PulsePeriod };
      return await bidder.sweep(payload.period);
    },
  };
}

/**
 * 脈動競標調度: 上板 (oesg.pulse.tender) → 入伍 → 蜂巢競標 → 得標者執行。
 * 回傳得標者產出之結晶與得標軌跡; 全員棄標由 OmniHive fail-fast。
 */
export async function tenderSweep(
  wire: ArchWire,
  period: PulsePeriod,
  bidders: readonly SweepBidder[]
): Promise<SweepAward> {
  if (bidders.length === 0) {
    throw new PulseError('E_PULSE_HIVE_NO_BIDDER', '至少需要一個脈動競標者, MECE 不漏');
  }
  for (const bidder of bidders) {
    wire.hive.enlist(createSweepWorker(bidder));
  }
  const tick = (await wire.hive.tender(mintEvent('oesg://pulse/hive', 'oesg.pulse.tender', { period }))) as Readonly<PulseTick>;
  const history = wire.hive.tenderHistory();
  return { tick, award: history[history.length - 1] };
}
