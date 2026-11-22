import { test, expect } from '@playwright/test';

/**
 * JunAiKey 儀表板 RWD 三視口防護
 * README §6 / OmniBook §5 硬標準：
 *   - 375（mobile）/ 768（tablet）/ 1280（desktop）零水平捲動（scrollWidth ≤ clientWidth）
 *   - CTA 可點擊區 ≥ 44×44px（行動視口）
 * 頁面：/junaikey-dashboard.html（public 靜態頁；樣式表為 @esggo/tailwind-preset/junaikey-ui 之逐位元組鏡像＋應用層）
 */

const PAGE = '/junaikey-dashboard.html';
const VIEWPORTS = [
  { label: 'mobile 375x667', width: 375, height: 667 },
  { label: 'tablet 768x1024', width: 768, height: 1024 },
  { label: 'desktop 1280x720', width: 1280, height: 720 },
];

const horizontalOverflow = () =>
  document.documentElement.scrollWidth - document.documentElement.clientWidth;

test.describe('JunAiKey dashboard RWD guard (§6 三視口硬標準)', () => {
  for (const vp of VIEWPORTS) {
    test(`no horizontal overflow at ${vp.label}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(PAGE);
      expect(await page.evaluate(horizontalOverflow)).toBeLessThanOrEqual(0);
    });
  }

  test('CTA hit area >= 44x44px at 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(PAGE);
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
