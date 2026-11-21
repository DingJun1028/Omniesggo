import { execSync } from 'node:child_process';
import { translateDetailed, translateToMany } from './translate.mjs';

console.log('=== node --check ===');
try { execSync('node --check server.mjs'); console.log('server.mjs OK'); } catch(e){ console.log('server.mjs FAIL', e.message); }
try { execSync('node --check translate.mjs'); console.log('translate.mjs OK'); } catch(e){ console.log('translate.mjs FAIL', e.message); }

console.log('\n=== 功能驗證: 繁中<->英文 雙向 ===');
const r1 = await translateDetailed('歡迎來到永續發展論壇', 'auto', 'en');
console.log('繁中->英文:', r1.text, '| engine=', r1.engine, '| cached=', r1.cached);
console.log('  ✓ 未被誤判同語跳過:', r1.text !== '歡迎來到永續發展論壇');
const r2 = await translateToMany('Thank you very much', 'auto', ['zh-TW']);
console.log('英文->[zh-TW]:', JSON.stringify(r2.translations), '| engines=', JSON.stringify(r2.engines));
console.log('  ✓ 目標 key 為 zh-TW (非 zh-CN):', 'zh-TW' in r2.translations);
const r3 = await translateDetailed('我們重視包容性創新', 'zh-TW', 'en');
console.log('繁中(zh-TW)->英文:', r3.text, '| engine=', r3.engine);
console.log('\n✅ 交付版驗證完成 (v1.4.0)');
