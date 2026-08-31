#!/usr/bin/env node
/**
 * 萬能知識分身 · MOC 狀態回流 (avatar-moc-sync)
 * 讀 avatar-metrics.json, 更新 00-Index.md 的「知識分身日報」狀態行。
 * OA 蜂群讀 vault 即得每日健康度。
 */
import fs from 'node:fs';
import path from 'node:path';

const METRICS = process.env.AVATAR_METRICS || path.resolve('avatar-metrics.json');
const MOC = path.resolve('vault', 'Agents', 'context', '00-Index.md');

if (!fs.existsSync(METRICS)) { console.log('[moc] 無 metrics, skip'); process.exit(0); }
const m = JSON.parse(fs.readFileSync(METRICS, 'utf8'));
if (!fs.existsSync(MOC)) { console.log('[moc] 無 MOC, skip'); process.exit(0); }

let s = fs.readFileSync(MOC, 'utf8');
const line = `> 知識分身日報: hatched=${m.hatched} synced=${m.synced} failed=${m.syncFailed} recall=${m.recall} healthy=${m.healthy} ${new Date().toISOString()}`;
if (s.includes('知識分身日報')) {
  s = s.replace(/^> 知識分身日報.*$/m, line);
} else {
  s += '\n' + line + '\n';
}
fs.writeFileSync(MOC, s);
console.log('[moc] ✅ 狀態回流 MOC:', line);
