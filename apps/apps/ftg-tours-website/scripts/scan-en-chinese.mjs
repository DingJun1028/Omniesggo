/**
 * 5T-Transparent：掃描 en 字典裡殘留的繁體中文。
 *
 * 為什麼需要這個腳本：
 *   使用者回報「英文版 還是繁體中文」。check_i18n_missing.py 只驗證
 *   *key 是否存在*，全部 PASS —— 但 key 在 ≠ 值已翻譯。
 *   en 樹裡若某個值仍是「行程規劃」，切到英文版就會看到中文。
 *
 * 只報 en 分支，不報 zh（zh 當然要有中文）。
 * 排除「刻意保留」的語意：品牌名、繁中專有名詞、台/香港地名等由白名單放行。
 */
import { translations } from '../src/i18n/translations.js';

const CJK = /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/;

// 刻意保留的中文：品牌 / 專有名詞 / 法規名稱，翻譯反而會讓人找不到。
const ALLOW = [
  '墾趣', 'FTG', 'ESG', '台', '臺灣', '繁體',
];

function walk(node, path, out) {
  if (typeof node === 'string') {
    if (CJK.test(node) && !ALLOW.some((a) => node.includes(a))) {
      out.push({ path, value: node });
    }
    return;
  }
  if (Array.isArray(node)) {
    node.forEach((v, i) => walk(v, `${path}[${i}]`, out));
    return;
  }
  if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) walk(v, path ? `${path}.${k}` : k, out);
  }
}

const hits = [];
const total = (function count(n) {
  if (typeof n === 'string') return 1;
  if (Array.isArray(n)) return n.reduce((s, v) => s + count(v), 0);
  if (n && typeof n === 'object') return Object.values(n).reduce((s, v) => s + count(v), 0);
  return 0;
})(translations.en ?? {});

walk(translations.en ?? {}, '', hits);

console.log(`en 字串總數: ${total}`);
console.log(`含未翻譯中文: ${hits.length}`);
console.log();
if (hits.length) {
  for (const h of hits.slice(0, 80)) {
    console.log(`  ${h.path}\n      → ${JSON.stringify(h.value)}`);
  }
  if (hits.length > 80) console.log(`  ... 另有 ${hits.length - 80} 項`);
}
process.exit(hits.length ? 1 : 0);
