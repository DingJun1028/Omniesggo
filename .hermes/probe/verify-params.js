/**
 * 驗證腳本：確認 unified-auth.ts 中每個方法參數的宣告名與實際使用一致
 *
 * 背景：本輪曾把「有使用」的參數誤改名為 _config，造成執行期 ReferenceError，
 * 而 tsconfig.core.json 根本不涵蓋此檔案而給出假綠。此腳本以大括號配對
 * 精確切出各函式本體，杜絕「awk 範圍沒抓到」造成的模糊驗證。
 */
const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'src/lib/unified-auth.ts');
const lines = fs.readFileSync(file, 'utf8').split('\n');

const targets = [
  'authenticateFirebase',
  'authenticateApiKey',
  'authenticateInternal',
  'tryStrategy',
  'checkResourceAccess',
];

let problems = 0;

for (const fn of targets) {
  const re = new RegExp('static (async )?' + fn + '\\(');
  const si = lines.findIndex((l) => re.test(l));
  if (si < 0) {
    console.log(`  ❌ ${fn} 簽名未找到`);
    problems++;
    continue;
  }

  let depth = 0;
  let started = false;
  const body = [];
  for (let i = si; i < lines.length; i++) {
    for (const ch of lines[i]) {
      if (ch === '{') { depth++; started = true; }
      else if (ch === '}') { depth--; }
    }
    body.push(lines[i]);
    if (started && depth <= 0) break;
  }

  if (body.length <= 2) {
    console.log(`  ❌ ${fn} 大括號配對失敗（僅取到 ${body.length} 行）`);
    problems++;
    continue;
  }

  const text = body.join('\n');
  // 裸 config：前面不是 _ . 字母數字底線
  const bare = (text.match(/(^|[^_\w.])config\b/g) || []).length;
  const under = (text.match(/_config\b/g) || []).length;

  // 簽章列宣告的是哪一個
  const decl = (text.match(/_config\b/g) || []).length > 0 &&
               new RegExp('_config\\s*:\\s*AuthConfig').test(text) ? '_config' : 'config';

  let verdict;
  if (decl === '_config' && bare > 0) {
    verdict = '❌ 危險：宣告 _config 卻仍引用裸 config → 執行期 ReferenceError';
    problems++;
  } else if (decl === '_config' && bare === 0) {
    verdict = '✅ 正確（宣告 _config，函式體未使用）';
  } else if (decl === 'config' && bare > 0) {
    verdict = '✅ 正確（宣告 config 且有使用）';
  } else {
    verdict = '⚠️ 宣告 config 但未使用（可改 _config）';
  }

  console.log(
    `  ${fn.padEnd(22)} 行數=${String(body.length).padStart(3)}  ` +
    `裸config=${bare}  _config=${under}  宣告=${decl.padEnd(7)} ${verdict}`
  );
}

console.log(`\n  問題數: ${problems}`);
process.exit(problems > 0 ? 1 : 0);
