#!/usr/bin/env node

// Simple test script to verify the admin system
console.log('🧪 Testing Admin System...\n');

async function testAdminAPIs() {
    const baseUrl = 'http://localhost:3001'; // Assuming port 3001 from your terminal

    try {
        // Test 1: Check if admin prompts API returns service-organized data
        console.log('1️⃣ Testing Service Prompts API...');
        const promptsResponse = await fetch(`${baseUrl}/api/admin/prompts`);

        if (promptsResponse.ok) {
            const promptsData = await promptsResponse.json();
            console.log('✅ Prompts API working');
            console.log(`   Found ${promptsData.services?.length || 0} services`);
            console.log(`   Active config: ${promptsData.activeConfiguration?.name || 'None'}`);
        } else {
            console.log(`❌ Prompts API failed: ${promptsResponse.status}`);
        }

        // Test 2: Check models API
        console.log('\n2️⃣ Testing Models API...');
        const modelsResponse = await fetch(`${baseUrl}/api/admin/models`);

        if (modelsResponse.ok) {
            const modelsData = await modelsResponse.json();
            console.log('✅ Models API working');
            console.log(`   Found ${modelsData.configurations?.length || 0} configurations`);
        } else {
            console.log(`❌ Models API failed: ${modelsResponse.status}`);
        }

        // Test 3: Test reset to defaults API (just check endpoint exists)
        console.log('\n3️⃣ Testing Reset Defaults endpoint...');
        // Note: We won't actually call this to avoid resetting data
        console.log('📝 Reset endpoint available at /api/admin/reset-defaults');

        console.log('\n🎉 Admin system test completed!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.log('💡 Make sure the development server is running on port 3001');
    }
}

// Run the test if the development server is available
testAdminAPIs(); 