import { test, expect } from '@playwright/test';

test.describe('OmniSub Akkadu Integration & Live Broadcast Wall', () => {
  test('OmniSub page should render Akkadu stream controller and broadcast wall', async ({ page }) => {
    await page.goto('/omnisub');

    // Verify main titles
    await expect(page.getByText(/OmniSub.esggo.co 萬能即時語音與 Akkadu 字幕轉播牆/)).toBeVisible();
    await expect(page.getByText(/Akkadu 即時連線 · 字幕轉播牆/)).toBeVisible();

    // Verify view mode buttons
    await expect(page.getByRole('button', { name: '轉播牆' })).toBeVisible();
    await expect(page.getByRole('button', { name: '網格卡片' })).toBeVisible();
    await expect(page.getByRole('button', { name: '跑馬燈' })).toBeVisible();

    // Verify room code input
    const roomInput = page.locator('input[value="AKKADU-LIVE-888"]');
    await expect(roomInput).toBeVisible();
  });
});
