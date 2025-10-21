import { useLoadingStore } from '@/stores/loading'

export function useLoading() {
  const loadingStore = useLoadingStore()

  const showLoading = (message = 'Loading...') => {
    loadingStore.showLoading(message)
  }

  const hideLoading = (delay = 500) => {
    loadingStore.hideLoading(delay)
  }

  const hideLoadingImmediately = () => {
    loadingStore.hideLoadingImmediately()
  }

  // Helper methods for common loading scenarios
  const showNavigationLoading = () => {
    showLoading('Navigating...')
  }

  const showDataLoading = () => {
    showLoading('Loading data...')
  }

  const showSavingLoading = () => {
    showLoading('Saving...')
  }

  const showAuthLoading = () => {
    showLoading('Authenticating...')
  }

  return {
    isLoading: loadingStore.isLoading,
    loadingMessage: loadingStore.loadingMessage,
    showLoading,
    hideLoading,
    hideLoadingImmediately,
    showNavigationLoading,
    showDataLoading,
    showSavingLoading,
    showAuthLoading
  }
}