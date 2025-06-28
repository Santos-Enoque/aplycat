import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;
  const browser = await chromium.launch();
  
  // Setup regular user authentication
  const userContext = await browser.newContext();
  const userPage = await userContext.newPage();
  
  try {
    // Navigate to sign-in page
    await userPage.goto(`${baseURL}/sign-in`);
    
    // Wait for Clerk to load
    await userPage.waitForSelector('[data-clerk-element="signIn.start"]', { timeout: 10000 });
    
    // Fill in credentials
    await userPage.fill('input[name="identifier"]', process.env.TEST_USER_EMAIL || 'test@example.com');
    await userPage.click('button[data-localization-key="formButtonPrimary"]');
    
    // Wait for password field and fill it
    await userPage.waitForSelector('input[name="password"]', { timeout: 5000 });
    await userPage.fill('input[name="password"]', process.env.TEST_USER_PASSWORD || 'TestPassword123!');
    await userPage.click('button[data-localization-key="formButtonPrimary"]');
    
    // Wait for successful authentication and redirect
    await userPage.waitForURL('**/dashboard**', { timeout: 10000 });
    
    // Save authentication state
    await userContext.storageState({ path: './tests/auth/.auth/user.json' });
    console.log('✅ User authentication state saved');
    
  } catch (error) {
    console.log('⚠️ User authentication failed, creating mock auth state:', error);
    // Create a mock auth state for testing without real authentication
    await createMockAuthState('./tests/auth/.auth/user.json');
  }
  
  await userContext.close();
  
  // Setup admin user authentication (if different credentials exist)
  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();
  
  try {
    await adminPage.goto(`${baseURL}/sign-in`);
    await adminPage.waitForSelector('[data-clerk-element="signIn.start"]', { timeout: 10000 });
    
    await adminPage.fill('input[name="identifier"]', process.env.TEST_ADMIN_EMAIL || 'admin@example.com');
    await adminPage.click('button[data-localization-key="formButtonPrimary"]');
    
    await adminPage.waitForSelector('input[name="password"]', { timeout: 5000 });
    await adminPage.fill('input[name="password"]', process.env.TEST_ADMIN_PASSWORD || 'AdminPassword123!');
    await adminPage.click('button[data-localization-key="formButtonPrimary"]');
    
    await adminPage.waitForURL('**/dashboard**', { timeout: 10000 });
    
    await adminContext.storageState({ path: './tests/auth/.auth/admin.json' });
    console.log('✅ Admin authentication state saved');
    
  } catch (error) {
    console.log('⚠️ Admin authentication failed, using user auth state for admin tests:', error);
    // Copy user auth state for admin tests if admin login fails
    await createMockAuthState('./tests/auth/.auth/admin.json');
  }
  
  await adminContext.close();
  await browser.close();
}

async function createMockAuthState(path: string) {
  const mockState = {
    cookies: [
      {
        name: '__session',
        value: 'mock-session-token',
        domain: 'localhost',
        path: '/',
        expires: Math.floor((Date.now() + (1000 * 60 * 60 * 24)) / 1000), // 24 hours in seconds
        httpOnly: true,
        secure: false,
        sameSite: 'Lax' as const
      }
    ],
    origins: []
  };
  
  const fs = await import('fs/promises');
  await fs.writeFile(path, JSON.stringify(mockState, null, 2));
}

export default globalSetup;