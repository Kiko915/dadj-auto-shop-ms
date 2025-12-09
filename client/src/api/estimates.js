import api from './index'

/**
 * Create a new estimate
 * @param {Object} estimateData
 * @returns {Promise} Created estimate
 */
export const createEstimate = async (estimateData) => {
    const response = await api.post('/estimates', estimateData)
    return response.data
}

/**
 * Get a single estimate by ID
 * @param {string} id
 * @returns {Promise} Estimate details
 */
export const getEstimate = async (id) => {
    const response = await api.get(`/estimates/${id}`)
    return response.data
}

/**
 * Update an estimate
 * @param {string} id
 * @param {Object} data
 * @returns {Promise} Updated estimate
 */
export const updateEstimate = async (id, data) => {
    const response = await api.put(`/estimates/${id}`, data)
    return response.data
}

/**
 * Update estimate status
 * @param {string} id
 * @param {string} status
 * @returns {Promise} Updated estimate
 */
export const updateEstimateStatus = async (id, status) => {
    const response = await api.patch(`/estimates/${id}/status`, { status })
    return response.data
}

/**
 * Delete an estimate
 * @param {string} id
 * @returns {Promise} Success message
 */
export const deleteEstimate = async (id) => {
    const response = await api.delete(`/estimates/${id}`)
    return response.data
}

/**
 * Get all estimates
 * @param {Object} params - Query params (status, search)
 * @returns {Promise} List of estimates
 */
export const getEstimates = async (params = {}) => {
    const response = await api.get('/estimates', { params })
    return response.data
}
/**
 * Get estimate statistics
 * @returns {Promise} Estimate statistics
 */
export const getEstimateStats = async () => {
    const response = await api.get('/estimates/stats')
    return response.data
}
