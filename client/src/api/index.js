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
      
      // Check if it's an expired token
      if (errorCode === 'EXPIRED_TOKEN') {
        toast.error('Session Expired', {
          description: 'Your session has expired. Please log in again.'
        })
      } else {
        toast.error('Authentication Failed', {
          description: 'Please log in to continue.'
        })
      }
      
      // Clear auth state
      const authStore = useAuthStore()
      authStore.logout()
      
      // Redirect to login page
      router.push('/auth/login')
    }
    return Promise.reject(error)
  }
)

export default api