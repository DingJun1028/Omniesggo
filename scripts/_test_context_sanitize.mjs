// TDD 驗證：context_buffer 污染防護
// 執行：node scripts/_test_context_sanitize.mjs
import assert from 'node:assert';
import { recordUtterance, getContext, buildContextHint, resetRoom, contextStatus } from '../apps/universal-translator/context_buffer.mjs';

let pass = 0, fail = 0;
const t = (name, fn) => {
  try { fn(); console.log('  ✓', name); pass++; }
  catch (e) { console.log('  ✗', name, '→', e.message); fail++; }
};

const BAD = 'OmniLive \uFFFDA\uFFFDȪ\uFFFD\uFFFD\uFFFD\uFFFDT\uFFFD{';   // 含 U+FFFD 的污染字串
const GOOD = 'OmniLive 服務版本確認';

console.log('context_buffer 污染防護測試');

t('污染 src 不被收錄', () => {
  resetRoom('t1');
  recordUtterance({ room: 't1', src: BAD, tgt: 'x', from: 'zh', to: 'en' });
  assert.strictEqual(getContext({ room: 't1' }).length, 0, '污染句不應進 buffer');
});

t('乾淨 src 正常收錄', () => {
  resetRoom('t2');
  recordUtterance({ room: 't2', src: GOOD, tgt: 'OmniLive service version confirmation', from: 'zh', to: 'en' });
  const c = getContext({ room: 't2' });
  assert.strictEqual(c.length, 1);
  assert.strictEqual(c[0].src, GOOD);
});

t('污染 tgt 只清空 tgt，src 保留', () => {
  resetRoom('t3');
  recordUtterance({ room: 't3', src: GOOD, tgt: BAD, from: 'zh', to: 'en' });
  const c = getContext({ room: 't3' });
  assert.strictEqual(c.length, 1, 'src 乾淨應保留');
  assert.strictEqual(c[0].tgt, '', '污染 tgt 應清空');
});

t('空 src 不收錄', () => {
  resetRoom('t4');
  recordUtterance({ room: 't4', src: '   ', tgt: 'x' });
  assert.strictEqual(getContext({ room: 't4' }).length, 0);
});

t('控制字元被剔除', () => {
  resetRoom('t5');
  recordUtterance({ room: 't5', src: `A${String.fromCharCode(7)}B`, tgt: 'AB' });
  const c = getContext({ room: 't5' });
  assert.strictEqual(c[0].src, 'AB', '控制字元應被移除');
});

t('buildContextHint 不含 U+FFFD', () => {
  resetRoom('t6');
  recordUtterance({ room: 't6', src: BAD, tgt: BAD, from: 'zh', to: 'en' });
  recordUtterance({ room: 't6', src: GOOD, tgt: 'clean', from: 'zh', to: 'en' });
  const h = buildContextHint({ room: 't6' });
  assert.ok(!h.includes('\uFFFD'), 'context hint 不得含替換字元');
  assert.ok(h.includes(GOOD));
});

t('房間隔離仍有效', () => {
  resetRoom('t7a'); resetRoom('t7b');
  recordUtterance({ room: 't7a', src: 'A-room', tgt: 'a' });
  recordUtterance({ room: 't7b', src: 'B-room', tgt: 'b' });
  assert.strictEqual(getContext({ room: 't7a' }).length, 1);
  assert.strictEqual(getContext({ room: 't7a' })[0].src, 'A-room');
});

t('contextStatus 反映真實筆數', () => {
  resetRoom('t8');
  recordUtterance({ room: 't8', src: GOOD, tgt: 'x' });
  assert.ok(contextStatus().rooms.t8 >= 1);
});

console.log(`\n結果：${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
