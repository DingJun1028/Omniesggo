/**
 * OmniAgentBus 圓通扇出測試 (無上限分身擴增)
 *
 * 驗證總線對「分身數量」與「事件流量」皆無硬編碼上限:
 *   bus.ts:46 的 handlers 為 Map<string, Set<BusHandler>>, 全檔無數量上限常數,
 *   分身數僅受記憶體與單一 handler 延遲限制。
 *
 * ⚠️ 5T 閘的粒度 (對應 bus.ts:72 的實作, 勿誤述):
 *   閘門是「總線級」的單一 gateEnabled 旗標 + 內容級 bus5TGate, 對所有 payload
 *   一視同仁 —— **不存在**「每個分身各自受閘」的性質。本測試驗證的是:
 *   閘門的攔截/放行結果不因分身數量而改變。
 */
import { createBus } from '../src/index.js';
import type { SubFrameId } from '../src/index.js';
import { makeResult, COMPLIANT_OUTPUT, REJECTED_OUTPUT } from './fixtures/five-t.js';

/** types.ts:5-16 定義的 7 個主要 OA 子框架 (id 取自 SubFrameId 聯集, 非 README 的簡寫) */
const SUB_FRAMES = ['adk', 'genkit', 'agent0', 'crewai', 'agentreach', 'deerflow', 'tencent-mem'] as const satisfies readonly SubFrameId[];

/** 壓力事件數, 可由環境變數覆寫以利 CI 調整 */
const N = Number(process.env.BUS_STRESS_EVENTS ?? 500);

/** 扇出耗時上限 (ms) — 防止未來有人無聲膨脹壓力測試規模 */
const TIME_BUDGET_MS = 5000;

function ok(cond: boolean, what: string, detail = ''): void {
  if (!cond) throw new Error(`斷言失敗: ${what}${detail ? ' — ' + detail : ''}`);
}

async function main() {
  const bus = createBus(true);

  // ── 1. 掛載 7 子框架 + 30 蜂群 = 37 分身 ──
  const clones: string[] = [
    ...SUB_FRAMES.map((f) => `frame:${f}`),
    ...Array.from({ length: 30 }, (_, i) => `bee:${String(i + 1).padStart(2, '0')}`),
  ];

  const inbox = new Map<string, number>();
  const topic = 'oa.produce';
  for (const name of clones) {
    inbox.set(name, 0);
    bus.subscribe(topic, () => {
      inbox.set(name, (inbox.get(name) ?? 0) + 1);
    });
  }

  // ── 2. 圓通扇出: 單一事件廣播至所有分身 ──
  let rejected = 0;
  bus.subscribe(`${topic}.rejected`, () => { rejected++; });
  await bus.publish(topic, 'orchestrator', makeResult(COMPLIANT_OUTPUT));
  ok(rejected === 0, '合規產出不應被閘門攔截', `rejected=${rejected}`);

  const fanoutOk = [...inbox.values()].every((v) => v === 1);
  const unreachable = [...inbox.entries()].filter(([, v]) => v !== 1);
  ok(fanoutOk, `${clones.length} 個分身皆應各收到 1 次`,
    `偏離者: ${unreachable.map(([k, v]) => `${k}=${v}`).join(',') || '無'}`);

  // ── 3. 流量壓力: N 事件 × 全部分身 ──
  const t0 = Date.now();
  for (let i = 0; i < N; i++) {
    await bus.publish(topic, 'orchestrator', { seq: i });
  }
  const ms = Date.now() - t0;
  ok(ms < TIME_BUDGET_MS, `扇出 ${N * clones.length} 次投遞耗時應 < ${TIME_BUDGET_MS}ms`, `實測 ${ms}ms`);

  // ── 4. 無上限擴增: 執行中動態追加 200 分身 ──
  for (let i = 0; i < 200; i++) {
    const name = `clone:${i}`;
    inbox.set(name, 0);
    bus.subscribe(topic, () => { inbox.set(name, (inbox.get(name) ?? 0) + 1); });
  }
  await bus.publish(topic, 'orchestrator', { seq: 'post-expand' });

  const total = clones.length + 200;
  ok(inbox.size === total, `總分身應為 ${total}`, `實際 ${inbox.size}`);
  // 逐分身等值檢查: 追加者只收到擴增後那 1 筆; 原 37 位收到
  // 扇出 1 + 壓力 N + 擴增後 1 = N + 2 筆
  const baseExpected = N + 2;
  const expandOnly = new Set([...inbox.keys()].filter((k) => k.startsWith('clone:')));
  const wrongExpand = [...expandOnly].filter((k) => inbox.get(k) !== 1);
  const wrongBase = [...inbox.entries()].filter(([k, v]) => !expandOnly.has(k) && v !== baseExpected);
  ok(wrongExpand.length === 0, '追加的 200 分身各應收到 1 次',
    `偏離: ${wrongExpand.length} 個`);
  ok(wrongBase.length === 0, `原 ${clones.length} 分身各應收到 ${baseExpected} 次`,
    `偏離: ${wrongBase.map(([k, v]) => `${k}=${v}`).join(',')}`);

  // ── 5. 無礙一致: 閘門攔截不因分身數量而改變 ──
  const rejectedBefore = rejected;
  await bus.publish(topic, 'orchestrator', makeResult(REJECTED_OUTPUT));
  ok(rejected === rejectedBefore + 1, '未過閘產出應轉 .rejected', `rejected=${rejected}`);
  // 攔截後所有分身的計數應維持不變 (無人被投遞)
  const drifted = [...inbox.entries()].filter(([k, v]) =>
    v !== (expandOnly.has(k) ? 1 : baseExpected));
  ok(drifted.length === 0, '未過閘產出不應有任何分身收到',
    `偏離: ${drifted.map(([k, v]) => `${k}=${v}`).join(',')}`);
  const totalDeliveries = [...inbox.values()].reduce((a, b) => a + b, 0);

  const h = bus.health();
  console.log('INFINITE_CLONES_OK');
  console.log(`  clones = ${clones.length} → ${total} (7 子框架 + 30 蜂群 + 200 追加)`);
  console.log(`  fanout = ${total} 分身 × ${N} 事件, ${ms}ms (budget ${TIME_BUDGET_MS}ms)`);
  console.log(`  total deliveries = ${totalDeliveries} | rejected = ${rejected}`);
  console.log(`  bus health = ${JSON.stringify(h)}`);
}

main().catch((e) => { console.error('BUS_FAIL:', e.message); process.exit(1); });
