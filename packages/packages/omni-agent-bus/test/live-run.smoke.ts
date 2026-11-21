/**
 * OmniAgentBus 實機運行測試 (圓通扇出 / 無礙閘門 / 無作語義)
 *
 * 涵蓋 bus.ts 中明確寫在程式碼裡的設計承諾:
 *   - 事件訂閱 / 發佈 / 取消訂閱
 *   - 5T 閘區過濾: 未過閘者轉 .rejected 且不向下游廣播
 *   - 逐維度 failed 映射: 每個 GATE_PATTERNS 分支都可被單獨驗證
 *   - setGate 開關: 閘門暫停時攔截件仍廣播, 恢復後重新攔截
 *   - 無作: 無 handler 靜默略過 / 重複註冊去重 / 單 handler 拋錯不中斷總線
 */
import { createBus, bus5TGate } from '../src/index.js';
import type { BusMessage, OATaskResult } from '../src/index.js';
import { makeResult, COMPLIANT_OUTPUT, REJECTED_OUTPUT, defeatsOnly, KEYWORD_TOKENS, withOnlyToken } from './fixtures/five-t.js';

const DIMS = ['traceable', 'transparent', 'tangible', 'trustworthy', 'trackable'] as const;

function ok(cond: boolean, what: string, detail = ''): void {
  if (!cond) throw new Error(`斷言失敗: ${what}${detail ? ' — ' + detail : ''}`);
}

async function main() {
  const bus = createBus(true);

  // ── 1. 事件訂閱 / 發佈 / 取消訂閱 ──
  let received = 0;
  const handler = (): void => { received++; };
  bus.subscribe('agent:task', handler);
  for (const id of ['T-001', 'T-002', 'T-003']) {
    await bus.publish('agent:task', 'live-runner', { id });
  }
  ok(received === 3, '訂閱期間應收到 3 筆', `實際 ${received}`);
  bus.unsubscribe('agent:task', handler);
  await bus.publish('agent:task', 'live-runner', { id: 'T-004' });
  ok(received === 3, '取消訂閱後不應再投遞', `實際 ${received}`);

  // ── 2. 5T 閘區過濾 ──
  let downstream = 0;
  let rejected = 0;
  let rejectedTopic = '';
  bus.subscribe('result:deploy', () => { downstream++; });
  bus.subscribe('result:deploy.rejected', (m: BusMessage) => {
    rejected++;
    rejectedTopic = m.topic;
  });

  const good = makeResult(COMPLIANT_OUTPUT);
  const bad = makeResult(REJECTED_OUTPUT);
  const r1 = await bus.publish('result:deploy', 'live-runner', good);
  const r2 = await bus.publish('result:deploy', 'live-runner', bad);

  ok(downstream === 1, '過閘訊息應向下游廣播 1 次', `實際 ${downstream}`);
  ok(rejected === 1, '未過閘應轉 .rejected 1 次', `實際 ${rejected}`);
  ok(r1.passedGate === true, '通過件 passedGate 應為 true', String(r1.passedGate));
  ok(r2.passedGate === false, '攔截件 passedGate 應為 false', String(r2.passedGate));
  // bus.ts:77 以 {...msg} 轉發, 故被拒訊息的 topic 仍是原主題
  ok(rejectedTopic === 'result:deploy', 'rejected 轉發保留原 topic', rejectedTopic);

  // ── 3. 逐維度 failed 映射 (守住 GATE_PATTERNS 每個分支) ──
  const gGood = bus5TGate(good);
  ok(gGood.pass, '合規輸出應過閘', `failed=[${gGood.failed.join(',')}]`);
  const gBad = bus5TGate(bad);
  ok(gBad.failed.length === 5, '「做完了。」應五維全滅', `failed=[${gBad.failed.join(',')}]`);
  for (const dim of DIMS) {
    const sample = defeatsOnly(dim);
    const g = bus5TGate(makeResult(sample));
    ok(
      g.failed.length === 1 && g.failed[0] === dim,
      `僅移除 ${dim} 關鍵詞應只失敗該維度`,
      `len=${sample.length} failed=[${g.failed.join(',')}]`,
    );
  }

  // ── 3b. 逐關鍵詞分支覆蓋 (mutation test 實證: 正則退化必須被這層抓到) ──
  // 每個 token 各建一個「僅靠它滿足該維度」的樣本, 任一分支被移除即轉紅。
  let tokenCount = 0;
  for (const dim of DIMS) {
    for (const token of KEYWORD_TOKENS[dim]) {
      const g = bus5TGate(makeResult(withOnlyToken(dim, token)));
      ok(
        !g.failed.includes(dim),
        `${dim} 僅憑關鍵詞「${token}」應判定為通過`,
        `failed=[${g.failed.join(',')}]`,
      );
      tokenCount++;
    }
  }

  // ── 4. setGate 開關 (閘門暫停時攔截件應直接廣播) ──
  let bypassed = 0;
  let bypassRejected = 0;
  bus.subscribe('result:bypass', () => { bypassed++; });
  bus.subscribe('result:bypass.rejected', () => { bypassRejected++; });

  bus.setGate(false);
  ok(bus.health().gateEnabled === false, 'setGate(false) 應回報閘門停用');
  await bus.publish('result:bypass', 'live-runner', bad);
  ok(bypassed === 1, '閘門停用時未過閘件仍應廣播到下游', `bypassed=${bypassed}`);

  bus.setGate(true);
  ok(bus.health().gateEnabled === true, 'setGate(true) 應回報閘門啟用');
  await bus.publish('result:bypass', 'live-runner', bad);
  ok(bypassed === 1, '閘門恢復後不應再廣播', `bypassed=${bypassed}`);
  ok(bypassRejected === 1, '閘門恢復後應改走 .rejected', `bypassRejected=${bypassRejected}`);

  // ── 5. 無作: 無 handler 靜默略過 ──
  await bus.publish('no:handler:registered', 'live-runner', { x: 1 });
  ok(true, '無 handler 主題發佈不應拋錯');

  // ── 6. 無作: 重複註冊去重 / 單 handler 拋錯不中斷總線 ──
  let dup = 0;
  const dupHandler = (): void => { dup++; };
  bus.subscribe('dup:topic', dupHandler);
  bus.subscribe('dup:topic', dupHandler); // 同一函式參考 → Set 去重
  let survived = 0;
  bus.subscribe('dup:topic', () => { throw new Error('故意拋錯'); });
  bus.subscribe('dup:topic', () => { survived++; });
  await bus.publish('dup:topic', 'live-runner', {});
  ok(dup === 1, '同一 handler 重複註冊應去重為 1 次投遞', `實際 ${dup}`);
  ok(survived === 1, '單 handler 拋錯不應中斷其他 handler', `實際 ${survived}`);

  // ── 7. 健康檢查 ──
  // 注意: bus.ts:61 的 unsubscribe 只從 Set 刪 handler, Map 的 key 仍保留,
  // 故 topics 含已無 handler 的 agent:task。已註冊主題為 6, 有效 handler 主題為 5。
  const h = bus.health();
  ok(h.gateEnabled === true, '最終閘門應為啟用');
  ok(h.topics === 6, '應註冊 6 個主題(含已退訂的 agent:task)', `實際 ${h.topics}`);

  console.log('OMNI_AGENT_BUS_LIVE_OK');
  console.log('  received =', received, '| downstream =', downstream, '| rejected =', rejected);
  console.log('  bypassed =', bypassed, '| bypassRejected =', bypassRejected);
  console.log('  逐維度 failed 映射 = 5/5 正確');
  console.log('  bus health =', JSON.stringify(h));
}

main().catch((e) => { console.error('BUS_FAIL:', e.message); process.exit(1); });
