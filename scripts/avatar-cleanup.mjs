#!/usr/bin/env node
/**
 * 萬能知識分身 · 防回歸清理 (avatar-cleanup)
 *
 * 確保 C 線 --apply 測試型別 (IAvatarProbe*) 不殘留進 shared/types.ts canonical。
 * 在 cron 閉環末尾跑，掃 shared/types.ts 移除所有 IAvatarProbe* 開頭的 interface/type/enum。
 */
import fs from 'node:fs';
import path from 'node:path';

// 支援 --file <path> (測試用), 預設掃 shared/types.ts
const fileArg = process.argv.indexOf('--file');
const TARGET = fileArg >= 0 ? path.resolve(process.argv[fileArg + 1]) : path.resolve('shared', 'types.ts');
if (!fs.existsSync(TARGET)) { console.log(`[cleanup] 無 ${TARGET}, skip`); process.exit(0); }

let s = fs.readFileSync(TARGET, 'utf8');
const before = (s.match(/export\s+(?:type|interface|enum)\s+IAvatarProbe/g) || []).length;
if (before === 0) { console.log('[cleanup] ✅ 無測試型別殘留'); process.exit(0); }

// 移除 IAvatarProbe* 區塊: 多行 (到 \n}) 或單行 ({ ... })
const re = /export\s+(?:type|interface|enum)\s+IAvatarProbe[A-Za-z0-9_]*\s*\{[^]*?\}\n?/g;
s = s.replace(re, '');
fs.writeFileSync(TARGET, s);
console.log(`[cleanup] ✅ 移除 ${before} 個測試型別 (IAvatarProbe*)`);
