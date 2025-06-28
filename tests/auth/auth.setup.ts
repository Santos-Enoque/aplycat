import { test as setup, expect } from '@playwright/test';
import { clerk } from '@clerk/testing/playwright';
import path from 'path';

const authFile = path.join(__dirname, '.auth', 'user.json');

setup('authenticate', async ({ page }) => {
  console.log('🔐 Authenticating with Clerk...');
  
  // Navigate to the app
  await page.goto('/');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  // Check if already authenticated
  const isAuthenticated = await page.evaluate(() => {
    return !document.querySelector('button:contains("Sign In")');
  });
  
  if (!isAuthenticated) {
    // Navigate to sign-in page
    await page.goto('/sign-in');
    
    // Use Clerk's test helpers to sign in
    await clerk.signIn({
      page,
      signInParams: {
        strategy: 'password',
        identifier: process.env.TEST_USER_EMAIL || 'test@example.com',
        password: process.env.TEST_USER_PASSWORD || 'test_password',
      }
    });
    
    // Wait for redirect after sign-in
    await page.waitForURL('**/dashboard', { timeout: 30000 });
  }
  
  // Verify we're authenticated
  await expect(page.locator('a[href*="dashboard"]')).toBeVisible();
  
  // Save the authentication state
  await page.context().storageState({ path: authFile });
  
  console.log('✅ Authentication state saved');
});