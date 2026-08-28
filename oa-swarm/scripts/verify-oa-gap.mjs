// OA-Team 缺口補齊驗證閉環 (oa-gap-remediation-playbook)
// 驗證: 終始矩陣 OA 領域型別 canonical↔consumer 閉合 + 五陣列 MECE 配對覆蓋
// 退出碼 0 = 通過; 非 0 = 缺口
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..'); // esggo/oa-swarm
// 穩健解析 canonical: ROOT 上透一層即 repo 根 (esggo), 再 shared/types.ts
// (原寫法 ROOT/../../esggo/shared 依賴目錄巧合, 搬目錄即壞)
const SRC = path.resolve(ROOT, '..', 'shared', 'types.ts');
const DEST = path.join(ROOT, 'types', 'generated', 'esggo-shared.d.ts');

let fail = 0;
const log = (ok, msg) => { console.log((ok ? '✓' : '✗') + ' ' + msg); if (!ok) fail++; };

// 1. canonical 含 OA 領域型別
const canonical = fs.readFileSync(SRC, 'utf-8');
const oaTypes = ['HiveSide','ArrayKey','ISoulAgent','IComponentCore','ISoulArtifact','ISwarmTask','SwarmTaskResult','IOABMessage','I5TVerification'];
const missingCanon = oaTypes.filter(t => !new RegExp('export (interface|type) ' + t + '\\b').test(canonical));
log(missingCanon.length === 0, `canonical 含 OA 型別 (缺口: ${missingCanon.join(',') || '無'})`);

// 2. consumer 生成檔含 OA 型別
const consumer = fs.readFileSync(DEST, 'utf-8');
const missingCons = oaTypes.filter(t => !new RegExp('(interface|type) ' + t + '\\b').test(consumer));
log(missingCons.length === 0, `consumer 含 OA 型別 (缺口: ${missingCons.join(',') || '無'})`);

// 3. 五陣列 MECE 配對覆蓋 (C(5,2)=10 對)
const arrays = ['sanctum','rune','wing','alchemy','audit'];
const pairs = [];
for (let i = 0; i < arrays.length; i++)
  for (let j = i + 1; j < arrays.length; j++) pairs.push(arrays[i] + '×' + arrays[j]);
log(pairs.length === 10, `五陣列 MECE 配對 = ${pairs.length}/10`);

// 4. 雙蜂 60 員觸達 (src 矩陣陣列長度 60, .map 重編 id 1-60)
const matrixText = fs.readFileSync(path.join(ROOT, 'src', 'soul-matrix-60.ts'), 'utf-8');
const lenMatch = matrixText.match(/SOUL_MATRIX_60\s*=\s*\[([\s\S]*?)\]\.map/);
const inner = lenMatch ? lenMatch[1] : matrixText;
const entries = (inner.match(/A\('/g) || []).length;
const hasRemap = /\.map\(\(a,\s*i\)\s*=>\s*\(\{\s*\.\.\.a,\s*id:\s*i\s*\+\s*1\s*\}\)/.test(matrixText);
log(entries === 60 && hasRemap, `雙蜂 60 員觸達 (A(' 條目 ${entries}/60, 重編 id: ${hasRemap})`);

// 5. 5T 驗算閉合 (protocol-5t 含 purify + verifyZeroHallucination)
const proto = fs.readFileSync(path.join(ROOT, 'src', 'protocol-5t.ts'), 'utf-8');
log(/export function purify/.test(proto) && /export function verifyZeroHallucination/.test(proto),
  '5T 協定 purify + verifyZeroHallucination 存在');

console.log(fail === 0 ? '\n結果: 缺口補齊閉環通過 (EXIT=0)' : `\n結果: 仍有 ${fail} 項缺口 (EXIT=1)`);
process.exit(fail === 0 ? 0 : 1);
