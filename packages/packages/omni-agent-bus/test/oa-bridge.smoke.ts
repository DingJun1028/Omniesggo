/**
 * OmniAgentBus × OA Framework 跨包整合測試
 * 驗證: oa-framework 未 build 時 oaToBusPipeline 優雅降級 (available:false, 不假造產出)
 */
import { createBus, oaToBusPipeline, loadOAFramework } from '../src/index.js';

async function main() {
  const bus = createBus(true);
  let deployCalls = 0;      // 實際落地 (deploy 回調)
  let deployEvents = 0;     // 總線廣播事件 (oa.deploy 主題)
  bus.subscribe('oa.deploy', () => { deployEvents++; });
  bus.subscribe('oa.rejected', () => {});

  // 偵測 oa-framework 是否可載入 (本環境 workspace 未 build 應為 null)
  const oa = await loadOAFramework();
  console.log('oa-framework 載入:', oa ? 'AVAILABLE' : 'UNAVAILABLE (預期 graceful)');

  const r = await oaToBusPipeline(
    bus,
    { llmModel: 'gemini-2.5-flash', memoryGateway: 'http://127.0.0.1:8420' },
    { id: 't1', prompt: 'ESG-GO 5T 元件', routeTo: ['crewai', 'genkit', 'deerflow'] },
    async () => { deployCalls++; }
  );

  if (r.available) {
    // 若真的可用, 驗證每個結果都過閘部署
    const allDeployed = r.results!.every((x) => x.deployed);
    if (!allDeployed) throw new Error('OA 產出應全過 5T 部署閘門');
    if (deployCalls !== r.results!.length) throw new Error(`落地呼叫數應=${r.results!.length}, 實際 ${deployCalls}`);
    console.log(`OA_PIPELINE_OK (${r.results!.length} 個子框架全過閘部署)`);
  } else {
    // 預期路徑: graceful 降級, 不假造
    if (deployCalls !== 0) throw new Error('不應有部署呼叫 (graceful 模式)');
    console.log('OA_PIPELINE_GRACEFUL_OK');
    console.log('  reason:', r.reason);
  }

  console.log('  deployCalls =', deployCalls, '| deployEvents =', deployEvents);
}

main().catch((e) => { console.error('OA_BRIDGE_FAIL:', e.message); process.exit(1); });
