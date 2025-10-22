// stores/auth.js
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { authAPI } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  // State
  const token = ref(localStorage.getItem('authToken'))
  const userEmail = ref(localStorage.getItem('userEmail'))
  
  // Getters
  const isAuthenticated = computed(() => !!token.value)
  const currentUser = computed(() => ({
    email: userEmail.value,
    isLoggedIn: isAuthenticated.value
  }))
  
  // Actions
  function login(authToken, email) {
    token.value = authToken
    userEmail.value = email
    localStorage.setItem('authToken', authToken)
    localStorage.setItem('userEmail', email)
  }
  
  function logout() {
    // Call server logout if token exists
    if (token.value) {
      try {
        authAPI.logout().catch(error => {
          console.warn('Server logout failed:', error.message)
          // Continue with client-side logout even if server fails
        })
      } catch (error) {
        console.warn('Server logout error:', error.message)
      }
    }
    
    // Always clear client-side data
    token.value = null
    userEmail.value = null
    localStorage.removeItem('authToken')
    localStorage.removeItem('userEmail')
  }
  
  function getAuthHeader() {
    return token.value ? { Authorization: `Bearer ${token.value}` } : {}
  }
  
  return {
    // State
    token,
    userEmail,
    // Getters
    isAuthenticated,
    currentUser,
    // Actions
    login,
    logout,
    getAuthHeader
  }
})