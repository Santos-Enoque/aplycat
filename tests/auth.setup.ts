/**
 * Authentication Setup for Playwright Testing
 * 
 * This file handles the initial authentication process using Clerk's testing utilities
 * and saves the authenticated state for reuse across all tests.
 */

import { test as setup, expect } from '@playwright/test';
import { clerk } from '@clerk/testing/playwright';
import path from 'path';

const authFile = path.join(__dirname, '..', 'playwright', '.clerk', 'user.json');

setup('authenticate with Clerk', async ({ page }) => {
  console.log('🔐 Setting up authentication for tests...');
  
  // Navigate to the sign-in page
  await page.goto('http://localhost:3002/en/sign-in');
  
  // Wait for Clerk to be ready
  await page.waitForLoadState('networkidle');
  
  // Use Clerk's test helpers to sign in
  // Note: You'll need to replace these with your actual test credentials
  await clerk.signIn({
    page,
    signInParams: {
      strategy: 'password', // Use password strategy to include password field
      identifier: process.env.TEST_USER_EMAIL || 'test@example.com',
      password: process.env.TEST_USER_PASSWORD || 'test_password',
    }
  });
  
  // Wait for redirect to dashboard
  await page.waitForURL('**/dashboard', { timeout: 30000 });
  
  // Verify we're authenticated
  await expect(page).toHaveURL(/.*dashboard/);
  
  // Save the authentication state
  await page.context().storageState({ path: authFile });
  
  console.log('✅ Authentication state saved to:', authFile);
});