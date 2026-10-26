import assert from 'node:assert/strict';
import { createOAFrame, OAOrchestrator, OA_SUBFRAMES, SWARM_NODES, verify5T } from '../src/index.js';

const expected = ['adk', 'agent0', 'crewai', 'agentreach', 'deerflow', 'tencent-mem', 'openmontage', 'omniroute', 'turbovec', 'oneringai'];
assert.deepEqual(OA_SUBFRAMES, expected);
assert.equal(new Set(OA_SUBFRAMES).size, 10);
assert.equal(SWARM_NODES.length, 30);
assert.deepEqual(SWARM_NODES.filter((node) => node.binds.length === 0).map((node) => node.id), [3, 11, 21]);
for (const node of SWARM_NODES) {
  for (const id of node.binds) assert.ok(OA_SUBFRAMES.includes(id), `Invalid binding: ${id}`);
}

const factoryRegistrations: string[] = [];
const originalRegister = OAOrchestrator.prototype.register;
const oa = (() => {
  OAOrchestrator.prototype.register = function (adapter) {
    factoryRegistrations.push(adapter.id);
    return originalRegister.call(this, adapter);
  };
  try { return createOAFrame(); } finally { OAOrchestrator.prototype.register = originalRegister; }
})();
assert.deepEqual(factoryRegistrations, expected, 'createOAFrame must register every expected adapter before stubbing');

for (const id of OA_SUBFRAMES) {
  oa.register({
    id,
    label: id,
    runtime: 'ts',
    bootstrap: () => Promise.resolve({ ok: true }),
    dispatch: (task) => Promise.resolve({ output: `${id}: ${task.prompt}` }),
    health: () => Promise.resolve({ status: 'ok' as const }),
  });
}

const results = await oa.run({ id: 'offline-registration', prompt: '離線註冊與 5T 回歸驗證' }, 100);
assert.deepEqual(results.map((result) => result.subFrame), expected);
assert.ok(results.every((result) => verify5T(result).pass));
assert.deepEqual(Object.keys(await oa.healthAll()), expected);
console.log('ALL_10_REGISTRATIONS_AND_30_SWARM_NODES_OK');
