/**
 * OA 深貫廣通 smoke — 驗證 chain(深貫) + attachBus(廣通) + broadcastSwarm(30 蜂群)
 * 執行: npx tsx test/deep-connect.smoke.ts
 *
 * 不依賴真實 LLM / docker: 用本地可達 adapter (crewai 走 venv 物件建構,
 * openmontage/omniroute/turbovec 走 scaffold 降級), 其餘並行 dispatch 逾期即 graceful。
 */
import { createOAFrame, OA_SUBFRAMES, SWARM_NODES, swarmTopic, nodesByArray } from '../src/index.js';

// 輕量總線模擬 (對齊 OmniAgentBus publish 簽名, 但本地不依賴 OAB 套件)
const published: { topic: string; source: string; subFrame?: string }[] = [];
const mockBus = (topic: string, source: string, payload: unknown) => {
  const subFrame = (payload as any)?.subFrame;
  published.push({ topic, source, subFrame });
};

async function main() {
  const oa = createOAFrame({ llmModel: 'qwen2.5:3b-64k', llmBaseUrl: 'http://localhost:11434/v1', llmApiKey: '***' });
  oa.attachBus(mockBus); // 廣通: 注入總線

  console.log('=== 深貫廣通啟動 ===');
  console.log('註冊子框架:', OA_SUBFRAMES.length, '| 蜂群節點:', SWARM_NODES.length);

  // --- 深貫鏈: crewai(草稿) → openmontage(視覺) → tencent-mem(記憶) ---
  console.log('\n=== 深貫鏈 chain(crewai→openmontage→tencent-mem) ===');
  const chainTask = { id: 'deep1', prompt: 'ESG 報告骨架', input: '初始素材' };
  const chainRes = await oa.chain(chainTask as any, ['crewai', 'openmontage', 'tencent-mem'] as any);
  console.log('  深貫跳數:', chainRes.length);
  for (const r of chainRes) {
    console.log(`    [${r.subFrame}] output_len=${r.output.length} t5=${r.t5.traceable && r.t5.trackable && r.t5.tangible && r.t5.transparent && r.t5.trustworthy}`);
  }
  const chainTopics = published.filter((p) => p.topic.startsWith('oa.chain.')).map((p) => p.topic);
  console.log('  深貫廣播主題:', chainTopics.length, chainTopics.join(','));

  // --- 廣通: 並行 run 後自動 publish 到 oa.pipeline.<subFrame> ---
  console.log('\n=== 廣通 run → 總線廣播 ===');
  const publishedBefore = published.length;
  const task = { id: 'broad1', prompt: '廣通測試', routeTo: ['crewai', 'openmontage', 'turbovec'] as any };
  await oa.run(task as any);
  const pipelineTopics = published.slice(publishedBefore).map((p) => p.topic);
  console.log('  廣播主題:', pipelineTopics.length, pipelineTopics.join(','));

  // --- 30 蜂群廣播 (對齊 soul.md 30 Souls Matrix) ---
  console.log('\n=== 30 蜂群廣播 (陣列級) ===');
  const pubBeforeSwarm = published.length;
  oa.broadcastSwarm('guard', { msg: '品質檢核' });
  const swarmTopics = published.slice(pubBeforeSwarm).map((p) => p.topic);
  console.log('  守衛陣列廣播數:', swarmTopics.length, '(應=6)');
  console.log('  範例主題:', swarmTopic(27), swarmTopic(30));
  console.log('  策略陣列節點數:', nodesByArray('strategy').length, '(應=6)');

  // --- 驗證 ---
  const swarmOk = SWARM_NODES.length === 30 && swarmTopics.length === 6 && nodesByArray('strategy').length === 6;
  const chainOk = chainRes.length === 3 && chainRes.every((r) => r.output.length > 0);
  const busOk = pipelineTopics.length > 0 && chainTopics.length === 3;

  console.log('\n=== 結果 ===');
  console.log('  深貫鏈 ok:', chainOk);
  console.log('  廣通總線 ok:', busOk);
  console.log('  30 蜂群映射 ok:', swarmOk);
  console.log('RESULT:', swarmOk && chainOk && busOk ? 'DEEP_CONNECT_OK' : 'DEEP_CONNECT_PARTIAL');
  process.exit(0);
}

main().catch((e) => {
  console.error('DEEP_CONNECT_FAIL:', e);
  process.exit(1);
});
