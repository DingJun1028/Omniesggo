import { test, expect } from '@playwright/test';

test.describe('Ollama Report Generation (Zero-Cost Local)', () => {
  test('Sonnar intelligence page should load and interact', async ({ page }) => {
    await page.goto('/sonnar');
    
    // Check main elements
    await expect(page.getByText('Sonnar 威脅情資雷達')).toBeVisible();
    await expect(page.getByPlaceholder(/輸入企業公開 ESG/)).toBeVisible();
    
    // Fill the URL and simulate scan
    const urlInput = page.getByPlaceholder(/輸入企業公開 ESG/);
    await urlInput.fill('https://example.com/esg-report');
    
    const scanButton = page.getByRole('button', { name: '發射探測波' });
    await expect(scanButton).not.toBeDisabled();
    
    // Note: We don't actually trigger the full scan in basic E2E unless we mock the API
    // or run a dedicated Ollama test instance to avoid timeouts, 
    // but we ensure the UI state transitions are ready.
  });
});
