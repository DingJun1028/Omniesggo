import { test, expect } from '@playwright/test';

const RWD_URL = process.env.RWD_URL || 'http://localhost:52800';

const VIEWPORTS = [
  { width: 360, height: 740 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
];

for (const vp of VIEWPORTS) {
  test.describe(`RWD ${vp.width}px`, () => {
    test.use({ viewport: vp });
    test('platform renders without horizontal overflow', async ({ page }) => {
      await page.goto(RWD_URL);
      await expect(page.getByRole('heading', { name: /全能力整合/ })).toBeVisible();
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
    });
    test('skip link exists', async ({ page }) => {
      await page.goto(RWD_URL);
      await expect(page.locator('a[href="#main"]')).toBeAttached();
    });
  });
}