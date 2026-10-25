
import { inferTaskType } from './src/core/ai/model-router.ts';

// Direct test of 萬靈永憶
const msg = "萬靈永憶";
const result = inferTaskType(msg);
console.log("Test:", msg);
console.log("Result:", JSON.stringify(result, null, 2));
