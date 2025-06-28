#!/usr/bin/env node
const { spawn } = require('child_process');

console.log('🎭 Running Playwright Tests with Test Environment');
console.log('================================================');

// Set environment to use .env.test
process.env.NODE_ENV = 'test';

// Run playwright tests
const playwright = spawn('npx', ['playwright', 'test', '--config=playwright.config.ts'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    // Force test environment
    NODE_ENV: 'test'
  }
});

playwright.on('close', (code) => {
  console.log(`\n🎭 Playwright tests finished with exit code ${code}`);
  
  if (code === 0) {
    console.log('✅ All tests passed!');
  } else {
    console.log('❌ Some tests failed. Check the output above.');
  }
  
  process.exit(code);
});

playwright.on('error', (error) => {
  console.error('❌ Error running Playwright tests:', error);
  process.exit(1);
});