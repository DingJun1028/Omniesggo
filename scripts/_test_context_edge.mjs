// 審查項補充驗證：context_buffer 邊界情況與 ReDoS
// 覆蓋 subagent 未完成階段二的檢查點 1、2、5
import { recordUtterance, getContext, buildContextHint, resetRoom, contextStatus }
  from '../apps/universal-translator/context_buffer.mjs';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { console.log('  PASS  ' + m); pass++; } else { console.log('  FAIL  ' + m); fail++; } };

const FFFD = '\uFFFD';
const R = (o) => recordUtterance(o);
// getContext / buildContextHint 接受「物件」({ room, lastN })，不是字串。
// 傳字串會被解構成 { room: undefined } 而靜默讀到 __default__ 房間。
const g = (room) => getContext({ room });
const hint = (room) => buildContextHint({ room });
const RST = (room) => resetRoom(room);
const clean = (s) => s !== undefined && s !== null && !String(s).includes(FFFD);

console.log('檢查點 2：邊界情況');
RST('edge');
ok(g('edge').length === 0, '初始為空');
R({ room: 'edge', src: '   ' });                      // 純空白
ok(g('edge').length === 0, '純空白 src → 不收錄');
R({ room: 'edge', src: '正常句', tgt: undefined });   // tgt 缺漏
ok(g('edge').length === 1 && g('edge')[0].tgt === '', 'tgt 缺漏 → 存空字串，不影響 src');
R({ room: 'edge', src: FFFD + '壞句' });
ok(g('edge').length === 1, '污染 src → 不收錄（筆數不變）');
R({ room: 'edge', src: '好句', tgt: FFFD + '壞譯' });
ok(g('edge').length === 2 && g('edge')[1].tgt === '', '污染 tgt → 只清 tgt，src 保留');
R({ room: 'edge', src: '帶控制字', tgt: 'xy' });
ok(g('edge').every(u => clean(u.src) && clean(u.tgt)), '控制字元已剔除');
// 以「前後筆數不變」判定未收錄，不硬編碼筆數（手算容易錯）
const beforeNonString = g('edge').length;
R({ room: 'edge', src: 123 });
ok(g('edge').length === beforeNonString, `非字串 src → 不收錄且不拋例外（${beforeNonString} → ${g('edge').length}）`);
R({ room: 'edge', src: '尾端空白句   ' });
ok(g('edge')[g('edge').length - 1].src === '尾端空白句', '尾端空白已 trim');
const allClean = g('edge').every(u => clean(u.src) && clean(u.tgt));
ok(allClean, '全房間無 U+FFFD 殘留');
ok(!hint('edge').includes(FFFD), 'buildContextHint 不含 U+FFFD');

console.log('');
console.log('檢查點 1：ReDoS / catastrophic backtracking');
// 這些正則都是線性掃描，無巢狀量詞，理論上不可能回溯爆炸。
// 實測用超長輸入確認執行時間可忽略。
const long = 'a'.repeat(200000);
const t0 = Date.now();
R({ room: 'redos', src: long });
R({ room: 'redos', src: FFFD.repeat(100000) });
const dt = Date.now() - t0;
ok(dt < 500, `20 萬字元 + 10 萬 U+FFFD 耗時 ${dt}ms (<500ms，無 ReDoS)`);

console.log('');
console.log('檢查點 5：邊界不外溢到其他房間');
RST('iso-a');
RST('iso-b');
R({ room: 'iso-a', src: FFFD + '污染' });
R({ room: 'iso-b', src: '乾淨' });
ok(g('iso-a').length === 0 && g('iso-b').length === 1, '污染只影響自己的房間');

console.log('');
console.log(`結果：${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
