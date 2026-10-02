import { test, expect } from '@playwright/test';

test.describe('Liquid Glass UI/UX Verification', () => {
  test('Home page should load with correct styling', async ({ page }) => {
    await page.goto('/');
    
    // Check main title
    await expect(page.locator('h1').first()).toBeVisible();
    
    // Verify Liquid Glass background exists
    const body = page.locator('body');
    await expect(body).toHaveClass(/bg-slate-950/);
    await expect(body).toHaveClass(/text-slate-200/);
  });

  test('Omni-Center should have OmniCard components', async ({ page }) => {
    await page.goto('/omni-center');
    
    // Verify layout and basic Liquid Glass elements
    await expect(page.getByText('Omni 萬能中樞')).toBeVisible();
    await expect(page.locator('.backdrop-blur-xl').first()).toBeVisible();
  });
});
