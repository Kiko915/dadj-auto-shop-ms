<template>
  <Transition name="fade">
    <div v-if="loadingStore.isLoading" class="global-loader">
      <div class="loader-overlay">
        <div class="loader-content">
          <div class="loading-gif-container">
            <img 
              src="/gif/loading.gif" 
              alt="Loading..." 
              class="loading-gif"
              @error="handleImageError"
            />
            <!-- Fallback spinner if GIF fails to load -->
            <div v-if="showFallbackSpinner" class="fallback-spinner"></div>
          </div>
          <p class="loading-text">{{ loadingStore.loadingMessage }}</p>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLoadingStore } from '@/stores/loading'

const loadingStore = useLoadingStore()
const router = useRouter()
const showFallbackSpinner = ref(false)

// Handle loading GIF error
const handleImageError = () => {
  console.warn('Loading GIF failed to load, showing fallback spinner')
  showFallbackSpinner.value = true
}

onMounted(() => {
  // Show loader on page refresh/initial load
  loadingStore.showLoading('Initializing...')
  
  // Hide loader once page is fully loaded
  const handlePageLoad = () => {
    loadingStore.hideLoading(300)
  }
  
  if (document.readyState === 'complete') {
    // Page is already loaded
    setTimeout(() => loadingStore.hideLoading(300), 100)
  } else {
    // Wait for page load
    window.addEventListener('load', handlePageLoad)
  }
  
  // Router navigation events
  const removeBeforeEach = router.beforeEach((to, from, next) => {
    // Don't show loader for initial navigation or same route
    if (from.name !== undefined && to.path !== from.path) {
      loadingStore.showLoading('Navigating...')
    }
    next()
  })
  
  const removeAfterEach = router.afterEach(() => {
    // Small delay to ensure page content is rendered
    setTimeout(() => loadingStore.hideLoading(200), 100)
  })
  
  // Hide initial loader after component mounts
  setTimeout(() => loadingStore.hideLoading(), 1000)
  
  // Cleanup function
  const cleanup = () => {
    window.removeEventListener('load', handlePageLoad)
    removeBeforeEach()
    removeAfterEach()
  }
  
  // Store cleanup function for onUnmounted
  onUnmounted(cleanup)
})
</script>

<style scoped>
.global-loader {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  pointer-events: none;
}

.loader-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
}

.loader-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.loading-gif-container {
  position: relative;
  width: 80px;
  height: 80px;
}

.loading-gif {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.fallback-spinner {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 4px solid #f3f4f6;
  border-top: 4px solid #000080;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  font-size: 1.125rem;
  font-weight: 500;
  color: #374151;
  margin: 0;
  animation: pulse 2s ease-in-out infinite;
}

/* Fade transition for smooth show/hide */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease-in-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
}

/* Pulse animation for loading text */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

/* Spinner animation for fallback */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Mobile responsiveness */
@media (max-width: 640px) {
  .loading-gif-container {
    width: 60px;
    height: 60px;
  }
  
  .loading-text {
    font-size: 1rem;
  }
}
</style>