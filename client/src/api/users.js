// api/users.js - User Management API endpoints
import api from './index'

/**
 * Get all users with pagination, search, and filtering
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number
 * @param {number} params.pageSize - Items per page
 * @param {string} params.search - Search query
 * @param {string} params.role - Filter by role
 * @param {string} params.status - Filter by status (active/inactive)
 * @returns {Promise} Response with users array and metadata
 */
export const getAllUsers = async (params = {}) => {
    try {
        const response = await api.get('/users', { params })
        return response.data
    } catch (error) {
        throw error
    }
}

/**
 * Get a single user by ID
 * @param {string} userId - User ID
 * @returns {Promise} Response with user object
 */
export const getUser = async (userId) => {
    try {
        const response = await api.get(`/users/${userId}`)
        return response.data
    } catch (error) {
        throw error
    }
}

/**
 * Create a new user
 * @param {Object} userData - User data
 * @param {string} userData.email - User's email
 * @param {string} userData.name - User's full name
 * @param {string} userData.password - User's password
 * @param {string} userData.role - User's role (admin, staff, mechanic)
 * @param {boolean} userData.isActive - Whether user is active
 * @param {string} userData.profilePicture - Profile picture URL
 * @returns {Promise} Response with created user
 */
export const createUser = async (userData) => {
    try {
        const response = await api.post('/users', userData)
        return response.data
    } catch (error) {
        throw error
    }
}

/**
 * Update an existing user
 * @param {string} userId - User ID
 * @param {Object} userData - Updated user data
 * @returns {Promise} Response with updated user
 */
export const updateUser = async (userId, userData) => {
    try {
        const response = await api.put(`/users/${userId}`, userData)
        return response.data
    } catch (error) {
        throw error
    }
}

/**
 * Deactivate a user (soft delete)
 * @param {string} userId - User ID
 * @returns {Promise} Response with success message
 */
export const deactivateUser = async (userId) => {
    try {
        const response = await api.delete(`/users/${userId}`)
        return response.data
    } catch (error) {
        throw error
    }
}

/**
 * Reactivate a deactivated user
 * @param {string} userId - User ID
 * @returns {Promise} Response with activated user
 */
export const activateUser = async (userId) => {
    try {
        const response = await api.patch(`/users/${userId}/activate`)
        return response.data
    } catch (error) {
        throw error
    }
}
