// 最佳實踐補全: 鎖住 player.html (三元一體 Zoom 播放器) 的前端 script 語法, 防止回退.
// 用 node 的 vm 編譯檢查 (只驗語法, 不執行瀏覽器 API).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

// 抽取 HTML 中 <script type="module"> ... </script> 的內容
function extractModuleScripts(html) {
  const scripts = [];
  const re = /<script type="module">([\s\S]*?)<\/script>/g;
  let m;
  while ((m = re.exec(html)) !== null) scripts.push(m[1]);
  return scripts;
}

test('player.html 的 Zoom 模式 script 語法有效 (終始矩陣接入 + startZoom)', () => {
  const html = readFileSync(join(publicDir, 'player.html'), 'utf8');
  const scripts = extractModuleScripts(html);
  assert.ok(scripts.length > 0, '應至少找到一個 module script');

  // 合併所有 script 做一次性語法編譯 (瀏覽器 API 不執行, 只查 parse)
  const combined = scripts.join('\n;\n');
  // 必須包含 Zoom 關鍵字 (確保 Zoom 模式未被誤刪)
  assert.ok(combined.includes('startZoom'), 'script 應包含 startZoom 函式');
  assert.ok(combined.includes('getDisplayMedia'), 'script 應包含 getDisplayMedia (Zoom 擷取)');
  assert.ok(
    combined.includes('esggo-shared.d.ts'),
    'script 應接入終始矩陣 (/// <reference esggo-shared.d.ts>)'
  );

  // 語法編譯 (不執行): 若語法錯誤會拋 SyntaxError
  assert.doesNotThrow(() => {
    new vm.Script(combined, { filename: 'player.html-combined.mjs' });
  }, 'player.html script 應能通過語法編譯');
});

test('public/ 下所有 HTML 的 module script 均語法有效', () => {
  const files = readdirSync(publicDir).filter((f) => f.endsWith('.html'));
  for (const f of files) {
    const html = readFileSync(join(publicDir, f), 'utf8');
    const scripts = extractModuleScripts(html);
    const combined = scripts.join('\n;\n');
    if (!combined.trim()) continue; // 無 module script 的頁面跳過
    assert.doesNotThrow(
      () => new vm.Script(combined, { filename: `${f}-combined.mjs` }),
      `${f} 的 module script 應通過語法編譯`
    );
  }
});
