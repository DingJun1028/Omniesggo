import fs from 'fs';
import path from 'path';

const SRC = path.resolve(process.cwd(), '..', '..', 'shared', 'types.ts');
const DEST = path.resolve(process.cwd(), 'types', 'generated', 'esggo-shared.d.ts');

if (!fs.existsSync(SRC)) {
  console.error(`SRC missing: ${SRC}`);
  process.exit(1);
}
if (!fs.existsSync(DEST)) {
  console.error(`DEST missing: ${DEST}`);
  process.exit(1);
}

const srcContent = fs.readFileSync(SRC, 'utf-8').replace(/\r\n/g, '\n');
const destContent = fs.readFileSync(DEST, 'utf-8').replace(/\r\n/g, '\n');

// Extract exported names from source
const srcExports = new Set();
const srcBlocks = new Map();
const srcLines = srcContent.split('\n');
const enumRe = /^(?:export\s+)?(?:type\s+)?(enum|interface|type)\s+([A-Za-z_][A-Za-z0-9_]*)\b/;
let blockStart = -1;
let blockName = '';
let blockKind = '';
let braces = 0;
for (let i = 0; i < srcLines.length; i++) {
  const line = srcLines[i];
  const m = line.match(enumRe);
  if (m && line.includes('export')) {
    if (blockStart >= 0 && blockName) {
      srcBlocks.set(blockName, srcLines.slice(blockStart, i).join('\n').trim());
    }
    blockStart = i;
    blockName = m[2];
    blockKind = m[1];
    srcExports.add(blockName);
    braces = (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
    continue;
  }
  if (blockStart >= 0) {
    braces += (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
    if (braces <= 0) {
      srcBlocks.set(blockName, srcLines.slice(blockStart, i + 1).join('\n').trim());
      blockStart = -1;
      blockName = '';
    }
  }
}
if (blockStart >= 0 && blockName) {
  srcBlocks.set(blockName, srcLines.slice(blockStart).join('\n').trim());
}

// Extract exported names from generated
const destExports = new Set();
const destBlocks = new Map();
const destLines = destContent.split('\n');
blockStart = -1;
blockName = '';
blockKind = '';
braces = 0;
for (let i = 0; i < destLines.length; i++) {
  const line = destLines[i];
  const m = line.match(enumRe);
  if (m && line.includes('export')) {
    if (blockStart >= 0 && blockName) {
      destBlocks.set(blockName, destLines.slice(blockStart, i).join('\n').trim());
    }
    blockStart = i;
    blockName = m[2];
    blockKind = m[1];
    destExports.add(blockName);
    braces = (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
    continue;
  }
  if (blockStart >= 0) {
    braces += (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
    if (braces <= 0) {
      destBlocks.set(blockName, destLines.slice(blockStart, i + 1).join('\n').trim());
      blockStart = -1;
      blockName = '';
    }
  }
}
if (blockStart >= 0 && blockName) {
  destBlocks.set(blockName, destLines.slice(blockStart).join('\n').trim());
}

const missing = [...srcExports].filter((n) => !destExports.has(n));
const extra = [...destExports].filter((n) => !srcExports.has(n));
const mismatched = [];
for (const name of srcExports) {
  if (!destExports.has(name)) continue;
  const a = (srcBlocks.get(name) || '').replace(/\/\/.*$/gm, '').trim();
  const b = (destBlocks.get(name) || '').replace(/\/\/.*$/gm, '').trim();
  if (a !== b) {
    mismatched.push(name);
  }
}

if (!missing.length && !extra.length && !mismatched.length) {
  console.log('TYPES_IN_SYNC');
  process.exit(0);
}

console.error(`TYPES_OUT_OF_SYNC`);
if (missing.length) console.error('missing:', missing.join(', '));
if (extra.length) console.error('extra:', extra.join(', '));
if (mismatched.length) console.error('mismatched:', mismatched.join(', '));
process.exit(1);
