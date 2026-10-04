import { test, expect } from '@playwright/test';

test.describe('Liquid Glass UI/UX Verification', () => {
  test('Home page should load with correct styling', async ({ page }) => {
    await page.goto('/');
    
    // Check main title or header
    await expect(page.locator('h1, h2').first()).toBeVisible();
    
    // Verify Liquid Glass background exists
    const body = page.locator('body');
    await expect(body).toHaveClass(/min-h-screen/);
  });

  test('Omni-Center should have OmniCard components', async ({ page }) => {
    await page.goto('/omni-center');
    
    // Verify layout and basic Liquid Glass elements
    await expect(page.getByText(/萬能中心/)).toBeVisible();
    await expect(page.locator('.backdrop-blur-md, .backdrop-blur-xl').first()).toBeVisible();
  });

  test('Local AI Station page should load with model switcher and presets', async ({ page }) => {
    await page.goto('/local-ai');
    
    // Verify header and title
    await expect(page.getByText(/Local AI Station/).first()).toBeVisible();
    await expect(page.getByText(/零雲端成本/).first()).toBeVisible();
    await expect(page.getByPlaceholder(/輸入關於 ESG 碳盤查/)).toBeVisible();
  });
});
