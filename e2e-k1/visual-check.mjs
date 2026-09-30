// 視覺驗證：真實無頭瀏覽器渲染 FTG Journey App。
// 用獨立 headless Chromium（不碰使用者已開啟的真實 profile）。
// 依 skill 'node-e2e-verification'：背景 shell 會吞 stdout，故結果寫入檔案後再讀。
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const OUT = process.argv[2] || 'C:/Users/dingj/AppData/Local/hermes/cache/scratch/visual/out';
mkdirSync(OUT, { recursive: true });

const APP = 'http://127.0.0.1:5173';
const JID = 'visualjourney01';
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const TOKEN = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({
  email: 'visual@e2e.local',
  name: '視覺驗證員',
  exp: 4102444800,
})}.visualsig`;

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844, isMobile: true, hasTouch: true },
];

const report = [];
const log = (s) => { report.push(s); console.log(s); };

const browser = await chromium.launch();

try {
  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
      isMobile: !!vp.isMobile,
      hasTouch: !!vp.hasTouch,
      locale: 'zh-TW',
    });
    const page = await ctx.newPage();

    const consoleErrors = [];
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200)); });
    page.on('pageerror', (e) => consoleErrors.push('PAGEERROR: ' + String(e).slice(0, 200)));

    await page.addInitScript((t) => { localStorage.setItem('ftg_token', t); }, TOKEN);

    log(`\n########## ${vp.name} (${vp.width}x${vp.height}) ##########`);

    // ── 1. 覺曉流頁面 ──
    await page.goto(`${APP}/journey/${JID}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);

    log(`[${vp.name}] URL = ${page.url()}`);
    log(`[${vp.name}] 標題 = ${JSON.stringify(await page.title())}`);

    // 找 ESG 分頁
    const tabs = await page.$$eval('button, a', (els) =>
      els.map((e) => e.textContent.trim()).filter((t) => t && t.length < 12)
    );
    log(`[${vp.name}] 可見 tab/按鈕文字 = ${JSON.stringify([...new Set(tabs)].slice(0, 24))}`);

    // 截圖：覺曉流總覽
    await page.screenshot({ path: path.join(OUT, `${vp.name}-01-journey.png`), fullPage: false });
    log(`[${vp.name}] 截圖 journey.png 已存`);

    // ── 2. 進入 ESG 任務分頁 ──
    const esgTab = await page.$('text=ESG');
    if (esgTab) {
      await esgTab.click();
      await page.waitForTimeout(1200);
      await page.screenshot({ path: path.join(OUT, `${vp.name}-02-esg-tab.png`) });
      log(`[${vp.name}] 已點 ESG 分頁並截圖`);
    } else {
      log(`[${vp.name}] !! 找不到 ESG 分頁`);
    }

    // ── 3. 關鍵驗證：點碳足跡任務卡，modal 是否真的開出來（缺陷 A 修正後）──
    const card = await page.$('text=碳足跡記錄');
    if (card) {
      await card.click();
      await page.waitForTimeout(900);
      const modalVisible = await page.$('div.fixed.inset-0');
      log(`[${vp.name}] 點「碳足跡記錄」後 modal 出現 = ${!!modalVisible}`);

      // 讀出 modal 內的實際欄位（證明 fields 有送到前端並被渲染）
      const modalText = await page.$eval('body', () => document.body.innerText).catch(() => '');
      const hasDistance = modalText.includes('移動距離');
      const hasMode = modalText.includes('交通方式');
      const hasPassengers = modalText.includes('乘客人數');
      log(`[${vp.name}] modal 欄位: 移動距離=${hasDistance} 交通方式=${hasMode} 乘客人數=${hasPassengers}`);

      // select 選項是否渲染出來
      const options = await page.$$eval('select option', (els) => els.map((e) => e.textContent)).catch(() => []);
      log(`[${vp.name}] select 選項 = ${JSON.stringify(options)}`);

      // 量測 modal 是否有溢出（文字/版面）
      const box = await page.$eval('div.fixed.inset-0 > div', (el) => {
        const r = el.getBoundingClientRect();
        return { w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top), left: Math.round(r.left) };
      }).catch(() => null);
      log(`[${vp.name}] modal 尺寸 = ${JSON.stringify(box)}`);
      log(`[${vp.name}] 視窗 = ${vp.width}x${vp.height}；modal 溢出橫向 = ${box ? (box.left < 0 || box.left + box.w > vp.width) : 'n/a'}`);

      await page.screenshot({ path: path.join(OUT, `${vp.name}-03-carbon-modal.png`) });
      log(`[${vp.name}] 截圖 carbon-modal.png 已存`);
    } else {
      log(`[${vp.name}] !! 找不到「碳足跡記錄」任務卡`);
      await page.screenshot({ path: path.join(OUT, `${vp.name}-03-NO-CARD.png`) });
    }

    log(`[${vp.name}] console 錯誤 (${consoleErrors.length}) = ${JSON.stringify(consoleErrors.slice(0, 5))}`);

    // ── 4. 留念流 Impact Note（本次修正動到 totalImpact 移除）──
    await page.goto(`${APP}/journey/${JID}/impact-note`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    const noteText = await page.$eval('body', () => document.body.innerText).catch(() => '');
    log(`[${vp.name}] Impact Note 含「碳減量」= ${noteText.includes('碳減量')}`);
    log(`[${vp.name}] Impact Note 含「步行距離」= ${noteText.includes('步行距離')}`);
    log(`[${vp.name}] Impact Note 含「垃圾撿拾」= ${noteText.includes('垃圾撿拾')}`);
    log(`[${vp.name}] Impact Note 含「在地消費」= ${noteText.includes('在地消費')}`);
    log(`[${vp.name}] Impact Note 含「節約用水」= ${noteText.includes('節約用水')}`);
    await page.screenshot({ path: path.join(OUT, `${vp.name}-04-impact-note.png`) });
    log(`[${vp.name}] 截圖 impact-note.png 已存`);

    // 抓 Impact Note 上呈現的數值，確認單位（缺陷 B/D 的對外呈現）
    const metricCards = await page.$$eval('body', () => {
      const t = document.body.innerText;
      return t.split('\n').filter((l) => /\d/.test(l)).slice(0, 40);
    }).catch(() => []);
    log(`[${vp.name}] Impact Note 含數字的行 = ${JSON.stringify(metricCards.slice(0, 20))}`);
    log(`[${vp.name}] console 錯誤 (impact note) (${consoleErrors.length}) = ${JSON.stringify(consoleErrors.slice(0, 5))}`);

    await ctx.close();
  }
} catch (e) {
  log('FATAL: ' + String(e).slice(0, 500));
} finally {
  await browser.close();
  writeFileSync(path.join(OUT, 'report.txt'), report.join('\n'), 'utf8');
  console.log('\n=== report written to ' + path.join(OUT, 'report.txt') + ' ===');
}
