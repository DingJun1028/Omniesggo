/**
 * Gemma 4 Reasoning Test Module (Final Verified)
 * Project: ESGGO OmniAgent
 */

async function runGemma4Test() {
  const GATEWAY_URL = 'http://localhost:8642/execute';
  
  const payload = {
    model: 'google/gemma-4-31b-it:free',
    task: {
      id: `test-task-${Date.now()}`,
      taskType: 'reasoning_analysis',
      prompt: '請分析在雙向 TypeScript 架構中，整合 Gemma 4 模型對 ESG 數據處理的三個主要優勢。'
    }
  };

  console.log('🚀 [Test] Sending request to OmniAgent (Gemma 4)...');

  try {
    // Adding X-Omni-Token header to authenticate against the gateway
    const response = await fetch(GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Omni-Token': process.env.OMNI_TOKEN || 'test-token'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    // Mapping based on OmniAgent Gateway v2.1 response structure
    const modelUsed = data.execution?.modelName || 'Unknown';
    const content = data.artifact?.content || 'No content returned';

    console.log('\n✅ [Gemma 4 Response Received]');
    console.log(`🤖 Model: ${modelUsed}`);
    console.log(`📝 Result:\n${content}`);
    
  } catch (error) {
    console.error('❌ [Test] Failed:', error);
  }
}

runGemma4Test();
