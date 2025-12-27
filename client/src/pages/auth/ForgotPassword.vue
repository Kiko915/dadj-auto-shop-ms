<template>
  <div class="flex flex-col justify-start items-center min-h-screen bg-gray-100 pt-16">
    <!-- Logo ABOVE the card -->
    <img
      src="/logo/primary_logo.png"
      alt="DADJ Auto Shop Logo"
      class="mb-8 w-28 h-28 object-contain"
    />

    <!-- Card -->
    <div class="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md mb-10">
      <h2 class="text-2xl font-semibold text-center mb-6 text-gray-800">
        Forgot your password?
      </h2>
      <p class="text-gray-500 text-center mb-6 text-sm">
        Enter your email and we'll send you a password reset link.
      </p>

      <form @submit.prevent="handleForgotPassword" class="space-y-4">
        <div>
          <Label for="email" class="block text-sm font-medium text-gray-700 mb-1">
            Email address
          </Label>
          <Input
            id="email"
            type="email"
            v-model="email"
            required
            placeholder="you@example.com"
            :disabled="loading"
            class="w-full"
            :class="emailError ? 'border-red-500 focus:ring-red-500' : ''"
          />
          <p v-if="emailError" class="text-red-500 text-sm mt-1">
            {{ emailError }}
          </p>
        </div>

        <Button
          type="submit"
          :disabled="loading || !email || resendCooldown > 0"
          variant="default"
          size="default"
          class="w-full bg-[#000080] hover:bg-[#000070] text-white font-medium"
          :class="resendCooldown > 0 ? 'opacity-50 cursor-not-allowed' : ''"
        >
          <Loader2 v-if="loading" class="w-4 h-4 mr-2 animate-spin" />
          <span v-if="resendCooldown > 0">
            Wait {{ resendCooldown }}s before sending again
          </span>
          <span v-else>
            {{ loading ? "Sending..." : "Send Reset Link" }}
          </span>
        </Button>
      </form>

      <!-- Success/Error Messages -->
      <div v-if="message" class="mt-4">
        <Alert :variant="messageType === 'success' ? 'default' : 'destructive'">
          <CheckCircle v-if="messageType === 'success'" class="h-4 w-4" />
          <AlertCircle v-else class="h-4 w-4" />
          <AlertDescription>
            {{ message }}
          </AlertDescription>
        </Alert>
      </div>

      <!-- Success state additional info -->
      <div v-if="isEmailSent" class="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
        <div class="flex items-start">
          <Mail class="w-5 h-5 text-green-600 mt-0.5 mr-3" />
          <div class="text-sm text-green-800">
            <p class="font-medium">Check your email</p>
            <p class="mt-1">We sent a password reset link to <strong>{{ email }}</strong></p>
            <p class="mt-2 text-green-600">Didn't receive it? Check your spam folder or 
              <!-- Show different elements based on state -->
              <span v-if="loading" class="text-gray-500">
                <Loader2 class="w-3 h-3 inline animate-spin mr-1" />
                sending...
              </span>
              <span v-else-if="resendCooldown > 0" class="text-gray-500 cursor-not-allowed">
                resend in {{ resendCooldown }}s
              </span>
              <button 
                v-else
                @click="handleResend" 
                class="underline text-green-600 hover:text-green-700 hover:no-underline transition-colors duration-200"
              >
                resend email
              </button>
            </p>
          </div>
        </div>
      </div>

      <p class="text-center mt-6">
        <router-link to="/auth/login" class="text-[#000080] hover:text-[#000070] hover:underline font-medium">
          Back to login
        </router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from "vue";
import { authAPI } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, Mail, Loader2 } from "lucide-vue-next";
import { useAuthSEO } from "@/composables/useSEO";

// SEO Configuration
useAuthSEO('forgotPassword')

const email = ref("");
const message = ref("");
const messageType = ref("");
const loading = ref(false);
const isEmailSent = ref(false);
const emailError = ref("");
const resendCooldown = ref(0);

let cooldownInterval = null;

// Email validation
const validateEmail = () => {
  emailError.value = "";
  
  if (!email.value) {
    emailError.value = "Email is required";
    return false;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.value)) {
    emailError.value = "Please enter a valid email address";
    return false;
  }
  
  return true;
};

const startResendCooldown = () => {
  resendCooldown.value = 60; // 60 seconds cooldown
  cooldownInterval = setInterval(() => {
    resendCooldown.value--;
    if (resendCooldown.value <= 0) {
      clearInterval(cooldownInterval);
    }
  }, 1000);
};

const handleForgotPassword = async () => {
  // Reset states
  message.value = "";
  messageType.value = "";
  isEmailSent.value = false;
  
  // Validate email
  if (!validateEmail()) {
    return;
  }

  loading.value = true;

  try {
    // Make API call to backend using authAPI service
    const response = await authAPI.forgotPassword(email.value);
    
    // Success
    message.value = response.message || "Password reset link sent to your email.";
    messageType.value = "success";
    isEmailSent.value = true;
    
    // Start resend cooldown
    startResendCooldown();
    
    console.log("Forgot password request successful");
    
  } catch (error) {
    console.error("Forgot password error:", error);
    
    // Handle different error types
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const errorMessage = error.response.data.message || error.response.data.error;
      
      if (status === 404) {
        message.value = "No account found with this email address.";
      } else if (status === 400) {
        message.value = errorMessage || "Please provide a valid email address.";
      } else {
        message.value = errorMessage || "Failed to send reset link. Please try again.";
      }
    } else if (error.request) {
      // Request was made but no response received
      message.value = "Unable to connect to server. Please check your connection.";
    } else {
      // Something else happened
      message.value = "An unexpected error occurred. Please try again.";
    }
    
    messageType.value = "error";
    isEmailSent.value = false;
  } finally {
    loading.value = false;
  }
};

const handleResend = async () => {
  // Prevent resend if still in cooldown or currently loading
  if (resendCooldown.value > 0 || loading.value) {
    return;
  }
  
  // Reset the email sent state and trigger the forgot password again
  isEmailSent.value = false;
  await handleForgotPassword();
};

// Cleanup on component unmount
onUnmounted(() => {
  if (cooldownInterval) {
    clearInterval(cooldownInterval);
  }
});
</script>