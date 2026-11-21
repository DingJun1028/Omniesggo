import { HolyLinter } from '../core/omni-linter';
import { OmniVaultWORM } from '../core/omni-vault';
import { EntropyAgent, EntropyMonitor } from '../services/EntropyAgent';

/**
 * 【通/信】 萬能智庫與代理網絡協作範例
 * 展示數據如何從提取、驗證、流轉到最終封印。
 */
async function executeOmniWorkflowDemo() {
  console.log('🚀 [聖典預演] 啟動 InfoOne 萬能工作流...');

  // 1. 模擬原始數據輸入
  const rawPayload = {
    content: "ESG Carbon Report 2026",
    author: "JunAi",
    tags: ["ESG", "Omni"]
  };

  // 2. [真/信] 使用 HolyLinter 進行初回封印
  console.log('\nStep 1: 數據初回封印 (HolyLinter.seal)');
  const sealedData = HolyLinter.seal(rawPayload, 'Inception_Point');
  
  // 3. [通] 模擬數據在代理網絡間流轉 (增加熵值)
  console.log('\nStep 2: 模擬代理網絡流轉與週期性熵增...');
  
  // 由於 sealedData 是 Object.freeze 的，我們模擬一個帶有多個節點的對象來測試熵值
  const entropyTarget = {
    ...sealedData,
    _omniHeart: {
      ...sealedData._omniHeart,
      transferful: [
        ...(sealedData._omniHeart?.transferful || []),
        { timestamp: Date.now(), destination: 'Node_A', hash_snapshot: 'hash_a' },
        { timestamp: Date.now(), destination: 'Node_B', hash_snapshot: 'hash_b' },
        { timestamp: Date.now(), destination: 'Node_C', hash_snapshot: 'hash_c' },
        { timestamp: Date.now(), destination: 'Node_D', hash_snapshot: 'hash_d' },
        { timestamp: Date.now(), destination: 'Node_E', hash_snapshot: 'hash_e' }
      ]
    }
  };

  // 4. [通] 進化引擎偵測熵值並執行獻祭
  console.log('\nStep 3: 偵測系統熵值...');
  const entropy = EntropyMonitor.calculateEntropy(entropyTarget);
  console.log(`> 當前熵值: ${entropy.toFixed(4)}`);

  let finalData: any = entropyTarget;
  if (EntropyMonitor.shouldSacrifice(entropy)) {
    finalData = await EntropyAgent.performSacrifice(entropyTarget);
    console.log(`> 獻祭完成。新 Trace 長度: ${finalData._omniHeart.transferful.length}`);
  }

  // 5. [信] 最終回歸：封印入萬能智庫 (WORM)
  console.log('\nStep 4: 最終刻印入萬能智庫 (OmniVaultWORM)');
  try {
    const vaultId = `RECORD_${Date.now()}`;
    OmniVaultWORM.engrave(vaultId, finalData);
    
    // 驗證物理鎖定
    const fetched = OmniVaultWORM.secureFetch(vaultId);
    console.log(`> 驗證鎖定狀態: ${Object.isFrozen(fetched) ? '物理已凍結 ❄️' : '未凍結'}`);
    
    // 嘗試二次覆寫 (預期失敗)
    console.log('> 嘗試竄改永恆數據...');
    try {
      OmniVaultWORM.engrave(vaultId, { hack: true });
    } catch (e: any) {
      console.log(`> 預期攔截: ${e.message} ✅`);
    }
  } catch (error: any) {
    console.log(`> 異常錯誤: ${error.message}`);
  }

  console.log('\n✨ [聖典預演] 工作流圓滿達成。');
}

executeOmniWorkflowDemo().catch(console.error);
