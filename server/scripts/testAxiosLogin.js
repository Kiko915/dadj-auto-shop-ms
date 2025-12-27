// Test script using axios (Node.js)
import axios from 'axios';

async function testAxiosLogin() {
  try {
    console.log('Testing login with axios...');
    
    const response = await axios.post('http://localhost:4000/api/auth/login', {
      email: 'test@synera.com',
      password: 'password123'
    });
    
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    console.log('✅ Axios login test successful!');
    
  } catch (error) {
    console.log('❌ Axios login test failed');
    if (error.response) {
      console.log('Error status:', error.response.status);
      console.log('Error data:', error.response.data);
    } else if (error.request) {
      console.log('Network error:', error.message);
    } else {
      console.log('Error:', error.message);
    }
  }
}

testAxiosLogin();