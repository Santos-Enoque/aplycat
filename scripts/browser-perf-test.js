// Browser-based performance test
const puppeteer = require('puppeteer');

async function runPerformanceTest() {
    console.log('🚀 Starting Browser Performance Test...\n');

    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();

        // Monitor network requests
        let requestCount = 0;
        let totalDataTransferred = 0;

        page.on('response', (response) => {
            requestCount++;
            // Estimate data transfer (headers + content)
            const size = response.headers()['content-length'];
            if (size) totalDataTransferred += parseInt(size);
        });

        console.log('📊 Testing Landing Page...');
        const start1 = Date.now();
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 30000 });
        const landingTime = Date.now() - start1;
        console.log(`✅ Landing Page: ${landingTime}ms`);

        console.log('📊 Testing Navigation to Dashboard...');
        const start2 = Date.now();

        // Try to navigate to dashboard - should redirect to sign-in
        await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle0', timeout: 30000 });
        const dashboardTime = Date.now() - start2;

        // Check what page we're actually on
        const currentUrl = page.url();
        const title = await page.title();

        console.log(`✅ Dashboard redirect: ${dashboardTime}ms`);
        console.log(`   📍 Final URL: ${currentUrl}`);
        console.log(`   📄 Page title: "${title}"`);

        console.log('📊 Testing Analyze Page...');
        const start3 = Date.now();
        await page.goto('http://localhost:3000/analyze', { waitUntil: 'networkidle0', timeout: 30000 });
        const analyzeTime = Date.now() - start3;
        console.log(`✅ Analyze Page: ${analyzeTime}ms`);

        // Get page performance metrics
        const performanceMetrics = await page.evaluate(() => {
            const perfData = performance.getEntriesByType('navigation')[0];
            return {
                domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
                loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
                domElements: document.querySelectorAll('*').length,
                totalSize: document.documentElement.outerHTML.length
            };
        });

        console.log('\n📋 Performance Summary:');
        console.log('========================');
        console.log(`🟢 Landing Page: ${landingTime}ms`);
        console.log(`🟢 Dashboard Handling: ${dashboardTime}ms`);
        console.log(`🟢 Analyze Page: ${analyzeTime}ms`);
        console.log(`🌐 Total Network Requests: ${requestCount}`);
        console.log(`📦 Total Data Transferred: ~${Math.round(totalDataTransferred / 1024)}KB`);
        console.log(`🧱 DOM Elements on Last Page: ${performanceMetrics.domElements}`);
        console.log(`📄 Page Size: ${Math.round(performanceMetrics.totalSize / 1024)}KB`);

        const avgTime = Math.round((landingTime + dashboardTime + analyzeTime) / 3);
        console.log(`\n🎯 Average Load Time: ${avgTime}ms`);

        if (avgTime < 500) {
            console.log('🎉 OUTSTANDING! Your app is blazingly fast!');
        } else if (avgTime < 1000) {
            console.log('🎉 Excellent! Your app is very fast and ready for MVP launch!');
        } else if (avgTime < 2000) {
            console.log('👍 Good performance! Your optimizations are working well.');
        } else {
            console.log('⚠️  Performance could be improved further.');
        }

        // Specific feedback
        if (currentUrl.includes('sign-in')) {
            console.log('\n🔒 Note: Dashboard correctly redirects to sign-in (this is expected behavior)');
            console.log('   For authenticated users, the dashboard would load directly.');
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Run the test
runPerformanceTest().then(() => {
    console.log('\n✨ Performance test completed!');
}).catch(console.error); 