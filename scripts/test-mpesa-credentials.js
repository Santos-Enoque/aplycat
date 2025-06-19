// scripts/test-mpesa-credentials.js
// Simple test script to validate MPesa credentials

const crypto = require('crypto');

function testMpesaCredentials() {
    console.log('🔧 Testing MPesa Credentials...\n');

    // Check environment variables
    const apiKey = process.env.MPESA_API_KEY;
    const publicKey = process.env.MPESA_PUBLIC_KEY;
    const serviceProviderCode = process.env.MPESA_SERVICE_PROVIDER_CODE;

    console.log('📋 Environment Variables Check:');
    console.log('✅ MPESA_API_KEY:', apiKey ? `Present (${apiKey.length} chars)` : '❌ Missing');
    console.log('✅ MPESA_PUBLIC_KEY:', publicKey ? `Present (${publicKey.length} chars)` : '❌ Missing');
    console.log('✅ MPESA_SERVICE_PROVIDER_CODE:', serviceProviderCode ? `Present (${serviceProviderCode})` : '❌ Missing');
    console.log('');

    if (!apiKey || !publicKey || !serviceProviderCode) {
        console.log('❌ Some required environment variables are missing!');
        console.log('Please add them to your .env file:');
        console.log('');
        console.log('MPESA_API_KEY="your_api_key_here"');
        console.log('MPESA_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\\nYour_Key_Here\\n-----END PUBLIC KEY-----"');
        console.log('MPESA_SERVICE_PROVIDER_CODE="your_service_provider_code"');
        return;
    }

    // Test public key formatting
    console.log('🔑 Testing Public Key Format:');

    let formattedPublicKey = publicKey;
    if (publicKey.includes('\\n')) {
        formattedPublicKey = publicKey.replace(/\\n/g, '\n');
        console.log('✅ Fixed \\n to actual newlines');
    }

    console.log('📝 Public Key Preview:');
    console.log(formattedPublicKey.substring(0, 100) + '...');
    console.log('');

    // Validate PEM format
    if (!formattedPublicKey.includes('-----BEGIN PUBLIC KEY-----')) {
        console.log('❌ Public key missing PEM header (-----BEGIN PUBLIC KEY-----)');
        return;
    }

    if (!formattedPublicKey.includes('-----END PUBLIC KEY-----')) {
        console.log('❌ Public key missing PEM footer (-----END PUBLIC KEY-----)');
        return;
    }

    console.log('✅ Public key has proper PEM format');

    // Test encryption
    console.log('🔐 Testing Encryption:');
    try {
        const buffer = Buffer.from(apiKey);
        const encrypted = crypto.publicEncrypt(
            {
                key: formattedPublicKey,
                padding: crypto.constants.RSA_PKCS1_PADDING,
            },
            buffer
        );

        const base64Token = encrypted.toString('base64');
        console.log('✅ Successfully encrypted API key');
        console.log('📤 Generated access token (first 50 chars):', base64Token.substring(0, 50) + '...');
        console.log('');
        console.log('🎉 All MPesa credentials are properly configured!');

    } catch (error) {
        console.log('❌ Encryption failed:', error.message);
        console.log('');
        console.log('💡 Common fixes:');
        console.log('1. Ensure your public key is in proper PEM format');
        console.log('2. Use \\n for newlines in .env file');
        console.log('3. Include full -----BEGIN PUBLIC KEY----- and -----END PUBLIC KEY----- headers');
        console.log('');
        console.log('📋 Example .env format:');
        console.log('MPESA_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...\\n-----END PUBLIC KEY-----"');
    }
}

// Run the test
testMpesaCredentials(); 