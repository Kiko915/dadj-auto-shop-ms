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
      <!-- Header -->
      <div class="text-center mb-6">
        <h2 class="text-2xl font-semibold text-gray-800 mb-2">
          Reset Your Password
        </h2>
        <p class="text-gray-500 text-sm">
          Enter your new password below
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="verifyingToken" class="text-center py-8">
        <Loader2 class="w-8 h-8 animate-spin mx-auto mb-4 text-[#000080]" />
        <p class="text-gray-600">Verifying reset link...</p>
      </div>

      <!-- Invalid Token State -->
      <div v-else-if="!isValidToken" class="text-center py-8">
        <AlertCircle class="w-12 h-12 mx-auto mb-4 text-red-500" />
        <h3 class="text-lg font-semibold text-gray-800 mb-2">Invalid Reset Link</h3>
        <p class="text-gray-600 mb-6">
          This password reset link is invalid or has expired.
        </p>
        <Button @click="goToForgotPassword" variant="outline" class="w-full">
          Request New Reset Link
        </Button>
      </div>

      <!-- Reset Form -->
      <form v-else @submit.prevent="handleResetPassword" class="space-y-4">
        <!-- New Password Field -->
        <div>
          <Label for="password" class="block text-sm font-medium text-gray-700 mb-1">
            New Password
          </Label>
          <div class="relative">
            <Input
              id="password"
              :type="showPassword ? 'text' : 'password'"
              v-model="password"
              required
              placeholder="Enter your new password"
              :disabled="loading"
              class="w-full pr-10"
              :class="passwordError ? 'border-red-500 focus:ring-red-500' : ''"
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <Eye v-if="!showPassword" class="h-4 w-4 text-gray-400" />
              <EyeOff v-else class="h-4 w-4 text-gray-400" />
            </button>
          </div>
          <p v-if="passwordError" class="text-red-500 text-sm mt-1">
            {{ passwordError }}
          </p>
        </div>

        <!-- Confirm Password Field -->
        <div>
          <Label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">
            Confirm New Password
          </Label>
          <div class="relative">
            <Input
              id="confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              v-model="confirmPassword"
              required
              placeholder="Confirm your new password"
              :disabled="loading"
              class="w-full pr-10"
              :class="confirmPasswordError ? 'border-red-500 focus:ring-red-500' : ''"
            />
            <button
              type="button"
              @click="showConfirmPassword = !showConfirmPassword"
              class="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <Eye v-if="!showConfirmPassword" class="h-4 w-4 text-gray-400" />
              <EyeOff v-else class="h-4 w-4 text-gray-400" />
            </button>
          </div>
          <p v-if="confirmPasswordError" class="text-red-500 text-sm mt-1">
            {{ confirmPasswordError }}
          </p>
        </div>

        <!-- Password Requirements -->
        <div class="bg-gray-50 p-4 rounded-lg">
          <p class="text-sm font-medium text-gray-700 mb-2">Password Requirements:</p>
          <ul class="text-sm text-gray-600 space-y-1">
            <li class="flex items-center">
              <CheckCircle v-if="hasMinLength" class="w-4 h-4 text-green-500 mr-2" />
              <AlertCircle v-else class="w-4 h-4 text-gray-400 mr-2" />
              At least 8 characters
            </li>
            <li class="flex items-center">
              <CheckCircle v-if="hasUpperCase" class="w-4 h-4 text-green-500 mr-2" />
              <AlertCircle v-else class="w-4 h-4 text-gray-400 mr-2" />
              One uppercase letter
            </li>
            <li class="flex items-center">
              <CheckCircle v-if="hasLowerCase" class="w-4 h-4 text-green-500 mr-2" />
              <AlertCircle v-else class="w-4 h-4 text-gray-400 mr-2" />
              One lowercase letter
            </li>
            <li class="flex items-center">
              <CheckCircle v-if="hasNumber" class="w-4 h-4 text-green-500 mr-2" />
              <AlertCircle v-else class="w-4 h-4 text-gray-400 mr-2" />
              One number
            </li>
          </ul>
        </div>

        <!-- Submit Button -->
        <Button
          type="submit"
          :disabled="loading || !isFormValid"
          class="w-full bg-[#000080] hover:bg-[#000070] text-white font-medium"
        >
          <Loader2 v-if="loading" class="w-4 h-4 mr-2 animate-spin" />
          {{ loading ? "Updating Password..." : "Update Password" }}
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

      <!-- Success State -->
      <div v-if="isPasswordReset" class="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
        <div class="flex items-start">
          <CheckCircle class="w-5 h-5 text-green-600 mt-0.5 mr-3" />
          <div class="text-sm text-green-800">
            <p class="font-medium">Password Updated Successfully!</p>
            <p class="mt-1">You can now sign in with your new password.</p>
            <Button 
              @click="goToLogin" 
              variant="outline" 
              size="sm" 
              class="mt-3 bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
            >
              Go to Login
            </Button>
          </div>
        </div>
      </div>

      <!-- Back to Login Link -->
      <p class="text-center mt-6">
        <router-link 
          to="/auth/login" 
          class="text-[#000080] hover:text-[#000070] hover:underline font-medium"
        >
          Back to login
        </router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { authAPI } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, Eye, EyeOff, Loader2 } from "lucide-vue-next";

const route = useRoute();
const router = useRouter();

// Form state
const password = ref("");
const confirmPassword = ref("");
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const loading = ref(false);
const verifyingToken = ref(true);
const isValidToken = ref(false);
const isPasswordReset = ref(false);

// Message state
const message = ref("");
const messageType = ref("");

// Validation state
const passwordError = ref("");
const confirmPasswordError = ref("");

// Get token from URL
const resetToken = computed(() => route.query.token);

// Password validation computed properties
const hasMinLength = computed(() => password.value.length >= 8);
const hasUpperCase = computed(() => /[A-Z]/.test(password.value));
const hasLowerCase = computed(() => /[a-z]/.test(password.value));
const hasNumber = computed(() => /\d/.test(password.value));
const isPasswordValid = computed(() => 
  hasMinLength.value && hasUpperCase.value && hasLowerCase.value && hasNumber.value
);
const doPasswordsMatch = computed(() => password.value === confirmPassword.value);
const isFormValid = computed(() => 
  isPasswordValid.value && doPasswordsMatch.value && password.value && confirmPassword.value
);

// Validate password
const validatePassword = () => {
  passwordError.value = "";
  
  if (!password.value) {
    passwordError.value = "Password is required";
    return false;
  }
  
  if (!isPasswordValid.value) {
    passwordError.value = "Password does not meet requirements";
    return false;
  }
  
  return true;
};

// Validate confirm password
const validateConfirmPassword = () => {
  confirmPasswordError.value = "";
  
  if (!confirmPassword.value) {
    confirmPasswordError.value = "Please confirm your password";
    return false;
  }
  
  if (!doPasswordsMatch.value) {
    confirmPasswordError.value = "Passwords do not match";
    return false;
  }
  
  return true;
};

// Verify token on component mount
const verifyResetToken = async () => {
  if (!resetToken.value) {
    isValidToken.value = false;
    verifyingToken.value = false;
    return;
  }

  try {
    // Call backend to verify token validity
    await authAPI.verifyResetToken(resetToken.value);
    isValidToken.value = true;
  } catch (error) {
    console.error("Token verification error:", error);
    isValidToken.value = false;
  } finally {
    verifyingToken.value = false;
  }
};

// Handle password reset
const handleResetPassword = async () => {
  // Reset states
  message.value = "";
  messageType.value = "";
  
  // Validate form
  const isPasswordValid = validatePassword();
  const isConfirmValid = validateConfirmPassword();
  
  if (!isPasswordValid || !isConfirmValid) {
    return;
  }

  loading.value = true;

  try {
    // Make API call to reset password
    const response = await authAPI.resetPassword(resetToken.value, password.value);
    
    // Success
    message.value = response.message || "Password updated successfully!";
    messageType.value = "success";
    isPasswordReset.value = true;
    
    console.log("Password reset successful");
    
  } catch (error) {
    console.error("Password reset error:", error);
    
    // Handle different error types
    if (error.response) {
      const status = error.response.status;
      const errorMessage = error.response.data.message || error.response.data.error;
      
      if (status === 400) {
        message.value = errorMessage || "Invalid or expired reset token.";
      } else if (status === 404) {
        message.value = "Reset token not found or already used.";
      } else {
        message.value = errorMessage || "Failed to reset password. Please try again.";
      }
    } else if (error.request) {
      message.value = "Unable to connect to server. Please check your connection.";
    } else {
      message.value = "An unexpected error occurred. Please try again.";
    }
    
    messageType.value = "error";
  } finally {
    loading.value = false;
  }
};

// Navigation helpers
const goToLogin = () => {
  router.push("/auth/login");
};

const goToForgotPassword = () => {
  router.push("/auth/forgot-password");
};

// Lifecycle
onMounted(() => {
  verifyResetToken();
});
</script>

<style scoped>
/* Additional styles for password requirements indicators */
.space-y-1 > * + * {
  margin-top: 0.25rem;
}
</style>