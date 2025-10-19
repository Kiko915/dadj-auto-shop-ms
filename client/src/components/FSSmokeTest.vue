<template>
  <div class="smoke-test">
    <h2>Full-Stack Connection Test 🧪</h2>
    <p>
      Pinging Express Server (Node.js) to NeonDB via Prisma...
    </p>

    <div :class="statusClass">
      <strong>Status:</strong> {{ status }}
    </div>

    <div v-if="message">
      <strong>Message:</strong> {{ message }}
    </div>

    <div v-if="error" class="error-details">
      <p>⚠️ **ERROR DETAILS:**</p>
      <pre>{{ error }}</pre>
      <p>Check your Node server console and **server/.env** file for issues.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

// Define the API URL for your test endpoint
// Your Express server should be running on this port (e.g., 4000)
const API_BASE_URL = 'http://localhost:4000'; 
const TEST_ENDPOINT = '/api/test-connection'; 

// Reactive variables to hold the results
const status = ref('PENDING...');
const message = ref('');
const error = ref(null);
const statusClass = ref('status-pending');

// Function to perform the full-stack test
const runTest = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}${TEST_ENDPOINT}`);
    
    // Check for a successful response from the server
    if (response.data.status === 'OK') {
      status.value = 'SUCCESS! ✅';
      message.value = response.data.message;
      statusClass.value = 'status-success';
    } else {
      // Handle a server response that indicates an application error
      status.value = 'SERVER ERROR ❌';
      message.value = response.data.message || 'Server returned an error status.';
      error.value = response.data.error || 'No further details provided.';
      statusClass.value = 'status-error';
    }

  } catch (err) {
    // Handle network errors (CORS, server not running, etc.)
    status.value = 'NETWORK FAILURE 🚨';
    message.value = 'Could not reach the Express server. Check if your server is running.';
    error.value = err.message;
    statusClass.value = 'status-error';
  }
};

// Run the test as soon as the component is mounted
onMounted(() => {
  runTest();
});
</script>

<style scoped>
.smoke-test {
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
  max-width: 600px;
  margin: 20px auto;
  font-family: sans-serif;
}
.status-pending {
  color: orange;
}
.status-success {
  color: #10b981; /* Tailwind green-500 */
  font-weight: bold;
  font-size: 1.2em;
}
.status-error {
  color: #ef4444; /* Tailwind red-500 */
  font-weight: bold;
  font-size: 1.2em;
}
.error-details {
  margin-top: 15px;
  padding: 10px;
  background: #fee2e2;
  border: 1px solid #fca5a5;
  border-radius: 4px;
}
pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  background: #fff;
  padding: 5px;
  border-radius: 3px;
}
</style>