// api/auth.js - Authentication API endpoints
import api from './index'

export const authAPI = {
  // Login user
  login: async (email, password) => {
    const response = await api.post('/auth/login', {
      email,
      password
    })
    return response.data
  },

  // Register user (for future implementation)
  register: async (userData) => {
    const response = await api.post('/auth/register', userData)
    return response.data
  },

  // Forgot password (for future implementation)
  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email })
    return response.data
  },

  // Refresh token (for future implementation)
  refreshToken: async () => {
    const response = await api.post('/auth/refresh')
    return response.data
  },

  // Logout (for future implementation)
  logout: async () => {
    const response = await api.post('/auth/logout')
    return response.data
  }
}

export default authAPI