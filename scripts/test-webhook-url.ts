#!/usr/bin/env tsx

/**
 * Test Webhook URL Reachability
 * 
 * This script tests if the ngrok webhook URL is accessible and responds correctly.
 */

async function testWebhookUrl() {
  const webhookUrl = process.env.WEBHOOK_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const fullWebhookUrl = `${webhookUrl}/api/webhooks/paysuite`;

  console.log(`🔍 Testing webhook URL: ${fullWebhookUrl}`);

  try {
    // Test if the URL is reachable
    const response = await fetch(fullWebhookUrl, {
      method: 'GET', // Just a simple GET to see if endpoint exists
    });

    console.log(`📡 Response status: ${response.status}`);
    console.log(`📡 Response headers:`, Object.fromEntries(response.headers.entries()));

    if (response.status === 405) {
      console.log(`✅ Webhook endpoint is reachable! (405 Method Not Allowed is expected for GET)`);
      console.log(`🎯 PaySuite should be able to send POST requests to this URL`);
    } else if (response.status === 200) {
      console.log(`✅ Webhook endpoint is reachable and responding!`);
    } else {
      console.log(`⚠️ Unexpected response. Check if the endpoint is working correctly.`);
    }

    return true;
  } catch (error) {
    console.error(`❌ Failed to reach webhook URL:`, error);
    console.log(`\n🔧 Troubleshooting steps:`);
    console.log(`1. Make sure your Next.js dev server is running: npm run dev`);
    console.log(`2. Make sure ngrok is running and pointing to the right port`);
    console.log(`3. Check if the ngrok URL is correct: ${webhookUrl}`);
    console.log(`4. Try accessing the URL manually in your browser`);
    return false;
  }
}

async function main() {
  console.log(`🚀 PaySuite Webhook URL Test\n`);
  
  console.log(`Current environment variables:`);
  console.log(`WEBHOOK_BASE_URL: ${process.env.WEBHOOK_BASE_URL || 'Not set'}`);
  console.log(`NEXT_PUBLIC_APP_URL: ${process.env.NEXT_PUBLIC_APP_URL || 'Not set'}`);
  console.log('');

  const isReachable = await testWebhookUrl();
  
  if (isReachable) {
    console.log(`\n✅ Webhook setup looks good!`);
    console.log(`💡 PaySuite should now be able to send webhooks to your endpoint.`);
    console.log(`\n🔄 To test with a real payment:`);
    console.log(`1. Make a small test payment`);
    console.log(`2. Check the server logs for webhook reception`);
    console.log(`3. If no webhook arrives, check PaySuite dashboard logs`);
  } else {
    console.log(`\n❌ Webhook setup needs fixing before PaySuite can reach it.`);
  }
}

if (require.main === module) {
  main();
} 