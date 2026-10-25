
import { inferTaskType, triggerScoreToLevel, TriggerLevel } from './src/core/ai/model-router.ts';
import { triggerRegistry } from './src/core/ai/model-router.ts';

// Test 1: Original keywords
const tests = [
  "請幫我寫一份碳排計算報告",           // carbon_calculation
  "Earth Day: 我的碳足跡是多少?",         // carbon_calculation (chinese)
  "合規審查 CSRD 要求",                     // compliance_review
  "我要做一個 ESG 永續報告",                // gri_report_draft
  "OCR 提取我的發票數據",                   // evidence_ocr
  "分析問卷結果",                          // stakeholder_analysis
  "SMC 風險分析網路安全",                   // tcfd_analysis
  "列出所有的 SDG 目標",                    // sdg_mapping
  "重大性矩陣分析",                        // materiality_matrix
  "修復這個 bug 錯誤",                      // omni_jules_heal
  "把舊郵件歸檔",                          // email_archival
  "蜂羣調度委員會",                        // swarm_orchestration
  "JunAikey 萬能元鑰",                     // junaikey_sovereign
  " készült egy task",                    // general
];

console.log("=== 測試 inferTaskType ===");
for (const msg of tests) {
  const result = inferTaskType(msg);
  console.log(`\n訊息: "${msg}"`);
  console.log(`  任務類型: ${result.taskType}`);
  console.log(`  觸發分數: ${result.trigger.score.toFixed(3)} (${result.trigger.confidence})`);
  console.log(`  觸發等級: ${result.trigger.level}`);
  console.log(`  命中規則: ${result.trigger.matchedRules.join(', ')}`);
}

// Test 2: Trigger scoring
console.log("\n=== 測試 triggerScoreToLevel ===");
const scoreTests = [0.95, 0.85, 0.75, 0.65, 0.55, 0.45, 0.35, 0.25, 0.15];
for (const score of scoreTests) {
  console.log(`分數 ${score} → 等級 ${triggerScoreToLevel(score)}`);
}

// Test 3: TriggerRegistry
console.log("\n=== 測試 TriggerRegistry ===");
const registry = triggerRegistry;
registry.register("test-p0", async (p) => { console.log("P0 handler:", p); }, TriggerLevel.P0);
registry.register("test-p1", async (p) => { console.log("P1 handler:", p); }, TriggerLevel.P1);
registry.register("test-p2", async (p) => { console.log("P2 handler:", p); }, TriggerLevel.P2);

await registry.dispatch("hello", TriggerLevel.P0);
await registry.dispatch("hello", TriggerLevel.P1);
await registry.dispatch("hello", TriggerLevel.P2);

const stats = registry.getStatistics();
console.log("統計:", stats);

// Test 4: Matching coverage analysis
console.log("\n=== 關鍵詞覆蓋分析 ===");
const keywords = Object.keys(import.meta.env.SEMANTIC_WEIGHTS || {});
console.log(`總關鍵詞數: ${keywords.length}`);
// Just test a few
const sampleKeywords = ["碳排", "合規", "社群", "網路安全", "語音", "翻譯", "代理工具"];
for (const kw of sampleKeywords) {
  const pattern = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const testMessages = [
    `用戶提到 "${kw}"`,
    `用戶提到 "${kw}" 以及其他內容`,
  ];
  for (const msg of testMessages) {
    const result = inferTaskType(msg);
    console.log(`關鍵詞 '${kw}' → 訊息 "${msg}" → 類型: ${result.taskType} (分數: ${result.trigger.score.toFixed(3)})`);
  }
}
