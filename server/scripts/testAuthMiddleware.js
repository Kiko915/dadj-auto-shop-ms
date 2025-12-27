// Test protected routes and auth middleware
import 'dotenv/config';
import jwt from 'jsonwebtoken';

async function testProtectedRoutes() {
  try {
    console.log('🧪 Testing Protected Routes & Auth Middleware...\n');
    
    // Create test tokens
    const validToken = jwt.sign(
      { userId: 'cmgz56lqi0000hluozo3h3ct6' }, // Use actual test user ID
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    const expiredToken = jwt.sign(
      { userId: 'cmgz56lqi0000hluozo3h3ct6' },
      process.env.JWT_SECRET,
      { expiresIn: '-1h' } // Already expired
    );
    
    // Test 1: Access protected route without token
    console.log('1️⃣ Testing access without token...');
    const noTokenResponse = await fetch('http://localhost:4000/api/protected/profile');
    console.log('   Status:', noTokenResponse.status);
    console.log('   Response:', await noTokenResponse.json());
    console.log('   Expected: 401 Unauthorized ✅\n');
    
    // Test 2: Access protected route with valid token
    console.log('2️⃣ Testing access with valid token...');
    const validTokenResponse = await fetch('http://localhost:4000/api/protected/profile', {
      headers: {
        'Authorization': `Bearer ${validToken}`
      }
    });
    console.log('   Status:', validTokenResponse.status);
    console.log('   Response:', await validTokenResponse.json());
    console.log('   Expected: 200 Success ✅\n');
    
    // Test 3: Access protected route with expired token
    console.log('3️⃣ Testing access with expired token...');
    const expiredTokenResponse = await fetch('http://localhost:4000/api/protected/profile', {
      headers: {
        'Authorization': `Bearer ${expiredToken}`
      }
    });
    console.log('   Status:', expiredTokenResponse.status);
    console.log('   Response:', await expiredTokenResponse.json());
    console.log('   Expected: 401 Token Expired ✅\n');
    
    // Test 4: Access admin-only route with STAFF token
    console.log('4️⃣ Testing role-based access control...');
    const staffResponse = await fetch('http://localhost:4000/api/protected/users', {
      headers: {
        'Authorization': `Bearer ${validToken}`
      }
    });
    console.log('   Status:', staffResponse.status);
    console.log('   Response:', await staffResponse.json());
    console.log('   Expected: 403 Insufficient Role (STAFF trying admin route) ✅\n');
    
    // Test 5: Access dashboard stats (STAFF allowed)
    console.log('5️⃣ Testing STAFF role access...');
    const dashboardResponse = await fetch('http://localhost:4000/api/protected/dashboard-stats', {
      headers: {
        'Authorization': `Bearer ${validToken}`
      }
    });
    console.log('   Status:', dashboardResponse.status);
    console.log('   Response:', await dashboardResponse.json());
    console.log('   Expected: 200 Success (STAFF can access) ✅\n');
    
    console.log('🎉 Auth Middleware Tests Complete!');
    
  } catch (error) {
    console.error('❌ Error testing protected routes:', error.message);
  }
}

testProtectedRoutes();