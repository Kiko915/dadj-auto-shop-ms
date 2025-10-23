<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { authAPI } from '@/api/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Info, Eye, EyeOff, AlertCircle, Loader2, CheckCircle } from 'lucide-vue-next'
import { useAuthSEO } from '@/composables/useSEO'

// SEO Configuration
useAuthSEO('login')

const router = useRouter()
const authStore = useAuthStore()
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const isLoading = ref(false)
const isLoginSuccess = ref(false)

// Rotating content configuration
const contentItems = [
  {
    title: 'Customized Workflow',
    subtitle: 'The IMS is customized to be your trusted\nsystem when noting stocks.'
  },
  {
    title: 'Real-Time Inventory',
    subtitle: 'Instantly track parts, manage stock levels, and\nautomate reordering to avoid shortages.'
  },
  {
    title: 'Detailed Service History',
    subtitle: 'Access complete customer and vehicle histories\nwith just a few clicks for faster diagnostics.'
  },
  {
    title: 'Integrated Billing',
    subtitle: 'Generate accurate invoices, process payments, and\nmanage finances all in one place.'
  },
  {
    title: 'Insightful Reporting',
    subtitle: 'Create reports on sales, services, and inventory\nto make data-driven business decisions.'
  }
]

const currentContentIndex = ref(0)
let rotationInterval = null

// Current content computed property
const currentContent = computed(() => contentItems[currentContentIndex.value])

// Start content rotation
const startContentRotation = () => {
  rotationInterval = setInterval(() => {
    currentContentIndex.value = (currentContentIndex.value + 1) % contentItems.length
  }, 10000) // Change every 10 seconds
}

// Stop content rotation
const stopContentRotation = () => {
  if (rotationInterval) {
    clearInterval(rotationInterval)
    rotationInterval = null
  }
}

// Lifecycle hooks
onMounted(() => {
  startContentRotation()
})

onUnmounted(() => {
  stopContentRotation()
})

// Validation state
const emailError = ref('')
const passwordError = ref('')
const formError = ref('')

// Email validation
const validateEmail = () => {
  emailError.value = ''
  
  if (!email.value) {
    emailError.value = 'Email is required'
    return false
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.value)) {
    emailError.value = 'Please enter a valid email address'
    return false
  }
  
  return true
}

// Password validation
const validatePassword = () => {
  passwordError.value = ''
  
  if (!password.value) {
    passwordError.value = 'Password is required'
    return false
  }
  
  if (password.value.length < 6) {
    passwordError.value = 'Password must be at least 6 characters long'
    return false
  }
  
  return true
}

// Form validation
const isFormValid = computed(() => {
  return email.value && password.value && !emailError.value && !passwordError.value
})

// Clear errors when user types
const onEmailInput = () => {
  if (emailError.value) {
    emailError.value = ''
  }
  if (formError.value) {
    formError.value = ''
  }
}

const onPasswordInput = () => {
  if (passwordError.value) {
    passwordError.value = ''
  }
  if (formError.value) {
    formError.value = ''
  }
}

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

const handleLogin = async () => {
  // Clear previous errors
  formError.value = ''
  
  // Validate form
  const isEmailValid = validateEmail()
  const isPasswordValid = validatePassword()
  
  if (!isEmailValid || !isPasswordValid) {
    return
  }
  
  isLoading.value = true
  
  try {
    // Make API call to backend using authAPI service
    const data = await authAPI.login(email.value, password.value)
    
    // Success - store token and redirect
    if (data.token) {
      // Use auth store to manage authentication
      authStore.login(data.token, data.user)
      
      // Show success indicator
      isLoginSuccess.value = true
      console.log('Login successful:', data.message)
      
      // Redirect to dashboard after a brief delay
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)
    } else {
      throw new Error('No authentication token received')
    }
    
  } catch (error) {
    console.error('Login error:', error)
    
    // Handle axios errors
    if (error.response) {
      // Server responded with error status
      formError.value = error.response.data.message || 'Login failed. Please try again.'
    } else if (error.request) {
      // Request was made but no response received
      formError.value = 'Unable to connect to server. Please check your connection.'
    } else {
      // Something else happened
      formError.value = error.message || 'Login failed. Please try again.'
    }
  } finally {
    isLoading.value = false
  }
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
      <div class="relative z-10 flex flex-col mt-30 px-[100px]">
        <Transition name="fade" mode="out-in">
          <h2 :key="currentContent.title" class="text-white text-4xl font-light mb-4">
            {{ currentContent.title }}
          </h2>
        </Transition>
        <Transition name="fade" mode="out-in">
          <p :key="currentContent.subtitle" class="text-white/80 text-xl font-extralight whitespace-pre-line">
            {{ currentContent.subtitle }}
          </p>
        </Transition>
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
        <!-- Mobile Logo (shown only on smaller screens) -->
        <div class="lg:hidden flex justify-center mb-8">
          <img 
            src="/logo/symbol_w_wordmark_primary.png" 
            alt="Dad-J Auto Shop" 
            class="h-20 w-auto"
          />
        </div>

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
              :class="[
                'rounded-lg text-sm transition-colors',
                emailError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-[#e5e5e5] focus:border-[#000080] focus:ring-[#000080]'
              ]"
              @input="clearEmailError"
              @blur="validateEmail"
              required
            />
            <p v-if="emailError" class="text-sm text-red-500 mt-1">
              {{ emailError }}
            </p>
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
            <div class="relative">
              <Input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="****************"
                :class="[
                  'rounded-lg text-sm pr-10 transition-colors',
                  passwordError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-[#e5e5e5] focus:border-[#000080] focus:ring-[#000080]'
                ]"
                @input="clearPasswordError"
                @blur="validatePassword"
                required
              />
              <button
                type="button"
                @click="togglePasswordVisibility"
                class="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#737373] hover:text-[#0a0a0a] transition-colors"
              >
                <Eye v-if="!showPassword" class="h-4 w-4" />
                <EyeOff v-else class="h-4 w-4" />
              </button>
            </div>
            <p v-if="passwordError" class="text-sm text-red-500 mt-1">
              {{ passwordError }}
            </p>
          </div>

          <!-- General Error Display -->
          <Alert v-if="formError" variant="destructive" class="border-red-200 bg-red-50">
            <AlertCircle class="h-4 w-4" />
            <AlertDescription class="text-sm">
              {{ formError }}
            </AlertDescription>
          </Alert>

          <!-- Success Display -->
          <Alert v-if="isLoginSuccess" class="border-green-200 bg-green-50">
            <CheckCircle class="h-4 w-4 text-green-600" />
            <AlertDescription class="text-sm text-green-800">
              Login successful! Redirecting to dashboard...
            </AlertDescription>
          </Alert>

          <!-- Login Button -->
          <Button
            type="submit"
            :disabled="isLoading || !isFormValid"
            class="w-full bg-[#000080] hover:bg-[#000066] disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium text-sm flex items-center justify-center"
          >
            <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
            {{ isLoading ? 'Logging in...' : 'Log In' }}
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
/* Smooth fade transition for rotating content */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.8s ease-in-out, transform 0.8s ease-in-out;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
  transform: translateY(0);
}
</style>