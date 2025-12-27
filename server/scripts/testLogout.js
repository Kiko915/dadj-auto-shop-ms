// Test logout API endpoint
import 'dotenv/config';
import jwt from 'jsonwebtoken';

async function testLogoutAPI() {
  try {
    console.log('🧪 Testing Logout API...\n');
    
    // First, create a valid token
    const testToken = jwt.sign(
      { userId: 'test-user-id' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    console.log('Generated test token:', testToken.substring(0, 50) + '...\n');
    
    // Test logout with valid token
    const response = await fetch('http://localhost:4000/api/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', data);
    
    if (response.ok) {
      console.log('✅ Logout API test successful!');
    } else {
      console.log('❌ Logout API test failed');
    }
    
    // Test logout without token
    console.log('\n🧪 Testing logout without token...');
    const responseNoToken = await fetch('http://localhost:4000/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const dataNoToken = await responseNoToken.json();
    console.log('No token response:', responseNoToken.status, dataNoToken);
    
  } catch (error) {
    console.error('❌ Error testing logout API:', error.message);
  }
}

testLogoutAPI();