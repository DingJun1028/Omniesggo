import { chromium } from 'playwright';

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const TOKEN = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({
  email: 'visual@e2e.local', name: '視覺驗證員', exp: 4102444800,
})}.visualsig`;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.addInitScript((t) => { localStorage.setItem('ftg_token', t); }, TOKEN);

page.on('request', (r) => {
  if (r.url().includes('/api/')) console.log('REQ ', r.method(), r.url());
});
page.on('response', async (r) => {
  if (r.url().includes('/api/')) {
    const body = await r.text().catch(() => '');
    console.log('RES ', r.status(), r.url(), '|', body.slice(0, 120).replace(/\n/g, ' '));
  }
});

await page.goto('http://127.0.0.1:5173/journey/visualjourney01', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

console.log('\n--- API_BASE the bundle actually uses ---');
console.log(await page.evaluate(() => {
  // 從已載入的模組行為反推：直接看 fetch 目標
  return document.querySelector('body') ? 'body rendered' : 'no body';
}));

console.log('\n--- direct backend probe from page context ---');
const probe = await page.evaluate(async () => {
  const t = localStorage.getItem('ftg_token');
  const r = await fetch('http://127.0.0.1:8790/api/me', { headers: { Authorization: 'Bearer ' + t } });
  return { status: r.status, body: (await r.text()).slice(0, 200) };
});
console.log('page->8790 /api/me =', JSON.stringify(probe));

await browser.close();
