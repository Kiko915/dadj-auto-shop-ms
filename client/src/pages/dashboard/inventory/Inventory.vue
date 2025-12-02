<script setup>
import { ref, onMounted, watch } from 'vue'
import InventoryStats from '@/components/views/inventory/InventoryStats.vue'
import InventoryControls from '@/components/views/inventory/InventoryControls.vue'
import InventoryTable from '@/components/views/inventory/InventoryTable.vue'
import AddItemModal from '@/components/views/inventory/AddItemModal.vue'
import ItemDetailsSheet from '@/components/views/inventory/ItemDetailsSheet.vue'
import DeleteConfirmationModal from '@/components/views/inventory/DeleteConfirmationModal.vue'
import { getInventory, getInventoryStats, deleteInventoryItem, bulkDeleteInventoryItems } from '@/api/inventory'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-vue-next'

// State
const items = ref([])
const stats = ref({
  totalProducts: 0,
  lowStockItems: 0,
  totalValue: 0
})
const loading = ref(false)
const statsLoading = ref(false)
const currentPage = ref(1)
const totalPages = ref(1)
const search = ref('')
const category = ref('All')
const brand = ref('All')
const sortBy = ref('updatedAt')
const sortOrder = ref('desc')
const stockStatus = ref('all')
const showAddModal = ref(false)
const showDetailsSheet = ref(false)
const showDeleteModal = ref(false)
const selectedItem = ref(null)
const itemToDelete = ref(null)
const selectedItems = ref([])
const isBulkDelete = ref(false)

// Fetch Data
const fetchData = async () => {
  loading.value = true
  try {
    const res = await getInventory({
      page: currentPage.value,
      limit: 10,
      search: search.value,
      category: category.value,
      brand: brand.value,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value,
      stockStatus: stockStatus.value
    })
    items.value = res.items
    totalPages.value = res.totalPages
    currentPage.value = res.currentPage
  } catch (error) {
    toast.error('Error', {
      description: 'Failed to load inventory items.'
    })
  } finally {
    loading.value = false
  }
}

const fetchStats = async () => {
  statsLoading.value = true
  try {
    const res = await getInventoryStats()
    stats.value = res
  } catch (error) {
    console.error('Failed to load stats', error)
  } finally {
    statsLoading.value = false
  }
}

// Event Handlers
const handlePageChange = (page) => {
  currentPage.value = page
  fetchData()
}

let searchTimeout
const handleSearchUpdate = (val) => {
  search.value = val
  currentPage.value = 1
  
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    fetchData()
  }, 500)
}

const handleCategoryUpdate = (val) => {
  category.value = val
  currentPage.value = 1
  fetchData()
}

const handleBrandUpdate = (val) => {
    brand.value = val
    currentPage.value = 1
    fetchData()
}

const handleSortByUpdate = (val) => {
  console.log('Inventory: handleSortByUpdate', val)
  sortBy.value = val
  fetchData()
}

const handleSortOrderUpdate = (val) => {
  console.log('Inventory: handleSortOrderUpdate', val)
  sortOrder.value = val
  fetchData()
}

const handleStockStatusUpdate = (val) => {
  console.log('Inventory: handleStockStatusUpdate', val)
  stockStatus.value = val
  currentPage.value = 1
  fetchData()
}

const handleItemAdded = () => {
  fetchData()
  fetchStats()
}

const handleRestockSuccess = (updatedItem) => {
  // Update local item to reflect change immediately
  const index = items.value.findIndex(i => i.id === updatedItem.id)
  if (index !== -1) {
    items.value[index] = updatedItem
  }
  fetchStats() // Update stats as stock changed
}

const handleViewItem = (item) => {
  selectedItem.value = item
  showDetailsSheet.value = true
}

const handleEditItem = (item) => {
  // TODO: Implement edit functionality
  console.log('Edit item:', item)
  toast.info('Edit Feature', {
    description: 'Edit functionality coming soon.'
  })
}

const handleDeleteItem = (item) => {
  itemToDelete.value = item
  isBulkDelete.value = false
  showDeleteModal.value = true
}

const handleBulkDelete = () => {
  if (selectedItems.value.length === 0) return
  isBulkDelete.value = true
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  try {
    if (isBulkDelete.value) {
      await bulkDeleteInventoryItems(selectedItems.value)
      toast.success('Items Deleted', {
        description: `${selectedItems.value.length} items have been removed.`
      })
      selectedItems.value = [] // Clear selection
    } else {
      await deleteInventoryItem(itemToDelete.value.id)
      toast.success('Item Deleted', {
        description: `${itemToDelete.value.name} has been removed.`
      })
    }
    
    fetchData()
    fetchStats()
    showDetailsSheet.value = false // Close sheet if open
    showDeleteModal.value = false
  } catch (error) {
    toast.error('Delete Failed', {
      description: 'Could not delete item(s).'
    })
  }
}

// Initial Load
onMounted(() => {
  fetchData()
  fetchStats()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col justify-between">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-3xl font-bold tracking-tight">Inventory Management</h2>
          <p class="text-muted-foreground">Manage your product inventory, track stock levels, and monitor product performance.</p>
        </div>
        <Button 
          v-if="selectedItems.length > 0" 
          variant="destructive" 
          @click="handleBulkDelete"
        >
          <Trash2 class="mr-2 h-4 w-4" />
          Delete Selected ({{ selectedItems.length }})
        </Button>
      </div>
    </div>

    <!-- Stats Cards -->
    <InventoryStats :stats="stats" :loading="statsLoading" />

    <!-- Controls -->
    <InventoryControls 
      :search="search" 
      :category="category"
      :brand="brand"
      :sort-by="sortBy"
      :sort-order="sortOrder"
      :stock-status="stockStatus"
      @update:search="handleSearchUpdate"
      @update:category="handleCategoryUpdate"
      @update:brand="handleBrandUpdate"
      @update:sort-by="handleSortByUpdate"
      @update:sort-order="handleSortOrderUpdate"
      @update:stock-status="handleStockStatusUpdate"
      @add-item="showAddModal = true"
    />

    <!-- Table -->
    <InventoryTable 
      :items="items" 
      :loading="loading"
      :current-page="currentPage"
      :total-pages="totalPages"
      v-model:selectedItems="selectedItems"
      @page-change="handlePageChange"
      @edit-item="handleEditItem"
      @delete-item="handleDeleteItem"
      @view-item="handleViewItem"
      @restock-success="handleRestockSuccess"
    />

    <!-- Add Item Modal -->
    <AddItemModal 
      v-model:open="showAddModal" 
      @success="handleItemAdded" 
    />

    <DeleteConfirmationModal
      v-model:open="showDeleteModal"
      :item="isBulkDelete ? { name: `${selectedItems.length} items` } : itemToDelete"
      @confirm="confirmDelete"
    />

    <ItemDetailsSheet
      v-model:open="showDetailsSheet"
      :item-id="selectedItem?.id"
      @edit="handleEditItem"
      @delete="handleDeleteItem"
    />
  </div>
</template>
