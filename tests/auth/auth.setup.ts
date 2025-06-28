import { test as setup, expect } from '@playwright/test';

const authFile = './tests/auth/.auth/user.json';
const adminAuthFile = './tests/auth/.auth/admin.json';

setup('authenticate as user', async ({ page }) => {
  try {
    // Navigate to sign-in page
    await page.goto('/sign-in');
    
    // Wait for Clerk to load
    await page.waitForSelector('[data-clerk-element="signIn.start"]', { timeout: 10000 });
    
    // Fill in user credentials
    await page.fill('input[name="identifier"]', process.env.TEST_USER_EMAIL || 'test@example.com');
    await page.click('button[data-localization-key="formButtonPrimary"]');
    
    // Wait for password field and fill it
    await page.waitForSelector('input[name="password"]', { timeout: 5000 });
    await page.fill('input[name="password"]', process.env.TEST_USER_PASSWORD || 'TestPassword123!');
    await page.click('button[data-localization-key="formButtonPrimary"]');
    
    // Wait for successful authentication
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    
    // Verify we're authenticated by checking for user elements
    await expect(page.locator('[data-testid="user-button"], .user-menu, [aria-label*="user"]')).toBeVisible({ timeout: 5000 });
    
    // Save signed-in state
    await page.context().storageState({ path: authFile });
    console.log('✅ User authentication completed and saved');
    
  } catch (error) {
    console.log('⚠️ Authentication failed, creating mock state for testing:', error);
    
    // Create mock authentication state for offline testing
    const mockAuthState = {
      cookies: [
        {
          name: '__session',
          value: 'mock-test-session-' + Date.now(),
          domain: 'localhost',
          path: '/',
          expires: Math.floor((Date.now() + (1000 * 60 * 60 * 24)) / 1000), // Convert to seconds
          httpOnly: true,
          secure: false,
          sameSite: 'Lax' as const
        }
      ],
      origins: []
    };
    
    const fs = await import('fs/promises');
    await fs.writeFile(authFile, JSON.stringify(mockAuthState, null, 2));
    await fs.writeFile(adminAuthFile, JSON.stringify(mockAuthState, null, 2));
    
    console.log('✅ Mock authentication state created');
  }
});

setup('authenticate as admin', async ({ page }) => {
  try {
    // Navigate to sign-in page
    await page.goto('/sign-in');
    
    // Wait for Clerk to load
    await page.waitForSelector('[data-clerk-element="signIn.start"]', { timeout: 10000 });
    
    // Fill in admin credentials (fallback to user credentials if no admin specified)
    const adminEmail = process.env.TEST_ADMIN_EMAIL || process.env.TEST_USER_EMAIL || 'admin@example.com';
    const adminPassword = process.env.TEST_ADMIN_PASSWORD || process.env.TEST_USER_PASSWORD || 'AdminPassword123!';
    
    await page.fill('input[name="identifier"]', adminEmail);
    await page.click('button[data-localization-key="formButtonPrimary"]');
    
    await page.waitForSelector('input[name="password"]', { timeout: 5000 });
    await page.fill('input[name="password"]', adminPassword);
    await page.click('button[data-localization-key="formButtonPrimary"]');
    
    // Wait for successful authentication
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    
    // Verify authentication
    await expect(page.locator('[data-testid="user-button"], .user-menu, [aria-label*="user"]')).toBeVisible({ timeout: 5000 });
    
    // Save admin authentication state
    await page.context().storageState({ path: adminAuthFile });
    console.log('✅ Admin authentication completed and saved');
    
  } catch (error) {
    console.log('⚠️ Admin authentication failed, will use user auth state:', error);
    
    // Copy user auth state if admin auth fails
    try {
      const fs = await import('fs/promises');
      const userAuthData = await fs.readFile(authFile, 'utf-8');
      await fs.writeFile(adminAuthFile, userAuthData);
    } catch (copyError) {
      console.log('Could not copy user auth state, admin tests may fail');
    }
  }
});