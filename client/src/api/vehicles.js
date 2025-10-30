// api/vehicles.js - Vehicle API endpoints
import api from './index'

/**
 * Get all vehicles for a specific customer
 * @param {string} customerId - Customer ID
 * @returns {Promise} Response with vehicles array
 */
export const getCustomerVehicles = async (customerId) => {
  try {
    const response = await api.get(`/customers/${customerId}/vehicles`)
    return response.data
  } catch (error) {
    throw error
  }
}

/**
 * Get a single vehicle by ID
 * @param {string} vehicleId - Vehicle ID
 * @returns {Promise} Response with vehicle object
 */
export const getVehicle = async (vehicleId) => {
  try {
    const response = await api.get(`/vehicles/${vehicleId}`)
    return response.data
  } catch (error) {
    throw error
  }
}

/**
 * Create a new vehicle
 * @param {Object} vehicleData - Vehicle data
 * @param {string} vehicleData.customerId - Customer ID
 * @param {string} vehicleData.licensePlate - License plate
 * @param {string} vehicleData.make - Vehicle make
 * @param {string} vehicleData.model - Vehicle model
 * @param {number} [vehicleData.year] - Vehicle year (optional)
 * @param {string} [vehicleData.vin] - VIN number (optional)
 * @param {number} [vehicleData.mileage] - Mileage (optional)
 * @param {string} [vehicleData.vehicleType] - Vehicle type (optional)
 * @param {string} [vehicleData.notes] - Notes (optional)
 * @returns {Promise} Response with created vehicle
 */
export const createVehicle = async (vehicleData) => {
  try {
    const response = await api.post('/vehicles', vehicleData)
    return response.data
  } catch (error) {
    throw error
  }
}

/**
 * Update an existing vehicle
 * @param {string} vehicleId - Vehicle ID
 * @param {Object} vehicleData - Updated vehicle data
 * @returns {Promise} Response with updated vehicle
 */
export const updateVehicle = async (vehicleId, vehicleData) => {
  try {
    const response = await api.put(`/vehicles/${vehicleId}`, vehicleData)
    return response.data
  } catch (error) {
    throw error
  }
}

/**
 * Delete a vehicle
 * @param {string} vehicleId - Vehicle ID
 * @returns {Promise} Response with success message
 */
export const deleteVehicle = async (vehicleId) => {
  try {
    const response = await api.delete(`/vehicles/${vehicleId}`)
    return response.data
  } catch (error) {
    throw error
  }
}
