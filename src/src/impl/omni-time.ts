import { randomUUID } from 'crypto';

export type Snapshot = {
  readonly id: string;
  readonly state: Record<string, unknown>;
  readonly timestamp: number;
};

export class OmniTime {
  private readonly snapshots: Map<string, Snapshot[]> = new Map();

  constructor(private readonly maxSnapshots = 256) {}

  snapshot(timelineId: string, state: Record<string, unknown>, timestamp = Date.now()): Snapshot {
    const snap: Snapshot = Object.freeze({
      id: randomUUID(),
      state: Object.freeze({ ...state }),
      timestamp,
    });

    const list = this.snapshots.get(timelineId) ?? [];
    list.push(snap);
    if (list.length > this.maxSnapshots) list.shift();
    this.snapshots.set(timelineId, list);
    return snap;
  }

  replay(timelineId: string, snapshotId?: string): Snapshot | undefined {
    const list = this.snapshots.get(timelineId);
    if (!list || list.length === 0) return undefined;
    if (!snapshotId) return list[list.length - 1];
    return list.find(s => s.id === snapshotId);
  }

  rollback(timelineId: string, beforeTimestamp: number): Snapshot | undefined {
    const list = this.snapshots.get(timelineId);
    if (!list) return undefined;
    const candidates = list.filter(s => s.timestamp <= beforeTimestamp);
    if (candidates.length === 0) return undefined;
    return candidates[candidates.length - 1];
  }
}
