import { syncEngine } from '../src/lib/supabase-sync-engine';
import crypto from 'crypto';

async function injectMemories() {
  console.log('🧠 [OmniMemory] 開始注入真實的記憶碎片...');

  const fragments = [
    {
      type: 'rule',
      content: 'Jules Karma 協議：處理 bug 時必須執行九步驟因果修復，不可只做表面 patch。',
      keywords: ['Jules', 'Karma', 'Bugfix', 'Rule']
    },
    {
      type: 'preference',
      content: '所有模組的戰情室 UI 必須符合 Liquid Glass Cyan 規範，維持「美(Tangible)」標準。',
      keywords: ['UI', 'Liquid Glass', 'Preference', 'Tangible']
    },
    {
      type: 'claim',
      content: 'A05 供應鏈盡職調查模組已在 2026-10-05 完成實裝並支援 5T Hash Lock。',
      keywords: ['A05', 'Supply Chain', 'Hash Lock', 'Claim']
    },
    {
      type: 'thought',
      content: '未來或許可以將 A08 的遺忘機制結合更強大的 LLM 來進行摘要，而非單純刪除。',
      keywords: ['LLM', 'Dreams', 'Thought', 'Future']
    }
  ];

  for (const frag of fragments) {
    const payload = {
      id: crypto.randomUUID(),
      userId: 'junai-key',
      agentId: 'omni-agent',
      type: frag.type,
      content: frag.content,
      keywords: JSON.stringify(frag.keywords),
      confidence: frag.type === 'thought' ? 0.6 : 1.0,
      sourceOrigin: 'TEST_INJECTION',
      createdAt: new Date().toISOString(),
      lastAccessed: new Date().toISOString()
    };

    console.log(`📥 注入記憶 [${frag.type.toUpperCase()}]: ${frag.content.substring(0, 30)}...`);
    await syncEngine.pushTask('OmniMemory', 'INSERT', payload);
  }

  console.log('\n✅ 所有記憶碎片已推入 SyncEngine 離線佇列！');
  console.log('您可以隨時在 /omni-memory 戰情室中觀察或觸發「夢境合成」來代謝它們。');
}

injectMemories().catch(console.error);
