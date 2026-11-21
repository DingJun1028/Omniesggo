import { test, expect } from '@playwright/test';

const RWD_PAGES = ['/', '/omni-center'];

test.describe('RWD viewport guard (OmniBook §5)', () => {
  for (const path of RWD_PAGES) {
    test(`no horizontal overflow at 375px on ${path}`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(path);

      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });

    test(`no horizontal overflow at 768px on ${path}`, async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto(path);

      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});
