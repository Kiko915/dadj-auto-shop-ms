<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Info } from 'lucide-vue-next'

const router = useRouter()
const email = ref('')
const password = ref('')

const handleLogin = () => {
  // TODO: Implement login logic
  console.log('Login with:', email.value, password.value)
}
</script>

<template>
  <div class="flex min-h-screen w-full bg-white">
    <!-- Left Panel -->
    <div class="relative hidden lg:flex lg:w-[720px] bg-[#000080] overflow-hidden bg-cover bg-center bg-no-repeat" style="background-image: url('/images/left-panel.png')">
      <!-- Logo -->
      <div class="absolute left-[25px] top-[22px] w-[75px] h-[75px] flex items-center justify-center">
        <img src="/logo/symbol_logo_white.png" alt="Logo" class="w-full h-full object-contain" />
      </div>

      <!-- Content -->
      <div class="relative z-10 flex flex-col mt-36 px-[100px]">
        <h2 class="text-white text-4xl font-light mb-4">
          Customized Workflow
        </h2>
        <p class="text-white/80 text-xl font-extralight">
          The IMS is customized to be your trusted<br />
          system when noting stocks.
        </p>
      </div>

      <!-- Screenshot Preview -->
      <div class="absolute right-[-5px] bottom-[10px] w-[600px]">
        <img 
          src="/images/screenshot-rocks 1.png" 
          alt="Dashboard Preview" 
          class="w-full h-full object-cover"
        />
      </div>
    </div>

    <!-- Right Panel - Login Form -->
    <div class="flex-1 flex items-center justify-center px-8">
      <div class="w-full max-w-[544px] space-y-6">
        <!-- Welcome Header -->
        <div class="space-y-2">
          <h1 class="text-[32px] font-normal text-[#424242]">
            Welcome Back!
          </h1>
        </div>

        <!-- Login Form -->
        <form @submit.prevent="handleLogin" class="space-y-6">
          <!-- Email Field -->
          <div class="space-y-2">
            <Label for="email" class="text-sm font-medium text-[#0a0a0a]">
              Email address
            </Label>
            <Input
              id="email"
              v-model="email"
              type="email"
              placeholder="synera@gmail.com"
              class="h-[49px] rounded-lg border-[#e5e5e5] text-sm"
              required
            />
          </div>

          <!-- Password Field -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <Label for="password" class="text-sm font-medium text-[#0a0a0a]">
                Password
              </Label>
              <a 
                href="/auth/forgot-password" 
                class="text-sm text-[#2b7fff] underline hover:text-[#1a5fcf] transition-colors"
              >
                Forgot Password?
              </a>
            </div>
            <Input
              id="password"
              v-model="password"
              type="password"
              placeholder="****************"
              class="h-[49px] rounded-lg border-[#e5e5e5] text-sm"
              required
            />
          </div>

          <!-- Login Button -->
          <Button
            type="submit"
            class="w-full h-[49px] bg-[#000080] hover:bg-[#000066] text-white rounded-lg font-medium text-sm"
          >
            Log In
          </Button>

          <!-- Account Creation Alert -->
          <Alert class="border-[#e5e5e5] rounded-lg">
            <Info class="h-4 w-4 text-[#525252]" />
            <AlertTitle class="text-sm font-medium text-[#0a0a0a]">
              Account Creation
            </AlertTitle>
            <AlertDescription class="text-sm text-[#737373]">
              Please contact the administrator to be able to be added as a Staff member.
            </AlertDescription>
          </Alert>
        </form>

        <!-- Footer -->
        <div class="flex items-center justify-between pt-8 text-xs text-[rgba(0,0,0,0.8)]">
          <p class="text-[rgba(43,43,43,0.8)]">
            Developed by <span class="font-bold">Synera</span>
          </p>
          <p>v 1.0.0</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Additional styles if needed */
</style>