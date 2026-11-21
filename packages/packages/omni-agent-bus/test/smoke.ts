/**
 * OmniAgentBus 冒煙測試
 * 1. 註冊 handler 收訊
 * 2. 發佈過閘的 OATaskResult → 應廣播到 topic
 * 3. 發佈未過閘的短字串 → 應轉 .rejected, 不廣播
 */
import { createBus, bus5TGate } from '../src/index.js';
import type { OATaskResult } from '../src/index.js';

function makeResult(output: string, subFrame: OATaskResult['subFrame']): OATaskResult {
  return {
    uuid: `${subFrame}-test`,
    version: '0.1.0',
    timestamp: Date.now(),
    subFrame,
    output,
    t5: { traceable: true, trackable: true, tangible: true, transparent: true, trustworthy: true },
    hashLock: 'a'.repeat(64),
  };
}

const GOOD = [
  '【來源/source_origin】OA-Team 子框架 adk | 引用 soul.md 5T 協議',
  '【透明/揭露】合規率 100% | 熵減目標 < 0.1',
  '【量化/達成】已完成 adk 產出鑄造，建立可追溯元件 1 項',
  '【信任/封印】SHA-256 Hash Lock 寫入即凍結，審計軌跡 audit trail',
  '【追蹤/期間】2026 年度 | 日期 2026-08-07 | lifecycle monitor 啟用',
  '原始產出: adk ok',
].join('\n');

const BAD = 'short';

async function main() {
  const bus = createBus(true);
  let received = 0;
  let rejected = 0;
  bus.subscribe('oa.produce', () => { received++; });
  bus.subscribe('oa.produce.rejected', () => { rejected++; });

  const gGood = bus5TGate(makeResult(GOOD, 'adk'));
  const gBad = bus5TGate(makeResult(BAD, 'adk'));
  if (!gGood.pass) throw new Error('GOOD 應過閘, 實際: ' + JSON.stringify(gGood));
  if (gBad.pass) throw new Error('BAD 應擋下, 實際卻過閘');

  await bus.publish('oa.produce', 'orchestrator', makeResult(GOOD, 'adk'));
  await bus.publish('oa.produce', 'orchestrator', makeResult(BAD, 'adk'));

  if (received !== 1) throw new Error(`過閘訊息應廣播 1 次, 實際 ${received}`);
  if (rejected !== 1) throw new Error(`未過閘應轉 rejected 1 次, 實際 ${rejected}`);

  console.log('OMNI_AGENT_BUS_OK');
  console.log('  gate good.pass =', gGood.pass);
  console.log('  gate bad.pass  =', gBad.pass);
  console.log('  received =', received, '| rejected =', rejected);
  console.log('  bus health =', JSON.stringify(bus.health()));
}

main().catch((e) => { console.error('BUS_FAIL:', e.message); process.exit(1); });
