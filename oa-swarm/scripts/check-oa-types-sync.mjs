// OA-Team 雙向 TS 終始矩陣守門 (block-level)
// 終 (canonical): C:/Project/esggo/shared/types.ts
// 始 (consumer): ./types/generated/esggo-shared.d.ts
// 比對 map 中匯出的 block 是否與生成檔一致 (不比對 canonical 全文)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, '..', '..', 'esggo', 'shared', 'types.ts');
const DEST = path.join(ROOT, 'types', 'generated', 'esggo-shared.d.ts');

const map = [
  ['HiveSide', 'type'],
  ['ArrayKey', 'type'],
  ['ISoulAgent', 'interface'],
  ['IComponentCore', 'interface'],
  ['ISoulArtifact', 'interface'],
  ['ISwarmTask', 'interface'],
  ['SwarmTaskResult', 'type'],
  ['IOABMessage', 'interface'],
  ['I5TVerification', 'interface'],
];

if (!fs.existsSync(SRC)) { console.error('SRC missing: ' + SRC); process.exit(1); }
if (!fs.existsSync(DEST)) { console.error('DEST missing: ' + DEST); process.exit(1); }

const src = fs.readFileSync(SRC, 'utf-8');
const dst = fs.readFileSync(DEST, 'utf-8');
const srcLines = src.split('\n');
const dstLines = dst.split('\n');

function findExportBlock(lines, name, kind) {
  const head = 'export ' + kind + ' ' + name + '<';
  const headPlain = 'export ' + kind + ' ' + name + ' ';
  let start = -1, braces = 0;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();
    if (start === -1 && (l.startsWith(head) || l.startsWith(headPlain) || l.startsWith('export type ' + name + ' '))) {
      start = i;
      if (kind === 'type' && !l.includes('{')) {
        if (l.endsWith(';')) return lines.slice(start, i + 1).join('\n');
        continue;
      }
    }
    if (start !== -1) {
      if (kind === 'type' && !l.includes('{') && lines[start].trim().startsWith('export type') && l.endsWith(';')) {
        return lines.slice(start, i + 1).join('\n');
      }
      braces += (l.match(/{/g) || []).length - (l.match(/}/g) || []).length;
      if (braces <= 0) return lines.slice(start, i + 1).join('\n');
    }
  }
  return '';
}

const norm = (s) => s.replace(/\/\/.*$/g, '').replace(/\s+/g, ' ').trim();
let missing = [], mismatched = [];
for (const [name, kind] of map) {
  const sb = norm(findExportBlock(srcLines, name, kind));
  const db = norm(findExportBlock(dstLines, name, kind));
  if (!db) missing.push(name);
  else if (sb !== db) mismatched.push(name);
}

if (missing.length || mismatched.length) {
  console.error('TYPES_OUT_OF_SYNC');
  if (missing.length) console.error('missing: ' + missing.join(', '));
  if (mismatched.length) console.error('mismatched: ' + mismatched.join(', '));
  process.exit(1);
}
console.log('TYPES_IN_SYNC');
process.exit(0);
