
import { inferTaskType } from './src/core/ai/model-router.ts';

const tests = [
  "碳排計算",
  "合規審查",
  "JunAikey 萬能元鑰",
  "蜂羣調度",
  "問卷分析",
  "一般問題",
];

console.log("=== Trigger Test ===");
for (const msg of tests) {
  const result = inferTaskType(msg);
  console.log(msg, "→", result.taskType, "分數:", result.trigger.score.toFixed(3), "等級:", result.trigger.level);
}


// ── JunAikey 專屬觸發測試 ──
const junaikey_tests = [
  "awaken",
  "awaken 永恆",
  "reflect 總結今日學習",
  "grow skill 記憶管理",
  "share memory between agents",
  "萬能永憶",
  "shared memory between agents",
  "知行合一",
  "背誦",
  "learn 記憶",
  "remember 我學到什麼",
  "謹記 這個重要事件",
  "永恆習得",
  "closed-loop",
  "entropy 降低",
];

console.log("\n=== JunAikey 專屬 Trigger Test ===");
for (const msg of junaikey_tests) {
  const result = inferTaskType(msg);
  console.log(msg, "→", result.taskType, "分數:", result.trigger.score.toFixed(3), "等級:", result.trigger.level);
}
