// Simple performance test using curl and timing
const { execSync } = require('child_process');

console.log('🚀 Dashboard Performance Test Starting...\n');

// Test function
function testEndpoint(url, testName) {
    console.log(`📊 Testing: ${testName}`);
    console.log(`🌐 URL: ${url}`);

    try {
        const start = Date.now();

        // Test with curl and measure time
        const result = execSync(`curl -s -w "%{time_total},%{time_namelookup},%{time_connect},%{time_starttransfer},%{size_download},%{http_code}" -o /dev/null "${url}"`,
            { encoding: 'utf8', timeout: 30000 });

        const end = Date.now();
        const [totalTime, nameLookup, connect, startTransfer, downloadSize, httpCode] = result.trim().split(',');

        const timingMs = {
            total: Math.round(parseFloat(totalTime) * 1000),
            nameLookup: Math.round(parseFloat(nameLookup) * 1000),
            connect: Math.round(parseFloat(connect) * 1000),
            startTransfer: Math.round(parseFloat(startTransfer) * 1000),
            downloadSize: parseInt(downloadSize),
            httpCode: parseInt(httpCode)
        };

        console.log('✅ Results:');
        console.log(`   📈 Total Time: ${timingMs.total}ms`);
        console.log(`   🔌 Connect Time: ${timingMs.connect}ms`);
        console.log(`   ⚡ Time to First Byte: ${timingMs.startTransfer}ms`);
        console.log(`   📦 Download Size: ${timingMs.downloadSize} bytes`);
        console.log(`   📊 HTTP Status: ${timingMs.httpCode}`);

        // Performance rating
        if (timingMs.total < 1000) {
            console.log(`   🎉 Rating: Excellent! Very fast loading`);
        } else if (timingMs.total < 2500) {
            console.log(`   ✅ Rating: Good - Acceptable performance`);
        } else if (timingMs.total < 4000) {
            console.log(`   ⚠️  Rating: Needs improvement`);
        } else {
            console.log(`   ❌ Rating: Poor - Optimization needed`);
        }

        console.log('');
        return timingMs;

    } catch (error) {
        console.error(`❌ Test failed: ${error.message}`);
        return null;
    }
}

// Run tests
console.log('🎯 Running Performance Tests...\n');

const tests = [
    { url: 'http://localhost:3000', name: 'Landing Page' },
    { url: 'http://localhost:3000/dashboard', name: 'Dashboard (This is the key one!)' },
    { url: 'http://localhost:3000/analyze', name: 'Analyze Page' }
];

const results = [];
for (const test of tests) {
    const result = testEndpoint(test.url, test.name);
    if (result) {
        results.push({ ...result, name: test.name });
    }
}

// Summary
console.log('📋 Performance Summary:');
console.log('========================');
results.forEach(result => {
    const rating = result.total < 1000 ? '🟢' :
        result.total < 2500 ? '🟡' :
            result.total < 4000 ? '🟠' : '🔴';
    console.log(`${rating} ${result.name}: ${result.total}ms`);
});

if (results.length > 0) {
    const avgTime = Math.round(results.reduce((sum, r) => sum + r.total, 0) / results.length);
    console.log(`\n🎯 Average Load Time: ${avgTime}ms`);

    if (avgTime < 1500) {
        console.log('🎉 Excellent! Your app is very fast and ready for MVP launch!');
    } else if (avgTime < 3000) {
        console.log('👍 Good performance! Your optimizations are working well.');
    } else {
        console.log('⚠️  Performance could be improved further.');
    }
}

console.log('\n✨ Test completed!'); 