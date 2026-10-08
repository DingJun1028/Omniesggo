// scripts/cf-create-billing-token.mjs
// ============================================================
// Puppeteer 自動化:開 Cloudflare Dashboard,讓用戶手動建 read-only billing token
// 自動偵測 token 出現並寫入 .env.local
// ============================================================
import puppeteer from 'file:///C:/Users/dingj/AppData/Roaming/npm/node_modules/puppeteer/lib/puppeteer/puppeteer.js';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const CF_DASH = 'https://dash.cloudflare.com';
const ACCOUNT_ID = 'd9d7ecd92cbad6d858fba3e529b9cb7b';
const ENV_FILE = path.join(process.cwd(), '.env.local');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  // 清掉舊 session
  const SESSION_DIR = path.join(os.tmpdir(), 'cf-junaikey-' + Date.now());
  await fs.mkdir(SESSION_DIR, { recursive: true });
  console.log('[cf-billing-token] session dir:', SESSION_DIR);

  const browser = await puppeteer.launch({
    headless: false,
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    userDataDir: SESSION_DIR,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    page.setDefaultNavigationTimeout(90000);

    // 開 token 建立頁
    console.log('[cf-billing-token] 開啟 token 建立頁...');
    try {
      await page.goto(`${CF_DASH}/${ACCOUNT_ID}/profile/api-tokens/create`, { waitUntil: 'load' });
    } catch (e) {
      console.log('[cf-billing-token] nav warn:', e.message.slice(0, 100));
    }
    await sleep(3000);

    // 若在 login 頁,等用戶登入
    if (page.url().includes('/login') || page.url().includes('auth.cloudflare')) {
      console.log('[cf-billing-token]');
      console.log('[cf-billing-token]  ╔══════════════════════════════════════════╗');
      console.log('[cf-billing-token]  ║  請在開啟的 Chrome 登入 Cloudflare        ║');
      console.log('[cf-billing-token]  ║  登入後 script 自動偵測繼續               ║');
      console.log('[cf-billing-token]  ╚══════════════════════════════════════════╝');
      try {
        await page.waitForFunction(
          () => !location.href.includes('/login') && !location.href.includes('auth.cloudflare'),
          { timeout: 300000, polling: 2000 }
        );
        await page.goto(`${CF_DASH}/${ACCOUNT_ID}/profile/api-tokens/create`, { waitUntil: 'load' });
        await sleep(3000);
      } catch (e) {
        console.log('[cf-billing-token] 登入逾時');
      }
    }

    // 開 Create Token 頁 (若仍在 dashboard 首頁)
    if (!page.url().includes('/api-tokens/create')) {
      try { await page.goto(`${CF_DASH}/${ACCOUNT_ID}/profile/api-tokens/create`, { waitUntil: 'load' }); } catch {}
      await sleep(3000);
    }

    console.log('[cf-billing-token]');
    console.log('[cf-billing-token]  ╔════════════════════════════════════════════════╗');
    console.log('[cf-billing-token]  ║  Chrome 已開到 token 建立頁。請手動:            ║');
    console.log('[cf-billing-token]  ║  1. 填 Token name: esggo-billing-readonly      ║');
    console.log('[cf-billing-token]  ║  2. Permissions: Account → Billing → Read     ║');
    console.log('[cf-billing-token]  ║  3. Account Resources: 此 account (d9d7ec...)  ║');
    console.log('[cf-billing-token]  ║  4. Continue to summary → Create Token        ║');
    console.log('[cf-billing-token]  ║                                                ║');
    console.log('[cf-billing-token]  ║  Token 出現時,本 script 自動偵測並寫入          ║');
    console.log('[cf-billing-token]  ║  .env.local 然後關閉 Chrome。                  ║');
    console.log('[cf-billing-token]  ║                                                ║');
    console.log('[cf-billing-token]  ║  或手動複製 token 值貼到本 terminal           ║');
    console.log('[cf-billing-token]  ║  形如: cf_xxxxxxxxx...                        ║');
    console.log('[cf-billing-token]  ╚════════════════════════════════════════════════╝');
    console.log('[cf-billing-token] 等 token 出現 (逾時 10 分鐘)...');

    // 自動偵測 token
    const token = await waitForToken(page, 600000);
    if (token) {
      await saveToken(token);
    } else {
      console.log('[cf-billing-token] 自動偵測逾時。請手動貼 token 到此 terminal:');
      const input = await readStdin(300000);
      if (input && /^cf_[A-Za-z0-9_-]{30,}$/.test(input.trim())) {
        await saveToken(input.trim());
      } else {
        console.log('[cf-billing-token] 未取得有效 token');
      }
    }
  } catch (e) {
    console.error('[cf-billing-token] FATAL:', e.message);
  } finally {
    await browser.close().catch(() => {});
  }

  async function waitForToken(p, timeout) {
    const start = Date.now();
    let lastUrl = '';
    while (Date.now() - start < timeout) {
      const cur = p.url();
      if (cur !== lastUrl) {
        console.log('[cf-billing-token]   page url:', cur);
        lastUrl = cur;
      }
      try {
        const t = await p.evaluate(() => {
          // 找頁面上的 token
          const text = document.body.innerText;
          const m = text.match(/cf_[A-Za-z0-9_-]{30,}/);
          if (m) return m[0];
          // 或 <code> 元素
          for (const c of document.querySelectorAll('code, pre')) {
            const v = (c.textContent || '').trim();
            if (/^cf_[A-Za-z0-9_-]{30,}$/.test(v)) return v;
          }
          // 或 readonly input
          for (const i of document.querySelectorAll('input[readonly], input[type="text"][value*="cf_"]')) {
            const v = (i.value || '').trim();
            if (/^cf_[A-Za-z0-9_-]{30,}$/.test(v)) return v;
          }
          return null;
        });
        if (t) return t;
      } catch (e) {
        // navigation in progress, retry
      }
      await sleep(2000);
    }
    return null;
  }

  async function saveToken(t) {
    console.log('[cf-billing-token] ✓ Token 取得 (len=' + t.length + ', prefix=' + t.slice(0, 12) + '...)');
    let env = '';
    try { env = await fs.readFile(ENV_FILE, 'utf8'); } catch {}
    if (/^CF_BILLING_READ_TOKEN=/m.test(env)) {
      env = env.replace(/^CF_BILLING_READ_TOKEN=.*$/m, `CF_BILLING_READ_TOKEN="${t}"`);
    } else {
      env = env.trimEnd() + `\nCF_BILLING_READ_TOKEN="${t}"\n`;
    }
    await fs.writeFile(ENV_FILE, env, 'utf8');
    console.log('[cf-billing-token] ✓ 寫入 .env.local (CF_BILLING_READ_TOKEN)');

    const v = await (await fetch('https://api.cloudflare.com/client/v4/user/tokens/verify', { headers: { 'Authorization': 'Bearer ' + t } })).json();
    console.log('[cf-billing-token] verify:', v.success ? '✓ active' : '✗ ' + JSON.stringify(v.errors));

    const a = 'd9d7ecd92cbad6d858fba3e529b9cb7b';
    const b = await (await fetch(`https://api.cloudflare.com/client/v4/accounts/${a}/billing/usage?start=2026-10-01&end=2026-10-08`, { headers: { 'Authorization': 'Bearer ' + t } })).json();
    if (b.success) {
      console.log('[cf-billing-token] ✓ billing read OK!');
    } else {
      console.log('[cf-billing-token] billing 仍不行:', JSON.stringify(b.errors?.[0]));
    }
  }
})();

function readStdin(timeout) {
  return new Promise(resolve => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', d => { data += d; if (data.includes('\n')) resolve(data.trim()); });
    process.stdin.on('end', () => resolve(data.trim()));
    setTimeout(() => resolve(data.trim()), timeout);
  });
}
