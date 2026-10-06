import { callChatProvider } from '../src/core/ai/model-router';
import { FREE_PROVIDER_POOL } from '../src/core/ai/model-router';
import { syncEngine } from '../src/lib/supabase-sync-engine';

async function generateTestReport() {
  console.log('🚀 開始進行業務邏輯測試：動態產生 5T 真實報告');
  
  // 1. 調用 AI 產生報告內容 (透過 model-router 路由至本地 Ollama)
  const prompt = `請以「ESG GO 善向永續」的名義，撰寫一份 150 字內的 2026 年度 5T 核心治理總結。
需包含：
1. 本地 Ollama 引擎成功整合 (AI 資料主權)。
2. Supabase 離線佇列機制 (資料寫入強韌)。
3. Liquid Glass Cyan 雙主題介面 (極致美學與透明度)。`;

  console.log('🧠 正在請求 Ollama AI 引擎撰寫內容...');
  const startTime = Date.now();
  
  try {
    const localModel = FREE_PROVIDER_POOL.find(p => p.id === 'local_gemma') || FREE_PROVIDER_POOL[0];
    const aiResult = await callChatProvider(localModel, [
      { role: 'system', content: '你是專業的 ESG 永續架構師與首席技術官。' },
      { role: 'user', content: prompt }
    ], { temperature: 0.7 });
    
    console.log(`✅ AI 內容生成成功 (耗時 ${Date.now() - startTime}ms):`);
    console.log('--------------------------------------------------');
    console.log(aiResult.content);
    console.log('--------------------------------------------------');
    
    // 2. 模擬 5T 封印 (ZKP Hash Lock)
    const mockHashLock = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
      
    const reportPayload = {
      uuid: crypto.randomUUID(),
      title: '2026 年度 5T 核心治理總結',
      content: aiResult.content,
      version: '1.0.0-Universe',
      timestamp: Date.now(),
      hash_lock: mockHashLock,
      source_origin: 'TEST_REPORT_SCRIPT',
      status: 'sealed'
    };
    
    console.log(`\n🔒 準備進行 5T 封印寫入 Supabase (Hash: ${mockHashLock.substring(0, 16)}...)`);
    
    // 3. 透過 SupabaseSyncEngine 推送寫入任務
    await syncEngine.pushTask('ESGReportData', 'INSERT', reportPayload);
    
    console.log(`✅ 報告已安全推入 SyncEngine 佇列！`);
    
  } catch (error) {
    console.error('❌ 測試發生異常:', error);
  }
}

generateTestReport();
