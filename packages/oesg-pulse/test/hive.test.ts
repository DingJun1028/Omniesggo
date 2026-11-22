import { describe, expect, it } from 'vitest';
import { OmniArch, OmniArchError } from '@esggo/omni-arch';
import { OesgPulseEngine } from '../src/engine';
import { tenderSweep } from '../src/hive';
import { PulseError, type PulsePeriod, type PulseSource, type PulseTick } from '../src/types';

const period: PulsePeriod = { start: 0, end: 1000 };

const makeSource = (): PulseSource => ({
  id: 'src-electricity',
  label: '電力',
  read: async () => [
    { scope: 'S2', sourceId: 'grid-tw', activity: 1200, unit: 'kWh', factor: 0.509, takenAt: 100 },
  ],
});

describe('PulseHive 蜂巢競標 × 脈動調度', () => {
  it('最高分競標者得標執行 sweep; 得標軌跡上總線可追溯', async () => {
    const arch = OmniArch.germinate();
    const seen: string[] = [];
    arch.wire.bus.subscribe('hive.awarded', (event) => {
      seen.push((event.payload as { winnerId: string }).winnerId);
    });
    const written: Readonly<PulseTick>[] = [];
    const engine = new OesgPulseEngine(arch.wire, {
      orgId: 'org-tw',
      sources: [makeSource()],
      sinks: [{ id: 'sink-mem', write: async (tick) => { written.push(tick); } }],
    });

    let backupRan = false;
    const { tick, award } = await tenderSweep(arch.wire, period, [
      { id: 'sweep-primary', score: 10, note: '主掃描策略', sweep: (p) => engine.sweep(p) },
      {
        id: 'sweep-backup',
        score: 5,
        sweep: async () => {
          backupRan = true;
          return {} as Readonly<PulseTick>;
        },
      },
    ]);

    expect(Math.abs(tick.totalKgCo2e - 610.8)).toBeLessThan(1e-6);
    expect(tick.verified).toBe(true);
    expect(backupRan).toBe(false);
    expect(award.winnerId).toBe('sweep-primary');
    expect(award.winningScore).toBe(10);
    expect(award.bids).toHaveLength(2);
    expect(seen).toEqual(['sweep-primary']);
    expect(written).toHaveLength(1);
  });

  it('無競標者 → E_PULSE_HIVE_NO_BIDDER fail-fast', async () => {
    const arch = OmniArch.germinate();
    await expect(tenderSweep(arch.wire, period, [])).rejects.toThrowError(PulseError);
  });

  it('重複 bidder id → 蜂巢入伍 MECE 拒絕', async () => {
    const arch = OmniArch.germinate();
    const bidder = {
      id: 'sweep-dup',
      score: 1,
      sweep: async () => ({}) as Readonly<PulseTick>,
    };
    await expect(tenderSweep(arch.wire, period, [bidder, bidder])).rejects.toThrowError(OmniArchError);
  });
});
