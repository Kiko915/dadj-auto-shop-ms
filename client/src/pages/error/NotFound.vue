<template>
  <div class="h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center px-4">
    <div class="max-w-lg w-full text-center">
      <!-- Logo Section -->
      <div class="mb-8">
        <img 
          src="/logo/symbol_w_wordmark_primary.png" 
          alt="DADJ Auto Shop Logo" 
          class="h-16 mx-auto"
        />
      </div>

      <!-- Illustration -->
      <div class="-mb-8">
        <img 
          src="/images/notfound-illustration.png" 
          alt="Page Not Found Illustration" 
          class="max-w-xs mx-auto w-full h-auto"
        />
      </div>

      <!-- Error Code -->
      <div class="text-6xl sm:text-7xl font-bold text-[#000080] leading-none tracking-tight mb-6">
        404
      </div>

      <!-- Main Message -->
      <div class="space-y-3 mb-8">
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">
          Page Not Found
        </h1>
        <p class="text-gray-600 leading-relaxed">
          The page you're looking for doesn't exist.
        </p>
      </div>

      <!-- Action Button -->
      <Button 
        @click="goBack"
        variant="outline"
        class="px-8 py-3 text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-colors duration-200"
      >
        <ArrowLeft class="w-4 h-4 mr-2" />
        Go Back
      </Button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-vue-next'
import { useSEO } from '@/composables/useSEO'

// SEO Configuration
useSEO({
  title: 'Page Not Found - 404',
  description: 'The page you are looking for could not be found. Return to DADJ Auto Shop homepage to explore our automotive services.',
  keywords: '404, page not found, DADJ auto shop, error page',
  type: 'website'
})

const router = useRouter()
const authStore = useAuthStore()

const goBack = () => {
  // If there's history, go back, otherwise go to appropriate home
  if (window.history.length > 1) {
    router.go(-1)
  } else {
    // Smart redirect based on authentication status
    if (authStore.isAuthenticated) {
      router.push('/dashboard')
    } else {
      router.push('/auth/login')
    }
  }
}
</script>

<style scoped>
/* Minimalist DADJ Auto Shop 404 Page */

/* Smooth page entry animation */
.h-screen > div {
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Clean 404 number styling */
.text-6xl, .text-7xl {
  text-shadow: 0 2px 4px rgba(0, 0, 128, 0.1);
}

/* Simple hover effects */
img[alt="Page Not Found Illustration"] {
  transition: transform 0.3s ease;
}

img[alt="Page Not Found Illustration"]:hover {
  transform: translateY(-2px);
}

/* Responsive design */
@media (max-width: 640px) {
  .text-6xl {
    font-size: 3.5rem;
  }
}
</style>