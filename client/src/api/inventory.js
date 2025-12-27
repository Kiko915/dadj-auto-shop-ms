import api from './index'

export const getInventory = async (params) => {
    console.log('API: getInventory params:', params)
    const response = await api.get('/inventory', { params })
    return response.data
}

export const getInventoryStats = async () => {
    const response = await api.get('/inventory/stats')
    return response.data
}

export const getCategories = async () => {
    const response = await api.get('/inventory/categories')
    return response.data
}

export const getBrands = async () => {
    const response = await api.get('/inventory/brands')
    return response.data
}

export const getInventoryItem = async (id) => {
    const response = await api.get(`/inventory/${id}`)
    return response.data
}

export const addInventoryItem = async (itemData) => {
    const response = await api.post('/inventory', itemData)
    return response.data
}

export const updateInventoryItem = async (id, itemData) => {
    const response = await api.put(`/inventory/${id}`, itemData)
    return response.data
}

export const restockItem = async (id, quantity) => {
    const response = await api.patch(`/inventory/${id}/restock`, { quantity })
    return response.data
}

export const deleteInventoryItem = async (id) => {
    const response = await api.delete(`/inventory/${id}`)
    return response.data
}

export const bulkDeleteInventoryItems = async (ids) => {
    const response = await api.post('/inventory/bulk-delete', { ids })
    return response.data
}
