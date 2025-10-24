import axios from './index'

/**
 * Profile API endpoints
 */

/**
 * Export user data
 * @returns {Promise} Promise containing user data (profile, address, sessions, metadata)
 */
export const exportUserData = async () => {
  const response = await axios.get('/user/export')
  return response.data
}