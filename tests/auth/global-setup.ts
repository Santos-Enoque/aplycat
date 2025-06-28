import { clerkSetup } from '@clerk/testing/playwright';

/**
 * Global setup for Playwright tests
 * This runs once before all tests to setup Clerk testing environment
 */
async function globalSetup() {
  console.log('🔐 Setting up Clerk testing environment...');
  
  // Setup Clerk testing token
  await clerkSetup();
  
  console.log('✅ Clerk testing environment ready');
}

export default globalSetup;