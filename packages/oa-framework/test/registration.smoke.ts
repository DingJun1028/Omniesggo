import assert from 'node:assert/strict';
import { createOAFrame, OA_SUBFRAMES, SWARM_NODES, verify5T } from '../src/index.js';
const expected = ['adk', 'agent0', 'crewai', 'agentreach', 'deerflow', 'tencent-mem', 'openmontage', 'omniroute', 'turbovec', 'oneringai'];
assert.deepEqual(OA_SUBFRAMES, expected);
assert.equal(new Set(OA_SUBFRAMES).size, 10);
assert.equal(SWARM_NODES.length, 30);
assert.deepEqual(SWARM_NODES.filter(n => n.binds.length === 0).map(n => n.id), [3, 11, 21]);
for (const node of SWARM_NODES) {
  for (const id of node.binds) assert.ok(OA_SUBFRAMES.includes(id), `Invalid binding: ${id}`);
}
const oa = createOAFrame();
for (const id of OA_SUBFRAMES) {
  oa.register({
    id, label: id, runtime: 'ts',
    bootstrap: async () => ({ ok: true }),
    dispatch: async task => ({ output: `${id}: ${task.prompt}` }),
    health: async () => ({ status: 'ok' }),
  });
}
const results = await oa.run({ id: 'offline-registration', prompt: '離線註冊與 5T 回歸驗證' }, 100);
assert.deepEqual(results.map(r => r.subFrame), expected);
assert.ok(results.every(r => verify5T(r).pass));
assert.deepEqual(Object.keys(await oa.healthAll()), expected);
console.log('ALL_10_REGISTRATIONS_AND_30_SWARM_NODES_OK');
