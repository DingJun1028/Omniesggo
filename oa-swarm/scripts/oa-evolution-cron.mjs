#!/usr/bin/env node
/**
 * OA-Team 無限進化 · 每日策略優化 cron
 * 對齊: oa-swarm-operations §21 實戰日課 + soul.md §十一 進化路線圖 Phase 3
 * 5T 互引: Traceable(source_origin) / Trustworthy(freeze)
 *
 * 行為: 從 TDAI 讀取歷史經驗 → 生成策略優化報告 → 寫回 TDAI (演化軌跡)
 */
import { readFileSync } from 'node:fs';
import { OABClient } from './oa-swarm/src/oab.ts';

const SOURCE_ORIGIN = 'oa-swarm/evolution-cron';

function adminKey(): string {
  try { return readFileSync('/opt/esggo/apps/tencentdb-memory/.admin-key', 'utf-8').trim(); }
  catch { return process.env.OAB_ADMIN_KEY || ''; }
}

async function main() {
  const oab = new OABClient();
  const history = await oab.query(100);
  const lessons = history.filter((h) => h.task.startsWith('[EVOLUTION]'));
  const total = lessons.length;
  if (total === 0) {
    console.log('[EVOLUTION-CRON] 尚無經驗沉澱, 跳過');
    return;
  }
  // 簡單統計: 成功/失敗比 + 平均熵趨勢
  let success = 0, failure = 0;
  for (const l of lessons) {
    try {
      const j = JSON.parse(l.task.replace('[EVOLUTION] ', ''));
      if (j.outcome === 'success') success++;
      else if (j.outcome === 'failure') failure++;
    } catch { /* ignore parse */ }
  }
  const report = {
    date: new Date().toISOString().slice(0, 10),
    totalLessons: total,
    successRate: (success / total).toFixed(2),
    failureRate: (failure / total).toFixed(2),
    recommendation: success / total > 0.8
      ? '維持當前策略權重, 熵減穩定'
      : '提高 5t-strict 權重, 強化驗算閘',
    source_origin: SOURCE_ORIGIN,
  };
  console.log('[EVOLUTION-CRON] 策略報告:', JSON.stringify(report));
  // 寫回 TDAI 作為演化軌跡 (供下次 bootstrap 參考)
  await oab.publish({
    id: `evo_report_${Date.now()}`,
    from: 0,
    to: 'tdai-memory',
    channel: 'evolution-report',
    payload: { _content: `[EVOLUTION-REPORT] ${JSON.stringify(report)}` },
    ts: Date.now(),
  });
  console.log('[EVOLUTION-CRON] 報告已沉澱 TDAI');
}

main().catch((e) => { console.error('[EVOLUTION-CRON] error', e.message); process.exit(1); });
