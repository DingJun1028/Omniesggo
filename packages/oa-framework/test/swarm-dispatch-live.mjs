// 模擬蜂群 26/27/30 蜂 (binds: tencent-mem) 經 orchestrator.dispatch → 真寫入 memory
import { TencentMemAdapter } from '../src/adapters/tencent-mem.ts';

const adapter = new TencentMemAdapter({
  memoryGateway: process.env.TDAI_GATEWAY_URL || 'http://127.0.0.1:8420',
});

const task = {
  id: 'swarm-26-tracking',
  prompt: '萬能追蹤蜂: 監控競品動態並確認數據可溯源',
  routeTo: ['tencent-mem'],
};

const r = await adapter.dispatch(task);
console.log('dispatch output:', r.output);
console.log(r.output.includes('saved=yes') ? 'SWARM_DISPATCH_PASS' : 'SWARM_DISPATCH_FAIL');
