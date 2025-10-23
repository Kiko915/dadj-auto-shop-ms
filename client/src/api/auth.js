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

  // Forgot password
  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email })
    return response.data
  },

  // Verify reset token
  verifyResetToken: async (token) => {
    const response = await api.get(`/auth/verify-reset-token?token=${token}`)
    return response.data
  },

  // Reset password
  resetPassword: async (token, password) => {
    const response = await api.post('/auth/reset-password', {
      token,
      password
    })
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
  },

  // Update user profile
  updateProfile: async (profileData) => {
    const response = await api.patch('/user/profile', profileData)
    return response.data
  }
}

export default authAPI