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
 * Get all estimates
 * @param {Object} params - Query params (status, search)
 * @returns {Promise} List of estimates
 */
export const getEstimates = async (params = {}) => {
    const response = await api.get('/estimates', { params })
    return response.data
}
