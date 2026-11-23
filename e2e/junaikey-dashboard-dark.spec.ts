import { test, expect } from '@playwright/test';

/**
 * JunAiKey 儀表板深色主題 RWD 三視口防護
 * 視覺驗收規範判準 3（雙主題各別通過 README §6 三視口硬標準）：
 *   - 375（mobile）/ 768（tablet）/ 1280（desktop）零水平捲動（scrollWidth ≤ clientWidth）
 *   - CTA 可點擊區 ≥ 44×44px（行動視口）
 * 頁面：/junaikey-dashboard.html（樣式表為 @esggo/tailwind-preset/junaikey-ui
 * 之逐位元組鏡像＋應用層；深色代幣由 junkey-ui.css v1.2 之 [data-theme="dark"] 區段提供）
 * 深色主題生效路徑：主題切換腳本（第 13 節 setTheme）以 localStorage 鍵
 * junaikey-theme 持久化，故以 addInitScript 預置鍵值，與手動切換 #theme-toggle 等義。
 */

const PAGE = '/junaikey-dashboard.html';
const VIEWPORTS = [
  { label: 'mobile 375x667', width: 375, height: 667 },
  { label: 'tablet 768x1024', width: 768, height: 1024 },
  { label: 'desktop 1280x720', width: 1280, height: 720 },
];

const horizontalOverflow = () =>
  document.documentElement.scrollWidth - document.documentElement.clientWidth;

test.describe('JunAiKey dashboard dark theme RWD guard (§6 三視口硬標準)', () => {
  test.beforeEach(async ({ page }) => {
    // 走網站自身之主題持久化路徑，確保載入即為深色（不仰賴切換按鈕之點擊時序）
    await page.addInitScript(() => {
      try { localStorage.setItem('junaikey-theme', 'dark'); } catch (err) { /* 私密模式容錯，同主題腳本 */ }
    });
  });

  // 防呆：斷言深色主題確實生效，避免陷入「其實跑淺色」之假綠
  test('dark theme applied via persisted preference', async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('#theme-toggle')).toHaveAttribute('aria-pressed', 'true');
  });

  for (const vp of VIEWPORTS) {
    test(`dark: no horizontal overflow at ${vp.label}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(PAGE);
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
      expect(await page.evaluate(horizontalOverflow)).toBeLessThanOrEqual(0);
    });
  }

  test('dark: CTA hit area >= 44x44px at 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(PAGE);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    const offenders = await page.evaluate(() => {
      const bad: Array<{ label: string; w: number; h: number }> = [];
      const nodes = document.querySelectorAll('button, [role="button"]');
      for (const el of Array.from(nodes)) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue; // 未顯示（關閉中的對話框與彈出層）
        if (r.width < 44 || r.height < 44) {
          const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
          const aria = el.getAttribute('aria-label') || '';
          const cls = typeof el.className === 'string' ? el.className : '';
          bad.push({ label: (text || aria || cls || '?').slice(0, 24), w: Math.round(r.width), h: Math.round(r.height) });
        }
      }
      return bad;
    });
    expect(offenders).toEqual([]);
  });
});
