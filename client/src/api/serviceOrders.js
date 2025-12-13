// api/serviceOrders.js - Service Order API endpoints
import api from './index'

/**
 * Get all service orders
 * @returns {Promise} Response with service orders array
 */
/**
 * Get all service orders with pagination and filtering
 * @param {Object} params - Query parameters (page, limit, search, status)
 * @returns {Promise} Response with service orders array
 */
export const getServiceOrders = async (params = {}) => {
  try {
    const response = await api.get('/service-orders', { params })
    return response.data
  } catch (error) {
    throw error
  }
}

/**
 * Get service orders for a specific customer
 * @param {string} customerId - Customer ID
 * @returns {Promise} Response with service orders array
 */
export const getCustomerServiceOrders = async (customerId) => {
  try {
    const response = await api.get(`/customers/${customerId}/service-orders`)
    return response.data
  } catch (error) {
    throw error
  }
}

/**
 * Get a single service order by ID
 * @param {string} serviceOrderId - Service Order ID
 * @returns {Promise} Response with service order object
 */
export const getServiceOrder = async (serviceOrderId) => {
  try {
    const response = await api.get(`/service-orders/${serviceOrderId}`)
    return response.data
  } catch (error) {
    throw error
  }
}

/**
 * Create a new service order
 * @param {Object} serviceOrderData - Service order data
 * @returns {Promise} Response with created service order
 */
export const createServiceOrder = async (serviceOrderData) => {
  try {
    const response = await api.post('/service-orders', serviceOrderData)
    return response.data
  } catch (error) {
    throw error
  }
}

/**
 * Update an existing service order
 * @param {string} serviceOrderId - Service Order ID
 * @param {Object} serviceOrderData - Updated service order data
 * @returns {Promise} Response with updated service order
 */
export const updateServiceOrder = async (serviceOrderId, serviceOrderData) => {
  try {
    const response = await api.put(`/service-orders/${serviceOrderId}`, serviceOrderData)
    return response.data
  } catch (error) {
    throw error
  }
}

export const addServiceOrderItem = async (serviceOrderId, itemData) => {
  try {
    const response = await api.post(`/service-orders/${serviceOrderId}/items`, itemData)
    return response.data
  } catch (error) {
    throw error
  }
}

export const updateServiceOrderItem = async (serviceOrderId, itemId, itemData) => {
  try {
    const response = await api.put(`/service-orders/${serviceOrderId}/items/${itemId}`, itemData)
    return response.data
  } catch (error) {
    throw error
  }
}

export const deleteServiceOrderItem = async (serviceOrderId, itemId) => {
  try {
    const response = await api.delete(`/service-orders/${serviceOrderId}/items/${itemId}`)
    return response.data
  } catch (error) {
    throw error
  }
}

/**
 * Delete a service order
 * @param {string} serviceOrderId - Service Order ID
 * @returns {Promise} Response with success message
 */
export const deleteServiceOrder = async (serviceOrderId) => {
  try {
    const response = await api.delete(`/service-orders/${serviceOrderId}`)
    return response.data
  } catch (error) {
    throw error
  }
}

export const addServiceOrderAdvisory = async (serviceOrderId, formData) => {
  try {
    const response = await api.post(`/service-orders/${serviceOrderId}/advisories`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  } catch (error) {
    throw error
  }
}


export const updateServiceOrderAdvisory = async (serviceOrderId, advisoryId, formData) => {
  try {
    const response = await api.put(`/service-orders/${serviceOrderId}/advisories/${advisoryId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  } catch (error) {
    throw error
  }
}

export const deleteServiceOrderAdvisory = async (serviceOrderId, advisoryId) => {
  try {
    const response = await api.delete(`/service-orders/${serviceOrderId}/advisories/${advisoryId}`)
    return response.data
  } catch (error) {
    throw error
  }
}
