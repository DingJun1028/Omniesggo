/**
 * demo.ts - 完整使用示範
 * 顯示 time-travel debugging、shadow testing、動態模型發現功能
 */

import { createSmartAIRouter, quickDiscoverFreeModels, createTimeRiftEngine } from './smart-ai-router';

// 示範腳本
async function runDemo() {
  console.log('🚀 Starting Smart AI Router Demo\n');

  try {
    // 1. 快速發現免費模型（不需初始化完整系統）
    console.log('1️⃣ 快速發現免費模型：');
    const freeModels = await quickDiscoverFreeModels();
    console.log(`   找到 ${freeModels.length} 個候選模型`);
    freeModels.slice(0, 3).forEach(model => {
      console.log(`     • ${model.name} (${model.provider}) - ${model.tags.join(', ')}`);
    });

    // 2. 建立 Smart AI Router 實例
    console.log('\n2️⃣ 實例化 Smart AI Router：');
    const router = await createSmartAIRouter({
      timeRift: {
        enabled: true,
        storeType: 'memory',
        bufferSize: 100,
        flushIntervalMs: 100
      },
      gateway: {
        enabled: true,
        requireContractForExternalCalls: true
      }
    });
    
    // 3. 示範時空回溯除錯
    console.log('\n3️⃣ 時空回溯調試示範：');
    const traceDemo = await router.debugTimeTravel('test_trace_123', { speed: 5 });
    console.log(`   回放事件：`);
    traceDemo.events.forEach(event => {
      console.log(`     - ${event.event_type} @ ${event.timestamp}`);
    });

    // 4. 示範影子測試
    console.log('\n4️⃣ 影子測試示範：');
    const newModel = freeModels.find(m => m.tags.includes('new'));
    if (newModel) {
      const channelId = await router.startShadowTest(newModel, 10, 60);
      console.log(`   已啟動影子測試通道: ${channelId}`);
      console.log(`   審核對比後可決定是否推廣`);
    }

    // 5. 示範模型轉換
    console.log('\n5️⃣ 模型轉換示範（示意）：');
    const converter = await router.modelConverter; // Hypothetical access
    if (newModel && router.modelConverter) {
      console.log(`   想要嘗試將 ${newModel.id} 轉換格式`);
      console.log('   （实际转换需要实际模型文件）');
    }

    // 完成
    console.log('\n✅ Demo 完成！');
    process.exit(0);

  } catch (error) {
    console.error('Demo failed:', error);
    process.exit(1);
  }
}

// 執行示範
runDemo();