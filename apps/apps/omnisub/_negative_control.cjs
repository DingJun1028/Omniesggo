#!/usr/bin/env node
// 負向對照：把兩道守衛從 index.html 拔掉重跑 verifier，確認第 22/23 節會紅。
// 用法：node _negative_control.mjs
// 這是驗證測試本身的測試 —— 恆真的測試比沒有測試更危險。
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const dir = __dirname;
const htmlPath = path.join(dir, 'index.html');
const orig = fs.readFileSync(htmlPath, 'utf-8');
const backup = orig;

const GUARDS = [
  ["if(typeof orig !== 'string') return;", ''],                 // UI.render 型別守衛
  ['if(!isFinite(sec)) sec = 0;', ''],                          // fmtSRT 非有限值守衛
];

let removed = 0;
let rolled = orig;
for (const [guard, repl] of GUARDS) {
  if (!rolled.includes(guard)) {
    console.error(`[NEG] 找不到守衛原文，錨點過期：${guard}`);
    console.error('[NEG] 這是測試腳本的問題，不是產品問題 —— 請更新錨點。');
    process.exit(2);
  }
  rolled = rolled.replace(guard, repl);
  removed++;
}
console.log(`[NEG] 已移除 ${removed} 道守衛`);

let rc = 1, out = '';
try {
  fs.writeFileSync(htmlPath, rolled);
  out = execFileSync(process.execPath, [path.join(dir, 'verify.mjs')], {
    encoding: 'utf-8', maxBuffer: 16 * 1024 * 1024,
  });
  rc = 0;
} catch (e) {
  out = (e.stdout || '') + (e.stderr || '');
  rc = e.status === undefined ? -1 : e.status;
} finally {
  // 必須還原，且用 backup 而非重新推導
  fs.writeFileSync(htmlPath, backup);
}

const passCount = (out.match(/^\s+PASS/gm) || []).length;
const failCount = (out.match(/^\s+FAIL/gm) || []).length;

console.log(`\n[NEG] verifier 在守衛移除後: ${passCount} PASS / ${failCount} FAIL`);
console.log('\n[NEG] 失敗項：');
for (const line of out.split('\n')) {
  if (/^\s+FAIL/.test(line)) console.log('  ' + line.trim());
}

// 只有「守衛移除必紅」的斷言才算偵測器。
// fmtSRT(-Infinity) / fmtSRT(null) 在守衛移除後仍會 PASS，因為
//   (-Infinity)|0 === 0  且  null * 1000 === 0
// bitwise 截斷巧合地產出 00:00:00,000。它們是有效產品斷言，但非偵測器，
// 拿來當判準會讓負向對照永遠失敗 —— 那是判準錯，不是測試弱。
const DETECTORS = [
  '靜態錨點：UI.render',   // 靜態錨點：守衛字串消失
  '靜態錨點：fmtSRT',      // 靜態錨點：守衛字串消失
  'render(null) 不拋例外',  // 動態：守衛消失 → norm() 對 null 拋 TypeError
  'render(數字 123) 不拋例外',
  'fmtSRT(NaN) 輸出合法時間碼', // 動態：守衛消失 → "aN:aN:aN,NaN"
];
// 非偵測器（記錄用，兩種情況皆 PASS —— 巧合或副作用，非守衛貢獻）
const COINCIDENTAL = ['均未寫入歷史', 'fmtSRT(-Infinity)', 'fmtSRT(null)'];

const failLines = out.split('\n').filter(l => /^\s+FAIL/.test(l));
const red = new Set();
for (const l of failLines) {
  for (const d of DETECTORS) if (l.includes(d)) red.add(d);
}
const allRed = DETECTORS.every(d => red.has(d));

console.log(`\n[NEG] 偵測器 ${red.size}/${DETECTORS.length} 被打紅`);
for (const d of DETECTORS) console.log(`  ${red.has(d) ? '[RED]  ' : '[!!未紅]'} ${d}`);
console.log('\n[NEG] 非偵測器（守衛移除後仍 PASS，屬巧合/副作用，不列入判準）：');
for (const c of COINCIDENTAL) console.log(`  ${c}`);

console.log(`\n[NEG] html 已還原: ${fs.readFileSync(htmlPath, 'utf-8') === backup}`);

if (rc !== 0 && failCount > 0 && allRed) {
  console.log(`\n[NEG] PASS —— ${DETECTORS.length}/${DETECTORS.length} 個偵測器全紅，測試非恆真。`);
  process.exit(0);
}
console.log('\n[NEG] FAIL —— 測試無法偵測守衛移除，或守衛未成功植入。');
process.exit(1);