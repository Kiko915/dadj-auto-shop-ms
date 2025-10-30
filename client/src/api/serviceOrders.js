// api/serviceOrders.js - Service Order API endpoints
import api from './index'

/**
 * Get all service orders
 * @returns {Promise} Response with service orders array
 */
export const getServiceOrders = async () => {
  try {
    const response = await api.get('/service-orders')
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
