/**
 * idempotent-replay + state-snapshot 整合測試 (R4 / R5)
 * 驗證: journal 刻印凍結 / 冪等重放零副作用 / 影子測試模式 / 快照隔離
 */
import { IdempotentJournal, wrapIdempotent, StateSnapshotStore } from '../src/index.js';
import type { BusMessage } from '../src/index.js';

function makeMsg(id: string, offsetMs = 0): BusMessage<{ kwh: number }> {
  return {
    id,
    topic: 'esg.ingest',
    source: 'external.iso14064.platform',
    timestamp: Date.now() + offsetMs,
    payload: { kwh: 1200 },
  };
}

async function main() {
  // ── R4: journal 刻印即凍結 ──
  const journal = new IdempotentJournal<{ kwh: number }>();
  const frozen = journal.append(makeMsg('m1', -5000));
  let freezeOk = false;
  try {
    (frozen as { payload: unknown }).payload = { kwh: 0 };
  } catch {
    freezeOk = true; // strict mode 下對凍結件寫入應 throw
  }
  if (!freezeOk) throw new Error('journal 刻印應為深凍結, 寫入未 throw');
  if (frozen.payload.kwh !== 1200) throw new Error('凍結件內容被篡改');

  journal.append(makeMsg('m1', -5000)); // 重複 id
  journal.append(makeMsg('m2', 0));
  if (journal.size() !== 3) throw new Error(`journal.size 應 3, 實際 ${journal.size()}`);
  const dup = journal.duplicateRate();
  if (Math.abs(dup - 1 / 3) > 1e-9) throw new Error(`duplicateRate 應 1/3, 實際 ${dup}`);

  // ── R4: 冪等重放零副作用 ──
  journal.markProcessed('m1');
  journal.markProcessed('m1');
  let skipped = 0;
  const replayed1 = await journal.replay(0, Date.now(), async () => { skipped += 1; });
  if (replayed1 !== 1 || skipped !== 1) {
    throw new Error(`預設重放應僅執行未處理的 m2 (1 筆), 實際 ${replayed1}`);
  }
  const replayed2 = await journal.replay(0, Date.now(), async () => { skipped += 1; });
  if (replayed2 !== 0) throw new Error(`二次重放應零執行 (m2 已處理), 實際 ${replayed2}`);

  // ── R4: 影子測試模式 (reprocessReplayed) ──
  const replayed3 = await journal.replay(0, Date.now(), async () => { skipped += 1; }, { reprocessReplayed: true });
  if (replayed3 !== 3) throw new Error(`影子測試應重放全 3 筆, 實際 ${replayed3}`);

  // ── R4: wrapIdempotent 與總線 handler 相容 ──
  let executed = 0;
  const handler = wrapIdempotent(async () => { executed += 1; });
  const m = makeMsg('m3');
  await handler(m);
  await handler(m);
  if (executed !== 1) throw new Error(`wrapIdempotent 同 id 應僅執行 1 次, 實際 ${executed}`);

  // ── R5: 快照隔離 ──
  const store = new StateSnapshotStore();
  const parentState: { count: number; nested: { deep: boolean } } = { count: 5, nested: { deep: true } };
  const snapId = store.capture('OA-Carbon-1', parentState);
  const childState = store.restore<typeof parentState>(snapId)!;
  parentState.count = 99; // 母體後續變更
  childState.count = 42;  // 分身寫入
  if (parentState.count !== 99) throw new Error('分身寫入污染了母體');
  const reRestored = store.restore<typeof parentState>(snapId)!;
  if (reRestored.count !== 5) throw new Error(`快照應不受母體/分身變更影響, 實際 ${reRestored.count}`);
  if (store.restore('nonexistent') !== undefined) throw new Error('未知快照 id 應回 undefined');
  if (store.size() !== 1) throw new Error(`store.size 應 1, 實際 ${store.size()}`);

  console.log('REPLAY_SNAPSHOT_OK');
  console.log('  journal.size      =', journal.size(), '| duplicateRate =', dup.toFixed(4));
  console.log('  replay skipped    =', replayed1, replayed2, '| shadow =', replayed3);
  console.log('  wrapIdempotent    = executed', executed, '(同 id 2 次呼叫)');
  console.log('  snapshot isolated = true (母體 99 / 分身 42 / 快照 5)');
}

main().catch((e) => { console.error('REPLAY_SNAPSHOT_FAIL:', e.message); process.exit(1); });
