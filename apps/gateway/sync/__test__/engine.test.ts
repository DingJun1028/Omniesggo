// apps/gateway/sync/__test__/engine.test.ts
// 本機單元驗證：不碰 VPS，確認 SyncEngine 雙向合併 / 衝突解決 / OA-Summon 邏輯正確。
import { SyncEngine } from '../sync-engine.js';
import type { ESGGOState, OmniState, AgentState } from '../types.js';

let failures = 0;
function assert(cond: boolean, msg: string): void {
  if (!cond) { console.error('  ✗ FAIL:', msg); failures++; }
  else { console.log('  ✓', msg); }
}

function mkAgent(id: string, hb: number, status: AgentState['status'] = 'online'): AgentState {
  return {
    agentId: id, name: id, host: '127.0.0.1', channel: 'omni', capabilities: ['x'],
    status, registeredAt: hb, lastHeartbeat: hb,
  };
}

function mkEsggo(agents: AgentState[]): ESGGOState {
  return { appVersion: '1.0.0', buildId: 'b1', activeWorkers: agents.length, agents, lastSyncAt: Date.now() };
}
function mkOmni(agents: AgentState[]): OmniState {
  return { gatewayVersion: '3.0.0', platform: 'linux', vpsIp: '161.118.248.180', activeWorkers: agents.length, providers: { openrouter: true }, agents, websocket: { enabled: true, clients: 0 }, skills: { total: 11, transcended: 0 }, lastSyncAt: Date.now() };
}

// ── 1. 雙向狀態合併 ──
console.log('[1] bidirectional state merge');
const eng = new SyncEngine({ originId: 'test' });
eng.ingestEsggo(mkEsggo([mkAgent('a1', 100)]));
eng.ingestOmni(mkOmni([mkAgent('o1', 200)]));
assert(eng.getEsggo()?.agents.length === 1, 'esggo view has 1 agent');
assert(eng.getOmni()?.agents.length === 1, 'omni view has 1 agent');

// ── 2. 衝突解決 (last-write-wins by lastHeartbeat) ──
console.log('[2] conflict resolution');
const eng2 = new SyncEngine({ originId: 'test' });
eng2.ingestOmni(mkOmni([mkAgent('x', 500)]));           // 先: hb=500
eng2.ingestOmni(mkOmni([mkAgent('x', 300)]));           // 後但較舊: hb=300 -> 衝突, 以 500 取勝
const x = eng2.getOmni()?.agents.find((a) => a.agentId === 'x');
assert(x?.lastHeartbeat === 500, 'conflict resolved to newer heartbeat (500)');
assert(eng2.getHealth().conflictsResolved >= 1, 'conflict counted in health');

// ── 3. OA-Summon 標記所有線上代理 ──
console.log('[3] OA-Summon L3');
const eng3 = new SyncEngine({ originId: 'test' });
eng3.ingestEsggo(mkEsggo([mkAgent('a1', 100, 'online'), mkAgent('a2', 101, 'offline')]));
eng3.ingestOmni(mkOmni([mkAgent('o1', 200, 'online')]));
const rite = eng3.summonRitual();
assert(rite.kind === 'summon', 'summon packet emitted');
const ea = eng3.getEsggo()?.agents.find((a) => a.agentId === 'a1');
const oa = eng3.getOmni()?.agents.find((a) => a.agentId === 'o1');
assert(ea?.status === 'summoned' && ea?.awakeningAuth === '萬能覺醒', 'esggo online agent -> summoned + 覺醒');
assert(oa?.status === 'summoned' && oa?.fruitSeal === '萬能果証', 'omni online agent -> summoned + 果証');
const off = eng3.getEsggo()?.agents.find((a) => a.agentId === 'a2');
assert(off?.status === 'offline', 'offline agent NOT summoned');

// ── 4. receive 外部封包 ──
console.log('[4] receive external packet');
const eng4 = new SyncEngine({ originId: 'test' });
const pkt = eng4.receive({ v: 1, from: 'omni', to: 'esggo', kind: 'state', seq: 1, ts: Date.now(), payload: mkOmni([mkAgent('z', 999)]), originId: 'remote' });
assert(pkt !== null, 'valid packet accepted');
assert(eng4.getHealth().packetsRecv === 1, 'packetsRecv incremented');
const bad = eng4.receive({ v: 1, from: 'omni' });  // 缺欄位 -> schema 拒
assert(bad === null, 'malformed packet rejected (typebox)');

// ── 5. health 匯總 ──
console.log('[5] health summary');
const h = eng4.getHealth();
assert(h.connectedNodes.includes('omni'), 'omni node tracked');
assert(h.packetsSent >= 0, 'packetsSent counter present');

console.log(failures === 0 ? '\nALL TESTS PASSED ✓' : `\n${failures} TEST(S) FAILED ✗`);
process.exit(failures === 0 ? 0 : 1);
