import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to admin dashboard
    await page.goto('/en/admin');
  });

  test('should load admin dashboard without errors', async ({ page }) => {
    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');
    
    // Check that we're on the admin page
    await expect(page).toHaveURL(/.*\/admin/);
    
    // Look for admin dashboard elements
    const adminTitle = page.locator('h1, h2, [data-testid="admin-title"]').first();
    await expect(adminTitle).toBeVisible({ timeout: 10000 });
    
    // Check for key admin dashboard components
    const dashboardContent = page.locator('[data-testid="admin-dashboard"], .admin-dashboard, main').first();
    await expect(dashboardContent).toBeVisible();
  });

  test('should display statistics cards', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Look for statistics cards (common in admin dashboards)
    const statsCards = page.locator('[data-testid*="stat"], .stat-card, .metric-card');
    
    // Wait for at least one stats card to be visible
    await expect(statsCards.first()).toBeVisible({ timeout: 10000 });
    
    // Check that stats cards contain numbers or data
    const cardCount = await statsCards.count();
    expect(cardCount).toBeGreaterThan(0);
  });

  test('should handle filters without errors', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Look for filter dropdowns
    const filterSelect = page.locator('select, [role="combobox"], .filter-select').first();
    
    if (await filterSelect.isVisible()) {
      // Test changing a filter
      await filterSelect.click();
      
      // Wait for options to appear
      await page.waitForTimeout(500);
      
      // Select an option (try common admin filter values)
      const options = page.locator('option, [role="option"]');
      const optionCount = await options.count();
      
      if (optionCount > 1) {
        // Click the second option (first is usually default)
        await options.nth(1).click();
        
        // Wait for any loading states to complete
        await page.waitForLoadState('networkidle');
        
        // Verify no error messages appeared
        const errorMessages = page.locator('.error, [role="alert"], .alert-error');
        await expect(errorMessages).toHaveCount(0);
      }
    }
  });

  test('should handle pagination without errors', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Look for pagination elements
    const pagination = page.locator('.pagination, [aria-label*="pagination"], .page-nav');
    const nextButton = page.locator('button:has-text("Next"), button[aria-label*="next"], .next-page');
    const prevButton = page.locator('button:has-text("Previous"), button[aria-label*="previous"], .prev-page');
    
    if (await pagination.isVisible() || await nextButton.isVisible()) {
      console.log('Pagination found, testing navigation');
      
      if (await nextButton.isVisible() && await nextButton.isEnabled()) {
        await nextButton.click();
        await page.waitForLoadState('networkidle');
        
        // Verify no error messages
        const errorMessages = page.locator('.error, [role="alert"], .alert-error');
        await expect(errorMessages).toHaveCount(0);
        
        // Try going back if previous button is available
        if (await prevButton.isVisible() && await prevButton.isEnabled()) {
          await prevButton.click();
          await page.waitForLoadState('networkidle');
        }
      }
    } else {
      console.log('No pagination found on current page');
    }
  });

  test('should not display undefined errors in console', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    // Listen for console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Navigate and wait for page to fully load
    await page.goto('/en/admin');
    await page.waitForLoadState('networkidle');
    
    // Wait a bit more for any async operations
    await page.waitForTimeout(2000);
    
    // Filter out specific errors we're looking for
    const undefinedErrors = consoleErrors.filter(error => 
      error.includes('undefined') && 
      (error.includes('limit') || error.includes('status') || error.includes('filters'))
    );
    
    // Log all console errors for debugging
    if (consoleErrors.length > 0) {
      console.log('Console errors found:', consoleErrors);
    }
    
    // Assert no undefined-related errors
    expect(undefinedErrors).toHaveLength(0);
  });

  test('should load data tables without errors', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Look for data tables
    const tables = page.locator('table, [role="grid"], .data-table');
    
    if (await tables.count() > 0) {
      const firstTable = tables.first();
      await expect(firstTable).toBeVisible();
      
      // Check for table headers
      const headers = firstTable.locator('th, [role="columnheader"]');
      expect(await headers.count()).toBeGreaterThan(0);
      
      // Wait for table content to load
      await page.waitForTimeout(1000);
      
      // Check that there are no loading errors in the table
      const tableErrors = firstTable.locator('.error, .alert-error');
      await expect(tableErrors).toHaveCount(0);
    }
  });

  test('should handle search functionality if present', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Look for search inputs
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], .search-input');
    
    if (await searchInput.isVisible()) {
      // Test search functionality
      await searchInput.fill('test');
      
      // Wait for search results or loading
      await page.waitForTimeout(1000);
      await page.waitForLoadState('networkidle');
      
      // Clear search
      await searchInput.clear();
      await page.waitForTimeout(500);
      
      // Verify no errors during search
      const errorMessages = page.locator('.error, [role="alert"], .alert-error');
      await expect(errorMessages).toHaveCount(0);
    }
  });
});