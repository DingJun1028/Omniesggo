import { test, expect } from '@playwright/test';

test.describe('Ollama Report Generation (Zero-Cost Local)', () => {
  test('Sonnar intelligence page should load and interact', async ({ page }) => {
    await page.goto('/sonnar');
    
    // Check main elements
    await expect(page.getByText('Sonnar 威脅情資雷達')).toBeVisible();
    
    const urlInput = page.getByPlaceholder(/輸入企業公開 ESG/);
    await expect(urlInput).toBeVisible();
    await urlInput.fill('https://example.com/esg-report');
    await urlInput.dispatchEvent('input');
    
    const scanButton = page.getByRole('button', { name: '發射探測波' });
    await expect(scanButton).toBeVisible();
  });
});
