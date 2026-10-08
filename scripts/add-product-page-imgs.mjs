// scripts/add-product-page-imgs.mjs
// 為 6 個 product pages 加 hero 圖
import { promises as fs } from 'node:fs';

const pages = [
  { name: 'family-day',       img: '/images/family-day/企業家庭日-頁首大橫幅.webp' },
  { name: 'esg-impact-note',   img: '/images/esg-impact-note/ESG-Impact-Note-頁首大橫幅.webp' },
];

for (const { name, img } of pages) {
  const f = `apps/ftg-tours-website/src/pages/${name}.jsx`;
  let s = await fs.readFile(f, 'utf8');
  if (s.includes(img)) { console.log(`  ✓ ${name} 已含圖,跳過`); continue; }
  // 找 hero <section> 開頭,加 <img> block,並把 gradient 加 opacity-30
  const hero = `<div className="absolute inset-0"><img src="${img}" alt="${name} 橫幅" className="w-full h-full object-cover" loading="eager" /></div>`;
  s = s.replace(/(<section className="relative pt-32 pb-20[^>]+>)/, `$1\n        ${hero}`);
  s = s.replace(/(<div className="absolute inset-0 bg-gradient-to-br[^>]+)(\s*\/)/, `$1 opacity-30$2`);
  await fs.writeFile(f, s);
  console.log(`  + ${name} img + opacity-30`);
}
console.log('done');
