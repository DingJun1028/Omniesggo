/**
 * OmniAgentBus 實體部署閘門整合測試
 * 模擬 OA 框架產出 → 總線 5T → deployGate → 落地 / 拒絕
 */
import { createBus, deployGate, bus5TGate } from '../src/index.js';
import type { OATaskResult } from '../src/index.js';

function makeResult(output: string, subFrame: OATaskResult['subFrame']): OATaskResult {
  return {
    uuid: `${subFrame}-deploy`,
    version: '0.1.0',
    timestamp: Date.now(),
    subFrame,
    output,
    t5: { traceable: true, trackable: true, tangible: true, transparent: true, trustworthy: true },
    hashLock: 'a'.repeat(64),
  };
}

const GOOD = [
  '【來源/source_origin】OA-Team 子框架 crewai | 引用 soul.md 5T 協議',
  '【透明/揭露】合規率 100% | 熵減目標 < 0.1',
  '【量化/達成】已完成 crewai 產出鑄造，建立可追溯元件 1 項',
  '【信任/封印】SHA-256 Hash Lock 寫入即凍結，審計軌跡 audit trail',
  '【追蹤/期間】2026 年度 | 日期 2026-08-07 | lifecycle monitor 啟用',
  '原始產出: crewai deploy ok',
].join('\n');
const BAD = 'too short';

async function main() {
  const bus = createBus(true);
  let deployed = 0, rejected = 0, deployCalls = 0;
  bus.subscribe('oa.deploy', () => { deployed++; });
  bus.subscribe('oa.rejected', () => { rejected++; });

  const d1 = await deployGate(bus, 'oa', makeResult(GOOD, 'crewai'), async () => { deployCalls++; });
  if (!d1.deployed) throw new Error('GOOD 應部署, 實際: ' + JSON.stringify(d1));
  if (deployCalls !== 1) throw new Error(`deploy 回調應 1 次, 實際 ${deployCalls}`);

  const d2 = await deployGate(bus, 'oa', makeResult(BAD, 'crewai'), async () => { deployCalls++; });
  if (d2.deployed) throw new Error('BAD 不應部署');
  if (!d2.reason?.includes('5T')) throw new Error('BAD 應回 5T 原因, 實際: ' + d2.reason);

  if (deployed !== 1 || rejected !== 1) {
    throw new Error(`主題計數錯: deployed=${deployed} rejected=${rejected}`);
  }

  console.log('DEPLOY_GATE_OK');
  console.log('  good.deployed =', d1.deployed, '| deployCalls =', deployCalls);
  console.log('  bad.deployed  =', d2.deployed, '| reason =', d2.reason);
  console.log('  bus topics    =', JSON.stringify(bus.health()));
}

main().catch((e) => { console.error('DEPLOY_GATE_FAIL:', e.message); process.exit(1); });
