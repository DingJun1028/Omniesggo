/**
 * 測試自動生成 — 單元測試
 * 由符文契約陣列 (07-12/37-42) 主導
 * 用法: node scripts/gen-tests/gen-unit.mjs <source-file>
 * 輸出: <source-file>.test.ts
 */
import { readFileSync, writeFileSync } from 'fs';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const MODEL = process.env.OLLAMA_MODEL || 'qwen2.5-coder:7b';

async function main() {
  const srcFile = process.argv[2];
  if (!srcFile) {
    console.error('用法: node gen-unit.mjs <source-file>');
    process.exit(1);
  }

  const code = readFileSync(srcFile, 'utf8');
  const testFile = srcFile.replace(/\.ts$/, '.test.ts');

  const prompt = `你是 Omniesggo 的符文契約陣列代理。
為以下 TypeScript 程式碼生成 vitest 單元測試。
要求：
1. 含 edge cases（null/undefined/empty/boundary）
2. 使用 describe/it/expect
3. 覆蓋率目標 ≥80%
4. 只輸出測試程式碼，不要 markdown 包裹

原始程式碼 (${srcFile}):
${code}`;

  try {
    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: MODEL, prompt, stream: false }),
    });

    const data = await res.json();
    const testCode = data.response?.trim() ?? '';

    // 移除 markdown 包裹
    const cleaned = testCode.replace(/^```typescript?\n?/, '').replace(/^```ts\n?/, '').replace(/\n?```$/, '');

    writeFileSync(testFile, cleaned);
    console.log(`✅ 測試已生成: ${testFile}`);
  } catch (err) {
    console.error('❌ 生成失敗:', err.message);
    process.exit(1);
  }
}

main();
