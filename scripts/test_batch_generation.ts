import { config } from 'dotenv';
config({ path: '.env.local' });
import { callChatProvider, MODELS } from '../src/core/ai/model-router';
import { syncEngine } from '../src/lib/supabase-sync-engine';
import crypto from 'crypto';

const CHAPTERS = [
  { id: 'GRI-2-1', title: '組織詳細資料' },
  { id: 'GRI-2-2', title: '納入永續報導的實體' },
  { id: 'GRI-2-6', title: '活動、價值鏈及其他商業關係' },
  { id: 'GRI-3-1', title: '決定重大主題的流程' },
  { id: 'GRI-3-2', title: '重大主題列表' },
  { id: 'GRI-205-1', title: '營運據點之貪腐風險評估' },
  { id: 'GRI-302-1', title: '組織內部能源消耗量' },
  { id: 'GRI-305-1', title: '直接 (範疇一) 溫室氣體排放' },
  { id: 'GRI-305-2', title: '能源間接 (範疇二) 溫室氣體排放' },
  { id: 'GRI-401-1', title: '新進員工及離職率' },
];

async function runBatchGeneration() {
  console.log('🚀 開始執行：多章節並發排隊生成測試 (極限邏輯)');
  console.log(`總任務數：${CHAPTERS.length} 章節`);
  
  const startTime = Date.now();
  let completedCount = 0;
  
  // 設定最大並發數為 3，避免把本地模型撐爆
  const MAX_CONCURRENCY = 3;
  let activeWorkers = 0;
  let index = 0;

  const processTask = async (chapter: typeof CHAPTERS[0]) => {
    const taskStart = Date.now();
    try {
      const prompt = `請以極為專業的口吻，簡短產生 ESG 報告書段落。主題：${chapter.title} (${chapter.id})。字數限制：約 50 字。`;
      
      const aiResult = await callChatProvider(MODELS.local_esggo_gemma4, [
        { role: 'system', content: '你是專業的 ESG 永續架構師與首席技術官。' },
        { role: 'user', content: prompt }
      ], { temperature: 0.3 });
      
      const content = aiResult.text || aiResult.content || '生成內容為空';
      
      // 產生 Hash Lock 封印
      const timestamp = Date.now();
      const payloadString = JSON.stringify({ chapterId: chapter.id, content, timestamp });
      const hashLock = '0x' + crypto.createHash('sha256').update(payloadString).digest('hex');
      
      // 推送寫入佇列
      await syncEngine.pushTask('ESGReportSeals', 'INSERT', {
        uuid: crypto.randomUUID(),
        chapter_id: chapter.id,
        content: content,
        hash_lock: hashLock,
        status: 'sealed',
        source_origin: 'BATCH_TEST',
        timestamp: timestamp
      });
      
      // 寫入日誌讓 A01 可見
      await syncEngine.pushTask('OmniTraceLogs', 'INSERT', {
        uuid: crypto.randomUUID(),
        timestamp: new Date(timestamp).toISOString(),
        originCause: `批次生成封印: ${chapter.id}`,
        hashLock: hashLock,
        type: 'seal',
        agent: 'AsyncReportEngine'
      });
      
      completedCount++;
      const timeTaken = Date.now() - taskStart;
      console.log(`[✅ 完成] ${chapter.id} - ${chapter.title} (耗時: ${timeTaken}ms, Hash: ${hashLock.substring(0, 10)}...)`);
    } catch (err: any) {
      console.error(`[❌ 失敗] ${chapter.id}:`, err.message);
    }
  };

  const worker = async () => {
    while (index < CHAPTERS.length) {
      const taskIndex = index++;
      activeWorkers++;
      await processTask(CHAPTERS[taskIndex]);
      activeWorkers--;
    }
  };

  // 啟動並發 Worker
  const workers = [];
  for (let i = 0; i < MAX_CONCURRENCY; i++) {
    workers.push(worker());
  }

  await Promise.all(workers);

  const totalTime = (Date.now() - startTime) / 1000;
  console.log('--------------------------------------------------');
  console.log(`🎉 測試結束！共生成 ${completedCount}/${CHAPTERS.length} 個章節`);
  console.log(`⏱️ 總耗時: ${totalTime.toFixed(2)} 秒`);
  console.log(`📈 系統平均吞吐量: ${(completedCount / totalTime).toFixed(2)} 章節/秒`);
  console.log('--------------------------------------------------');
  
  // 強制等待 5 秒讓 SyncEngine 將積壓的佇列打完
  console.log('等待 SyncEngine 清空佇列...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  process.exit(0);
}

runBatchGeneration();
