// api/index.js - Axios configuration
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'
import { toast } from 'vue-sonner'

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:4000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Handle common errors
    if (error.response?.status === 401) {
      const errorCode = error.response?.data?.error
      
      // Only auto-logout for session-related errors, not for invalid credentials
      if (errorCode === 'EXPIRED_TOKEN') {
        toast.error('Session Expired', {
          description: 'Your session has expired. Please log in again.'
        })
        
        // Clear auth state and redirect
        const authStore = useAuthStore()
        authStore.logout()
        router.push('/auth/login')
      } else if (errorCode === 'SESSION_TERMINATED') {
        toast.error('Session Terminated', {
          description: 'This session was logged out from another device.'
        })
        
        // Clear auth state and redirect
        const authStore = useAuthStore()
        authStore.logout()
        router.push('/auth/login')
      }
      // For INVALID_PASSWORD and other 401 errors, just pass through to component
      // Don't auto-logout as it might be user error (wrong password, etc.)
    }
    return Promise.reject(error)
  }
)

export default api