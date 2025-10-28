// api/customers.js - Customer API endpoints
import api from './index'

/**
 * Get all customers
 * @returns {Promise} Response with customers array
 */
export const getCustomers = async () => {
  try {
    const response = await api.get('/customers')
    return response.data
  } catch (error) {
    throw error
  }
}

/**
 * Get a single customer by ID
 * @param {string} id - Customer ID
 * @returns {Promise} Response with customer object
 */
export const getCustomer = async (id) => {
  try {
    const response = await api.get(`/customers/${id}`)
    return response.data
  } catch (error) {
    throw error
  }
}

/**
 * Create a new customer
 * @param {Object} customerData - Customer data
 * @param {string} customerData.firstName - First name
 * @param {string} customerData.lastName - Last name
 * @param {string} [customerData.middleName] - Middle name (optional)
 * @param {string} [customerData.suffix] - Suffix (optional)
 * @param {string} customerData.phoneNumber - Phone number
 * @param {string} customerData.email - Email address
 * @param {string} [customerData.profilePicture] - Base64 encoded profile picture (optional)
 * @param {string} [customerData.loyaltyStatus] - Loyalty status (optional)
 * @param {number} [customerData.totalVehicles] - Total vehicles (optional)
 * @param {string} [customerData.notes] - Notes (optional)
 * @returns {Promise} Response with created customer
 */
export const createCustomer = async (customerData) => {
  try {
    const response = await api.post('/customers', customerData)
    return response.data
  } catch (error) {
    throw error
  }
}

/**
 * Update an existing customer
 * @param {string} id - Customer ID
 * @param {Object} customerData - Updated customer data
 * @returns {Promise} Response with updated customer
 */
export const updateCustomer = async (id, customerData) => {
  try {
    const response = await api.put(`/customers/${id}`, customerData)
    return response.data
  } catch (error) {
    throw error
  }
}

/**
 * Delete a customer
 * @param {string} id - Customer ID
 * @returns {Promise} Response with success message
 */
export const deleteCustomer = async (id) => {
  try {
    const response = await api.delete(`/customers/${id}`)
    return response.data
  } catch (error) {
    throw error
  }
}

/**
 * Search customers
 * @param {string} query - Search query
 * @returns {Promise} Response with matching customers
 */
export const searchCustomers = async (query) => {
  try {
    const response = await api.get('/customers/search', {
      params: { q: query }
    })
    return response.data
  } catch (error) {
    throw error
  }
}
