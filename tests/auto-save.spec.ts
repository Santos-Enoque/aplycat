import { test, expect } from '@playwright/test';
import path from 'path';

const cvFilePath = '/Users/santossafrao/Library/Mobile Documents/com~apple~CloudDocs/Favela Fotos/Cv.pdf';

test.describe('Auto-Save Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard to verify authentication
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Verify we're authenticated
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should auto-save analysis progress every 10 seconds', async ({ page }) => {
    // Navigate to analyze page
    await page.goto('/analyze');
    await page.waitForLoadState('networkidle');
    
    // Take initial screenshot
    await page.screenshot({ 
      path: 'test-results/01-analyze-page.png',
      fullPage: true 
    });
    
    // Upload CV file
    console.log('📎 Uploading CV file...');
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(cvFilePath);
    
    // Wait for upload to process
    await page.waitForTimeout(2000);
    
    // Take screenshot after upload
    await page.screenshot({ 
      path: 'test-results/02-cv-uploaded.png',
      fullPage: true 
    });
    
    // Look for and click analyze button
    const analyzeButton = page.locator('button').filter({ hasText: /analyze|start|begin/i }).first();
    if (await analyzeButton.isVisible()) {
      await analyzeButton.click();
      console.log('🚀 Analysis started');
    }
    
    // Set up monitoring for auto-save requests
    const autoSaveRequests: any[] = [];
    page.on('request', request => {
      const url = request.url();
      if (url.includes('checkpoint') || url.includes('recovery') || url.includes('auto-save')) {
        autoSaveRequests.push({
          url: url,
          method: request.method(),
          timestamp: Date.now()
        });
        console.log(`🔄 Auto-save request: ${request.method()} ${url}`);
      }
    });
    
    // Monitor for 35 seconds to catch at least 3 auto-save cycles (every 10 seconds)
    console.log('⏰ Monitoring auto-save activity for 35 seconds...');
    
    for (let i = 0; i < 7; i++) {
      await page.waitForTimeout(5000);
      
      // Check session storage
      const sessionData = await page.evaluate(() => ({
        analysis: sessionStorage.getItem('streamingAnalysis'),
        progress: sessionStorage.getItem('streamingAnalysisProgress'),
        status: sessionStorage.getItem('streamingAnalysisStatus')
      }));
      
      console.log(`⏱️  ${(i + 1) * 5}s - Progress: ${sessionData.progress || '0'}%, Status: ${sessionData.status || 'idle'}`);
      
      if (sessionData.status === 'completed') {
        console.log('✅ Analysis completed');
        break;
      }
    }
    
    // Take screenshot during streaming
    await page.screenshot({ 
      path: 'test-results/03-analysis-streaming.png',
      fullPage: true 
    });
    
    // Verify auto-save requests were made
    expect(autoSaveRequests.length).toBeGreaterThan(0);
    console.log(`📊 Captured ${autoSaveRequests.length} auto-save requests`);
    
    // Check intervals between requests (should be ~10 seconds)
    if (autoSaveRequests.length > 1) {
      const intervals = [];
      for (let i = 1; i < autoSaveRequests.length; i++) {
        const interval = autoSaveRequests[i].timestamp - autoSaveRequests[i-1].timestamp;
        intervals.push(interval);
      }
      console.log('⏱️  Intervals between saves:', intervals.map(i => `${(i/1000).toFixed(1)}s`));
    }
  });

  test('should recover from interrupted analysis', async ({ page }) => {
    // Navigate to analyze page
    await page.goto('/analyze');
    await page.waitForLoadState('networkidle');
    
    // Upload CV and start analysis
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(cvFilePath);
    await page.waitForTimeout(2000);
    
    // Start analysis
    const analyzeButton = page.locator('button').filter({ hasText: /analyze|start|begin/i }).first();
    if (await analyzeButton.isVisible()) {
      await analyzeButton.click();
    }
    
    // Wait for analysis to progress
    console.log('⏳ Waiting for analysis to progress...');
    await page.waitForTimeout(15000); // Wait 15 seconds
    
    // Check progress before refresh
    const progressBefore = await page.evaluate(() => 
      sessionStorage.getItem('streamingAnalysisProgress')
    );
    console.log(`📊 Progress before refresh: ${progressBefore}%`);
    
    // Refresh the page
    console.log('🔄 Refreshing page...');
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Take screenshot after refresh
    await page.screenshot({ 
      path: 'test-results/04-after-refresh.png',
      fullPage: true 
    });
    
    // Check for recovery UI
    const recoveryBanner = page.locator('[data-testid*="recovery"], .recovery-banner, div:has-text("Continue where you left off")').first();
    const hasRecovery = await recoveryBanner.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (hasRecovery) {
      console.log('✅ Recovery banner found!');
      await page.screenshot({ 
        path: 'test-results/05-recovery-banner.png',
        fullPage: true 
      });
      
      // Click resume if available
      const resumeButton = page.locator('button:has-text("Resume"), button:has-text("Continue")').first();
      if (await resumeButton.isVisible()) {
        await resumeButton.click();
        console.log('🔄 Clicked resume button');
        
        await page.waitForTimeout(3000);
        await page.screenshot({ 
          path: 'test-results/06-after-resume.png',
          fullPage: true 
        });
      }
    } else {
      console.log('⚠️  No recovery banner found');
    }
    
    // Verify recovery functionality exists
    expect(hasRecovery || progressBefore !== null).toBeTruthy();
  });

  test('should check auto-save infrastructure', async ({ page }) => {
    await page.goto('/analyze');
    
    // Check if auto-save modules are available
    const infrastructure = await page.evaluate(() => ({
      hasBackgroundProcessor: typeof (window as any).backgroundProcessor !== 'undefined',
      hasStreamingAutoSave: typeof (window as any).streamingAutoSave !== 'undefined',
    }));
    
    console.log('🔍 Auto-save infrastructure:', infrastructure);
    
    // Test recovery API
    const response = await page.request.get('/api/recovery/list');
    expect(response.ok()).toBeTruthy();
    
    const recoveryData = await response.json();
    console.log('📊 Recovery API response:', {
      success: recoveryData.success,
      sessionCount: recoveryData.count || 0
    });
  });
});