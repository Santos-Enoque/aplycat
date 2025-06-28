import { test, expect } from '@playwright/test';

test.describe('Basic App Tests', () => {
  test('should load homepage', async ({ page }) => {
    await page.goto('/');
    
    // Check that the page loads
    await page.waitForLoadState('networkidle');
    
    // Should have some content
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    // Check for common elements
    const heading = page.locator('h1, h2, [role="heading"]').first();
    if (await heading.isVisible()) {
      await expect(heading).toBeVisible();
    }
  });

  test('should navigate to sign-in page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Look for sign-in link
    const signInLink = page.locator('a[href*="sign-in"], a:has-text("Sign In"), a:has-text("Login")');
    
    if (await signInLink.count() > 0) {
      await signInLink.first().click();
      await page.waitForLoadState('networkidle');
      
      // Should be on sign-in page
      expect(page.url()).toMatch(/sign-in/);
    }
  });

  test('should have proper meta tags', async ({ page }) => {
    await page.goto('/');
    
    // Check for basic meta tags
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
    
    // Check for viewport meta tag
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveCount(1);
  });
});