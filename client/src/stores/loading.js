import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useLoadingStore = defineStore('loading', () => {
  const isLoading = ref(false)
  const loadingMessage = ref('Loading...')
  let loadingTimeout = null

  const showLoading = (message = 'Loading...') => {
    // Clear any existing timeout
    if (loadingTimeout) {
      clearTimeout(loadingTimeout)
      loadingTimeout = null
    }
    
    loadingMessage.value = message
    isLoading.value = true
  }

  const hideLoading = (delay = 500) => {
    // Add minimum loading time to prevent flickering
    loadingTimeout = setTimeout(() => {
      isLoading.value = false
    }, delay)
  }

  const hideLoadingImmediately = () => {
    if (loadingTimeout) {
      clearTimeout(loadingTimeout)
      loadingTimeout = null
    }
    isLoading.value = false
  }

  return {
    isLoading,
    loadingMessage,
    showLoading,
    hideLoading,
    hideLoadingImmediately
  }
})