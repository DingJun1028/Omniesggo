#!/usr/bin/env node
// OA-Team 增量輸出優化引擎 終始閘 (Incremental Output Optimization Gate)
// 對齊 soul.md §12.0 / §15.5: 增量輸出優化架構
// 退出碼 0 = 通過; 非 0 = 缺口
import { IncrementalOutputOptimizer, verifyFiveTGate } from '../src/incremental-output/index.ts';

let fail = 0;
const log = (ok, msg) => { console.log((ok ? '✓' : '✗') + ' ' + msg); if (!ok) fail++; };

try {
  const opt = new IncrementalOutputOptimizer();

  // 1. 增量 delta 套用 (line-level, 不整檔重寫)
  const base = ['line1', 'line2', 'line3'].join('\n');
  const out = opt.applyDelta(base, [
    { line: 2, type: 'replace', content: 'line2-mod', sourceOrigin: 'incremental-canon' },
    { line: 4, type: 'insert', content: 'line4-new', sourceOrigin: 'incremental-canon' },
  ]);
  log(out === ['line1', 'line2-mod', 'line3', 'line4-new'].join('\n'), '增量 delta 套用 (replace+insert) 正確');

  // 2. 封存為不可篡改產物 (Hash Lock + freeze) + 5T 閘
  const artifact = opt.seal(
    [{ line: 2, type: 'replace', content: 'x', sourceOrigin: 'incremental-canon' }],
    '0.7.3',
    'Trustworthy',
    'incremental-canon'
  );
  log(typeof artifact.uuid === 'string' && artifact.uuid.length > 0, '產物 uuid 存在');
  log(artifact.frozen === true && Object.isFrozen(artifact), '產物 Object.freeze (Trustworthy)');
  log(artifact.hashLock.length === 8, 'Hash Lock 生成 (Transparent, FNV-1a)');

  // 3. 5T 閘: 缺欄位拋錯
  let gateThrew = false;
  try {
    verifyFiveTGate({ ...artifact, sourceOrigin: '' });
  } catch { gateThrew = true; }
  log(gateThrew, '5T 閘對缺 sourceOrigin 拋錯 (Traceable 不可妥協)');

  // 4. 生命週期 hook (Trackable)
  log(opt.getLifecycle().length >= 2, `生命週期 hook 可觀測 (Trackable, ${opt.getLifecycle().length} 事件)`);

} catch (e) {
  log(false, '引擎拋異常: ' + (e && e.message));
}

console.log(fail === 0 ? '\n結果: 增量輸出終始閘通過 (EXIT=0)' : `\n結果: 仍有 ${fail} 項缺口 (EXIT=1)`);
process.exit(fail === 0 ? 0 : 1);
