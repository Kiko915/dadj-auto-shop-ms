// stores/auth.js
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { authAPI } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  // State
  const token = ref(localStorage.getItem('authToken'))
  const userEmail = ref(localStorage.getItem('userEmail'))
  const userRole = ref(localStorage.getItem('userRole'))
  const userName = ref(localStorage.getItem('userName'))
  const profilePicture = ref(localStorage.getItem('profilePicture'))
  const createdAt = ref(localStorage.getItem('createdAt'))
  
  // Address fields
  const region = ref(localStorage.getItem('region'))
  const province = ref(localStorage.getItem('province'))
  const city = ref(localStorage.getItem('city'))
  const barangay = ref(localStorage.getItem('barangay'))
  const street = ref(localStorage.getItem('street'))
  const country = ref(localStorage.getItem('country'))
  
  // Getters
  const isAuthenticated = computed(() => !!token.value)
  const currentUser = computed(() => ({
    email: userEmail.value,
    role: userRole.value,
    name: userName.value,
    profilePicture: profilePicture.value,
    createdAt: createdAt.value,
    region: region.value,
    province: province.value,
    city: city.value,
    barangay: barangay.value,
    street: street.value,
    country: country.value,
    isLoggedIn: isAuthenticated.value
  }))
  
  // Actions
  function login(authToken, user) {
    token.value = authToken
    userEmail.value = user.email
    userRole.value = user.role || 'user'
    userName.value = user.name || null
    profilePicture.value = user.profilePicture || null
    createdAt.value = user.createdAt || null
    region.value = user.region || null
    province.value = user.province || null
    city.value = user.city || null
    barangay.value = user.barangay || null
    street.value = user.street || null
    country.value = user.country || 'Philippines'
    
    localStorage.setItem('authToken', authToken)
    localStorage.setItem('userEmail', user.email)
    localStorage.setItem('userRole', user.role || 'user')
    if (user.name) localStorage.setItem('userName', user.name)
    if (user.profilePicture) localStorage.setItem('profilePicture', user.profilePicture)
    if (user.createdAt) localStorage.setItem('createdAt', user.createdAt)
    if (user.region) localStorage.setItem('region', user.region)
    if (user.province) localStorage.setItem('province', user.province)
    if (user.city) localStorage.setItem('city', user.city)
    if (user.barangay) localStorage.setItem('barangay', user.barangay)
    if (user.street) localStorage.setItem('street', user.street)
    if (user.country) localStorage.setItem('country', user.country)
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
    userRole.value = null
    userName.value = null
    profilePicture.value = null
    createdAt.value = null
    region.value = null
    province.value = null
    city.value = null
    barangay.value = null
    street.value = null
    country.value = null
    
    localStorage.removeItem('authToken')
    localStorage.removeItem('userEmail')
    localStorage.removeItem('userRole')
    localStorage.removeItem('userName')
    localStorage.removeItem('profilePicture')
    localStorage.removeItem('createdAt')
    localStorage.removeItem('region')
    localStorage.removeItem('province')
    localStorage.removeItem('city')
    localStorage.removeItem('barangay')
    localStorage.removeItem('street')
    localStorage.removeItem('country')
  }

  function updateProfile(userData) {
    // Update state with new user data
    if (userData.name !== undefined) {
      userName.value = userData.name
      localStorage.setItem('userName', userData.name)
    }
    
    if (userData.region !== undefined) {
      region.value = userData.region
      if (userData.region) localStorage.setItem('region', userData.region)
      else localStorage.removeItem('region')
    }
    
    if (userData.province !== undefined) {
      province.value = userData.province
      if (userData.province) localStorage.setItem('province', userData.province)
      else localStorage.removeItem('province')
    }
    
    if (userData.city !== undefined) {
      city.value = userData.city
      if (userData.city) localStorage.setItem('city', userData.city)
      else localStorage.removeItem('city')
    }
    
    if (userData.barangay !== undefined) {
      barangay.value = userData.barangay
      if (userData.barangay) localStorage.setItem('barangay', userData.barangay)
      else localStorage.removeItem('barangay')
    }
    
    if (userData.street !== undefined) {
      street.value = userData.street
      if (userData.street) localStorage.setItem('street', userData.street)
      else localStorage.removeItem('street')
    }
    
    if (userData.profilePicture !== undefined) {
      profilePicture.value = userData.profilePicture
      if (userData.profilePicture) localStorage.setItem('profilePicture', userData.profilePicture)
      else localStorage.removeItem('profilePicture')
    }
  }
  
  function getAuthHeader() {
    return token.value ? { Authorization: `Bearer ${token.value}` } : {}
  }
  
  return {
    // State
    token,
    userEmail,
    userRole,
    userName,
    profilePicture,
    createdAt,
    region,
    province,
    city,
    barangay,
    street,
    country,
    // Getters
    isAuthenticated,
    currentUser,
    // Actions
    login,
    logout,
    updateProfile,
    getAuthHeader
  }
})