<template>
  <div class="flex flex-col justify-start items-center min-h-screen bg-gray-100 pt-16">
    <!-- Logo ABOVE the card -->
    <img
      src="/logo/primary_logo.png"
      alt="App Logo"
      class="mb-8 w-28 h-28 object-contain"
    />

    <!-- Card -->
    <div class="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md">
      <h2 class="text-2xl font-semibold text-center mb-6 text-gray-800">
        Forgot your password?
      </h2>
      <p class="text-gray-500 text-center mb-6 text-sm">
        Enter your email and we’ll send you a password reset link.
      </p>

      <form @submit.prevent="handleForgotPassword" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1"
            >Email address</label
          >
          <input
            type="email"
            v-model="email"
            required
            placeholder="you@example.com"
            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <Button
          type="submit"
          :disabled="loading"
          variant="default"
          size="default"
          class="w-full"
        >
          {{ loading ? "Sending..." : "Send Reset Link" }}
        </Button>
      </form>

      <p
        v-if="message"
        class="text-center mt-4 text-sm"
        :class="messageType === 'success' ? 'text-green-600' : 'text-red-500'"
      >
        {{ message }}
      </p>

      <p class="text-center mt-6">
        <router-link to="/auth/login" class="text-blue-600 hover:underline">
          Back to login
        </router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import axios from "axios";
import { Button } from "@/components/ui/button";

const email = ref("");
const message = ref("");
const messageType = ref("");
const loading = ref(false);

const handleForgotPassword = async () => {
  loading.value = true;
  message.value = "";
  messageType.value = "";

  try {
    const res = await axios.post("https://your-api.com/auth/forgot-password", {
      email: email.value,
    });
    message.value = res.data.message || "Reset link sent to your email.";
    messageType.value = "success";
  } catch (err) {
    message.value =
      err.response?.data?.error || "Failed to send reset link. Try again.";
    messageType.value = "error";
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
body {
  font-family: "Inter", sans-serif;
}
</style>
