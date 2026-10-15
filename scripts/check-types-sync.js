import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const SRC = path.resolve(ROOT, 'shared', 'types.ts');
const DEST_ROOT = path.resolve(ROOT, 'types', 'generated', 'esggo-shared.d.ts');
const DEST_LC = path.resolve(ROOT, 'apps', 'learning-center', 'types', 'generated', 'esggo-shared.d.ts');

if (!fs.existsSync(SRC)) {
  console.error(`SRC missing: ${SRC}`);
  process.exit(1);
}

const checkSync = (destPath, label) => {
  if (!fs.existsSync(destPath)) {
    console.error(`DEST missing (${label}): ${destPath}`);
    return false;
  }
  const srcContent = fs.readFileSync(SRC, 'utf-8').replace(/\r\n/g, '\n');
  const destContent = fs.readFileSync(destPath, 'utf-8').replace(/\r\n/g, '\n');

  const enumRe = /^(?:export\s+)?(?:type\s+)?(enum|interface|type)\s+([A-Za-z_][A-Za-z0-9_]*)\b/;

  const parseBlocks = (content) => {
    const exports = new Set();
    const blocks = new Map();
    const lines = content.split('\n');
    let blockStart = -1;
    let blockName = '';
    let braces = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const m = line.match(enumRe);
      if (m && line.includes('export')) {
        if (blockStart >= 0 && blockName) {
          blocks.set(blockName, lines.slice(blockStart, i).join('\n').trim());
        }
        blockStart = i;
        blockName = m[2];
        exports.add(blockName);
        braces = (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
        continue;
      }
      if (blockStart >= 0) {
        braces += (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
        if (braces <= 0) {
          blocks.set(blockName, lines.slice(blockStart, i + 1).join('\n').trim());
          blockStart = -1;
          blockName = '';
        }
      }
    }
    if (blockStart >= 0 && blockName) {
      blocks.set(blockName, lines.slice(blockStart).join('\n').trim());
    }
    return { exports, blocks };
  };

  const src = parseBlocks(srcContent);
  const dest = parseBlocks(destContent);

  const missing = [...src.exports].filter((n) => !dest.exports.has(n));
  const extra = [...dest.exports].filter((n) => !src.exports.has(n));
  const mismatched = [];
  for (const name of src.exports) {
    if (!dest.exports.has(name)) continue;
    const a = (src.blocks.get(name) || '').replace(/\/\/.*$/gm, '').trim();
    const b = (dest.blocks.get(name) || '').replace(/\/\/.*$/gm, '').trim();
    if (a !== b) mismatched.push(name);
  }

  if (missing.length || extra.length || mismatched.length) {
    console.error(`TYPES_OUT_OF_SYNC (${label})`);
    if (missing.length) console.error('  missing:', missing.join(', '));
    if (extra.length) console.error('  extra:', extra.join(', '));
    if (mismatched.length) console.error('  mismatched:', mismatched.join(', '));
    return false;
  }
  return true;
};

const okRoot = checkSync(DEST_ROOT, 'root');
const okLC = checkSync(DEST_LC, 'learning-center');

if (okRoot && okLC) {
  console.log('TYPES_IN_SYNC');
  process.exit(0);
} else {
  process.exit(1);
}
