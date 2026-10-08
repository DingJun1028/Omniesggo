import { chromium } from 'playwright';

const BASE = 'https://htb.esggo.co/';
const routes = ['', '#/about', '#/technology', '#/cases', '#/partnership', '#/contact', '#/nuber', '#/sgs', '#/news', '#/faq', '#/investor'];

const browser = await chromium.launch({ headless: true });

async function inspect(label, viewport) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1, bypassCSP: true });
  const page = await ctx.newPage();
  const errors = [];
  const failed = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message.slice(0, 200)));
  page.on('requestfailed', r => failed.push(r.url().slice(0, 120) + ' :: ' + (r.failure()?.errorText || '')));
  page.on('response', r => { if (r.status() >= 400) failed.push('HTTP ' + r.status() + ' ' + r.url().slice(0, 120)); });

  console.log(`\n===== ${label} (${viewport.width}x${viewport.height}) =====`);
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(2500);

  const rootHtml = await page.evaluate(() => document.getElementById('root')?.innerHTML?.length || 0);
  const title = await page.title();
  const bodyText = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 400));
  console.log(`title="${title}"  rootHtmlLen=${rootHtml}`);
  console.log(`bodyText="${bodyText}"`);
  console.log(`consoleErrors=${JSON.stringify(errors)}`);
  console.log(`failedRequests=${JSON.stringify([...new Set(failed)])}`);

  // Images
  const imgs = await page.evaluate(() => Array.from(document.querySelectorAll('img')).map(i => ({ src: i.getAttribute('src'), nw: i.naturalWidth, nh: i.naturalHeight })));
  console.log(`images(${imgs.length})=${JSON.stringify(imgs)}`);

  // overflow check
  const overflow = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  console.log(`overflow: scrollWidth=${overflow.sw} clientWidth=${overflow.cw} ${overflow.sw > overflow.cw + 2 ? '*** HORIZONTAL OVERFLOW ***' : 'ok'}`);

  await page.screenshot({ path: `C:/Users/dingj/AppData/Local/hermes/cache/scratch/htb-${label}-home.png`, fullPage: false });
  await ctx.close();
  return { errors, failed, rootHtml };
}

await inspect('desktop', { width: 1440, height: 900 });
await inspect('mobile', { width: 390, height: 844 });

// Route smoke test on mobile
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
const routeResults = [];
for (const r of routes) {
  const url = BASE + r;
  const errs = [];
  page.removeAllListeners('pageerror');
  page.on('pageerror', e => errs.push(e.message.slice(0, 120)));
  await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(1200);
  const len = await page.evaluate(() => document.getElementById('root')?.innerHTML?.length || 0);
  const h = await page.evaluate(() => document.querySelector('h1,h2')?.innerText?.slice(0, 60) || '(no heading)');
  routeResults.push({ route: r || '(home)', rootHtmlLen: len, heading: h, errors: errs });
}
console.log('\n===== ROUTE SMOKE TEST (mobile 390px) =====');
for (const r of routeResults) console.log(JSON.stringify(r));
await ctx.close();
await browser.close();
