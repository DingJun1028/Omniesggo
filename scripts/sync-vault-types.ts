/**
 * sync-vault-types.ts — OA-Team 第二大腦雙向同步橋（vault → canonical 方向）
 *
 * 全域全端全量全面 · 雙向 TypeScript 終始矩陣
 * 終 (canonical): esggo/shared/types.ts
 * 始 (vault):     vault/Agents 下所有 .md 筆記，內含 ts 代碼區塊且 frontmatter 標 sync:up
 *
 * 職責：掃描 vault 筆記中標記 sync:up 的 TypeScript code-block，
 *       萃取其中的 type/interface/enum 定義，與 canonical 比對，
 *       輸出「應回饋 canonical 的 diff 建議」JSON（不直接改 canonical，避免破窗）。
 *       人工/CI 審閱後再合入 shared/types.ts → 重跑 export-shared-types.js 全端同步。
 *
 * 用法：npx tsx scripts/sync-vault-types.ts [--apply]
 *   --apply：自動附加新型別到 shared/types.ts 末端（僅限 vault 有而 canonical 無者）
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const VAULT = path.join(ROOT, 'vault', 'Agents');
const SRC = path.join(ROOT, 'shared', 'types.ts');

interface VaultType {
  name: string;
  kind: 'type' | 'interface' | 'enum';
  block: string;
  from: string;
}

function walk(dir: string): string[] {
  const out: string[] = [];
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (e.name.endsWith('.md')) out.push(p);
  }
  return out;
}

function extractSyncedTypes(file: string): VaultType[] {
  const text = fs.readFileSync(file, 'utf8');
  const fm = text.slice(0, text.indexOf('\n---') > 0 ? text.indexOf('\n---') : 0);
  if (!/sync:\s*up/.test(fm)) return []; // 僅處理標 sync:up 的筆記
  const re = /```ts\s*\n([\s\S]*?)```/g;
  const out: VaultType[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const code = m[1];
    const tmatch = code.match(/export\s+(type|interface|enum)\s+([A-Za-z0-9_]+)/);
    if (tmatch) {
      out.push({
        name: tmatch[2],
        kind: tmatch[1] as VaultType['kind'],
        block: code.trim(),
        from: path.relative(ROOT, file),
      });
    }
  }
  return out;
}

const notes = walk(VAULT);
const vaultTypes = notes.flatMap(extractSyncedTypes);

// C 線深入: 納入萬能知識分身的型別投影 (.avatar-types.d.ts) 作為來源
const AVATAR_TYPES = path.join(VAULT, 'context', '.avatar-types.d.ts');
if (fs.existsSync(AVATAR_TYPES)) {
  const atext = fs.readFileSync(AVATAR_TYPES, 'utf8');
  const are = /export\s+(type|interface|enum)\s+([A-Za-z0-9_]+)[\s\S]*?\n}/g;
  let am: RegExpExecArray | null;
  while ((am = are.exec(atext))) {
    vaultTypes.push({
      name: am[2],
      kind: am[1] as VaultType['kind'],
      block: am[0],
      from: 'vault/Agents/context/.avatar-types.d.ts (avatar projection)',
    });
  }
}

const canonical = fs.readFileSync(SRC, 'utf8');
const canonicalNames = new Set(
  [...canonical.matchAll(/export\s+(?:type|interface|enum)\s+([A-Za-z0-9_]+)/g)].map((x) => x[1])
);

const missing = vaultTypes.filter((t) => !canonicalNames.has(t.name));
const report = {
  scanned: notes.length,
  vaultTypes: vaultTypes.length,
  canonicalNames: canonicalNames.size,
  suggestedAdditions: missing.map((t) => ({ name: t.name, kind: t.kind, from: t.from, block: t.block })),
};

console.log(JSON.stringify(report, null, 2));

if (process.argv.includes('--apply') && missing.length > 0) {
  const append = '\n\n' + missing.map((t) => t.block).join('\n\n') + '\n';
  fs.appendFileSync(SRC, append, 'utf-8');
  console.log(`\nApplied ${missing.length} type(s) to ${path.relative(ROOT, SRC)}`);
}
