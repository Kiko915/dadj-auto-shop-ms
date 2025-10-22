<template>
  <Card class="w-full max-w-2xl mx-auto">
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        🧪 Full-Stack Connection Test
      </CardTitle>
      <CardDescription>
        Pinging Express Server (Node.js) to NeonDB via Prisma...
      </CardDescription>
    </CardHeader>
    
    <CardContent class="space-y-4">
      <div class="flex items-center gap-2">
        <Badge :variant="badgeVariant">
          {{ status }}
        </Badge>
        <Button 
          v-if="status === 'SUCCESS! ✅'" 
          @click="runTest" 
          size="sm"
        >
          Test Again
        </Button>
        <Button 
          v-else-if="status.includes('ERROR') || status.includes('FAILURE')" 
          @click="runTest" 
          variant="outline" 
          size="sm"
        >
          Retry
        </Button>
      </div>

      <div v-if="message" class="p-3 bg-muted rounded-md">
        <p class="text-sm"><strong>Message:</strong> {{ message }}</p>
      </div>

      <Alert v-if="error" variant="destructive">
        <AlertTitle>⚠️ Error Details</AlertTitle>
        <AlertDescription class="mt-2">
          <pre class="text-xs whitespace-pre-wrap break-words bg-background p-2 rounded border">{{ error }}</pre>
          <p class="mt-2 text-sm">Check your Node server console and <code class="bg-background px-1 rounded">server/.env</code> file for issues.</p>
        </AlertDescription>
      </Alert>

      <Alert v-if="status === 'SUCCESS! ✅'" variant="default" class="border-green-200 bg-green-50 dark:bg-green-900/20">
        <AlertTitle class="text-green-800 dark:text-green-200">✅ Connection Successful</AlertTitle>
        <AlertDescription class="text-green-700 dark:text-green-300">
          Your full-stack application is properly connected! The client can communicate with the server, and the server can access the database.
        </AlertDescription>
      </Alert>
    </CardContent>

    <CardFooter v-if="status === 'PENDING...'" class="justify-center">
      <div class="flex items-center gap-2 text-muted-foreground">
        <div class="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
        <span class="text-sm">Testing connection...</span>
      </div>
    </CardFooter>
  </Card>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Define the API URL for your test endpoint
// Your Express server should be running on this port (e.g., 4000)
const API_BASE_URL = 'http://localhost:4000'; 
const TEST_ENDPOINT = '/api/test-connection'; 

// Reactive variables to hold the results
const status = ref('PENDING...');
const message = ref('');
const error = ref(null);

// Computed property for badge variant based on status
const badgeVariant = computed(() => {
  if (status.value === 'SUCCESS! ✅') return 'default';
  if (status.value.includes('ERROR') || status.value.includes('FAILURE')) return 'destructive';
  return 'secondary';
});

// Function to perform the full-stack test
const runTest = async () => {
  // Reset state
  status.value = 'PENDING...';
  message.value = '';
  error.value = null;

  try {
    const response = await axios.get(`${API_BASE_URL}${TEST_ENDPOINT}`);
    
    // Check for a successful response from the server
    if (response.data.status === 'OK') {
      status.value = 'SUCCESS! ✅';
      message.value = response.data.message;
    } else {
      // Handle a server response that indicates an application error
      status.value = 'SERVER ERROR ❌';
      message.value = response.data.message || 'Server returned an error status.';
      error.value = response.data.error || 'No further details provided.';
    }

  } catch (err) {
    // Handle network errors (CORS, server not running, etc.)
    status.value = 'NETWORK FAILURE 🚨';
    message.value = 'Could not reach the Express server. Check if your server is running.';
    error.value = err.message;
  }
};

// Run the test as soon as the component is mounted
onMounted(() => {
  runTest();
});
</script>

<style scoped>
/* Custom styles are minimal since we're using shadcn-vue components */
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>