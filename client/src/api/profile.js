import api from './index'

/**
 * Profile API endpoints
 */

/**
 * Export user data
 * @returns {Promise} Promise containing user data (profile, address, sessions, metadata)
 */
export const exportUserData = async () => {
  const response = await api.get('/user/export')
  return response.data
}

/**
 * Delete user account
 * @param {Object} data - Account deletion data
 * @param {string} data.password - User's current password
 * @param {string} data.confirmationWord - The randomly generated confirmation word
 * @param {string} data.providedWord - The word typed by the user
 * @returns {Promise} Promise containing deletion confirmation
 */
export const deleteAccount = async (data) => {
  const response = await api.delete('/user/account', { data })
  return response.data
}