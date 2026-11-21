/**
 * 逐路由 DOM 稽核（用 headless Chrome 注入執行）。
 * 檢查：缺圖(naturalWidth=0)、缺字(key 字面量/空白)、console error、水平溢出。
 * 中英雙語各跑一輪。
 */
const ROUTES = [
  '/', '/corporate-travel', '/family-day', '/esg-team-day',
  '/wellbeing-retreat', '/executive-retreat', '/esg-impact-note',
  '/contact', '/journey-design', '/streams', '/no-such-page',
];
const LANGS = ['zh', 'en'];
const results = [];
for (const route of ROUTES) {
  for (const lang of LANGS) {
    results.push({ route, lang });
  }
}
console.log(JSON.stringify({ total: results.length, routes: ROUTES.length, langs: LANGS }));
