const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:5000';

async function testAuthentication() {
  try {
    console.log('🧪 Testing Authentication System...\n');

    // Test 1: Login
    console.log('1. Testing Login...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@maisondarin.com',
      password: 'SecurePass123!'
    });

    console.log('✅ Login successful');
    console.log('User:', loginResponse.data.data.user.email);
    console.log('Access Token:', loginResponse.data.data.tokens.accessToken.substring(0, 50) + '...');
    
    const { accessToken, refreshToken } = loginResponse.data.data.tokens;

    // Test 2: Verify Token
    console.log('\n2. Testing Token Verification...');
    const verifyResponse = await axios.get(`${BASE_URL}/api/auth/verify`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    console.log('✅ Token verification successful');
    console.log('Valid:', verifyResponse.data.data.valid);

    // Test 3: Get Profile
    console.log('\n3. Testing Get Profile...');
    const profileResponse = await axios.get(`${BASE_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    console.log('✅ Profile retrieval successful');
    console.log('User ID:', profileResponse.data.data.user.id);
    console.log('Email:', profileResponse.data.data.user.email);

    // Test 4: Refresh Token
    console.log('\n4. Testing Token Refresh...');
    const refreshResponse = await axios.post(`${BASE_URL}/api/auth/refresh`, {
      refreshToken: refreshToken
    });

    console.log('✅ Token refresh successful');
    console.log('New Access Token:', refreshResponse.data.data.accessToken.substring(0, 50) + '...');

    // Test 5: Logout
    console.log('\n5. Testing Logout...');
    const logoutResponse = await axios.post(`${BASE_URL}/api/auth/logout`, {}, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    console.log('✅ Logout successful');
    console.log('Message:', logoutResponse.data.message);

    // Test 6: Try to use token after logout (should fail)
    console.log('\n6. Testing Token After Logout (should fail)...');
    try {
      await axios.get(`${BASE_URL}/api/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      console.log('❌ Token should have been invalidated');
    } catch (error) {
      console.log('✅ Token correctly invalidated');
      console.log('Error:', error.response.data.error.message);
    }

    console.log('\n🎉 All authentication tests passed!');

  } catch (error) {
    console.error('❌ Authentication test failed:', error.response?.data || error.message);
  }
}

// Check if server is running first
async function checkServer() {
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Server is running');
    console.log('Status:', response.data.status);
    return true;
  } catch (error) {
    console.log('❌ Server is not running. Please start the server first with: npm start');
    return false;
  }
}

async function main() {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await testAuthentication();
  }
}

main();