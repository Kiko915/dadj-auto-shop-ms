<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { toast } from 'vue-sonner'
import { getCustomers, deleteCustomer } from '@/api/customers'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

// Import modular components
import CustomerStatsCards from '@/components/views/customers/CustomerStatsCards.vue'
import CustomerFilters from '@/components/views/customers/CustomerFilters.vue'
import CustomerBulkActions from '@/components/views/customers/CustomerBulkActions.vue'
import CustomerTableHeader from '@/components/views/customers/CustomerTableHeader.vue'
import CustomerTableRow from '@/components/views/customers/CustomerTableRow.vue'
import DeleteCustomersDialog from '@/components/views/customers/DeleteCustomersDialog.vue'
import CustomerPagination from '@/components/views/customers/CustomerPagination.vue'

// Type definitions
type Customer = {
  id: string
  firstName: string
  lastName: string
  middleName?: string | null
  suffix?: string | null
  phoneNumber: string
  email: string
  profilePicture?: string | null
  loyaltyStatus: 'Loyal' | 'Regular' | 'VIP'
  totalVehicles: number
}

// State
const customers = ref<Customer[]>([])
const selectedCustomerIds = ref<string[]>([])
const searchQuery = ref('')
const debouncedSearchQuery = ref('')
const sortOrder = ref<'asc' | 'desc'>('asc')
const loyaltyFilter = ref<'all' | 'Loyal' | 'Regular' | 'VIP'>('all')
const currentPage = ref(1)
const itemsPerPage = ref(10)
const isLoading = ref(true)
const showDeleteDialog = ref(false)
const isDeleting = ref(false)

// Debounce search input
let debounceTimeout: ReturnType<typeof setTimeout>
watch(searchQuery, (newValue) => {
  clearTimeout(debounceTimeout)
  debounceTimeout = setTimeout(() => {
    debouncedSearchQuery.value = newValue
    currentPage.value = 1
  }, 300)
})

// Reset pagination when filters change
watch([sortOrder, loyaltyFilter, itemsPerPage], () => {
  currentPage.value = 1
})

// Clear selection when changing pages or filters
watch([currentPage, loyaltyFilter, debouncedSearchQuery], () => {
  selectedCustomerIds.value = []
})

// Fetch customers from API
const fetchCustomers = async () => {
  isLoading.value = true
  try {
    const response = await getCustomers()
    customers.value = response.customers || []
  } catch (error: any) {
    console.error('Failed to fetch customers:', error)
    toast.error('Failed to Load Customers', {
      description: error.response?.data?.message || 'Failed to load customers. Please try again.'
    })
    customers.value = []
  } finally {
    isLoading.value = false
  }
}

// Fetch customers on mount
onMounted(() => {
  fetchCustomers()
})

// Computed: Filter and sort customers
const filteredCustomers = computed(() => {
  const query = debouncedSearchQuery.value.trim().toLowerCase()

  const filtered = customers.value.filter((customer) => {
    // Loyalty filter with case-insensitive comparison
    if (loyaltyFilter.value !== 'all') {
      const filterValue = loyaltyFilter.value.toLowerCase()
      const customerStatus = (customer.loyaltyStatus || '').toLowerCase()
      if (customerStatus !== filterValue) {
        return false
      }
    }

    if (!query) return true
    
    const fullName = `${customer.firstName} ${customer.middleName || ''} ${customer.lastName} ${customer.suffix || ''}`.trim()
    const haystack = [
      customer.id,
      fullName,
      customer.firstName,
      customer.lastName,
      customer.middleName,
      customer.suffix,
      customer.phoneNumber,
      customer.email,
      customer.loyaltyStatus,
      String(customer.totalVehicles)
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return haystack.includes(query)
  })

  return [...filtered].sort((a, b) => {
    const nameA = `${a.firstName} ${a.lastName}`.toLowerCase()
    const nameB = `${b.firstName} ${b.lastName}`.toLowerCase()
    const comparison = nameA.localeCompare(nameB)
    return sortOrder.value === 'asc' ? comparison : -comparison
  })
})

// Computed: Stats
const totalCustomers = computed(() => customers.value.length)
const loyalCustomers = computed(() => 
  customers.value.filter(c => c.loyaltyStatus === 'Loyal').length
)
const totalVehicles = computed(() => 
  customers.value.reduce((sum, c) => sum + c.totalVehicles, 0)
)

// Computed: Pagination
const totalPages = computed(() => Math.ceil(filteredCustomers.value.length / itemsPerPage.value))

const paginatedCustomers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredCustomers.value.slice(start, end)
})

const startItem = computed(() => {
  if (filteredCustomers.value.length === 0) return 0
  return (currentPage.value - 1) * itemsPerPage.value + 1
})

const endItem = computed(() => {
  const end = currentPage.value * itemsPerPage.value
  return Math.min(end, filteredCustomers.value.length)
})

// Computed: Selection
const isAllSelected = computed(() => {
  if (paginatedCustomers.value.length === 0) return false
  return paginatedCustomers.value.every(customer => 
    selectedCustomerIds.value.includes(customer.id)
  )
})

const isIndeterminate = computed(() => {
  if (paginatedCustomers.value.length === 0) return false
  const selectedOnPage = paginatedCustomers.value.filter(customer => 
    selectedCustomerIds.value.includes(customer.id)
  ).length
  return selectedOnPage > 0 && selectedOnPage < paginatedCustomers.value.length
})

const selectAllModel = computed({
  get: () => isAllSelected.value,
  set: (value: boolean | 'indeterminate') => {
    if (value === true) {
      const newIds = paginatedCustomers.value
        .filter(customer => !selectedCustomerIds.value.includes(customer.id))
        .map(customer => customer.id)
      selectedCustomerIds.value = [...selectedCustomerIds.value, ...newIds]
    } else {
      const pageIds = paginatedCustomers.value.map(c => c.id)
      selectedCustomerIds.value = selectedCustomerIds.value.filter(id => !pageIds.includes(id))
    }
  }
})

const selectedCount = computed(() => selectedCustomerIds.value.length)

// Methods: Selection
const clearSelection = () => {
  selectedCustomerIds.value = []
}

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    const pageIds = paginatedCustomers.value.map(c => c.id)
    selectedCustomerIds.value = selectedCustomerIds.value.filter(id => !pageIds.includes(id))
  } else {
    const newIds = paginatedCustomers.value
      .filter(customer => !selectedCustomerIds.value.includes(customer.id))
      .map(customer => customer.id)
    selectedCustomerIds.value = [...selectedCustomerIds.value, ...newIds]
  }
}

const toggleCustomerSelection = (customerId: string) => {
  if (selectedCustomerIds.value.includes(customerId)) {
    selectedCustomerIds.value = selectedCustomerIds.value.filter(id => id !== customerId)
  } else {
    selectedCustomerIds.value = [...selectedCustomerIds.value, customerId]
  }
}

const isCustomerSelected = (customerId: string) => {
  return selectedCustomerIds.value.includes(customerId)
}

// Methods: Delete
const openDeleteDialog = () => {
  showDeleteDialog.value = true
}

const handleDeleteConfirm = async () => {
  if (selectedCustomerIds.value.length === 0) {
    toast.error('No customers selected')
    return
  }

  isDeleting.value = true
  let successCount = 0
  let errorCount = 0

  try {
    for (const customerId of selectedCustomerIds.value) {
      try {
        await deleteCustomer(customerId)
        successCount++
      } catch (error) {
        console.error(`Failed to delete customer ${customerId}:`, error)
        errorCount++
      }
    }

    if (successCount > 0 && errorCount === 0) {
      toast.success(`Successfully deleted ${successCount} customer${successCount > 1 ? 's' : ''}`)
    } else if (successCount > 0 && errorCount > 0) {
      toast.warning(`Deleted ${successCount} customer${successCount > 1 ? 's' : ''}, but ${errorCount} failed`)
    } else {
      toast.error('Failed to delete customers')
    }

    await fetchCustomers()
    clearSelection()
    showDeleteDialog.value = false
  } catch (error) {
    console.error('Error during bulk delete:', error)
    toast.error('An error occurred while deleting customers')
  } finally {
    isDeleting.value = false
  }
}

// Methods: Pagination
const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <header class="space-y-2">
      <h1 class="text-3xl font-bold tracking-tight">Customer Directory</h1>
      <p class="text-muted-foreground">
        Search, sort, and browse customers at a glance.
      </p>
    </header>

    <!-- Stats Cards -->
    <CustomerStatsCards
      v-if="!isLoading"
      :total-customers="totalCustomers"
      :loyal-customers="loyalCustomers"
      :total-vehicles="totalVehicles"
    />

    <!-- Stats Skeleton Loading -->
    <div v-else class="grid gap-4 md:grid-cols-3">
      <Card v-for="i in 3" :key="i">
        <div class="p-6 space-y-2">
          <Skeleton class="h-4 w-24" />
          <Skeleton class="h-8 w-16" />
        </div>
      </Card>
    </div>

    <!-- Filters and Actions -->
    <CustomerFilters
      v-model:search-query="searchQuery"
      v-model:loyalty-filter="loyaltyFilter"
      v-model:sort-order="sortOrder"
      v-model:items-per-page="itemsPerPage"
    />

    <!-- Bulk Actions Toolbar -->
    <CustomerBulkActions
      :selected-count="selectedCount"
      @clear-selection="clearSelection"
      @delete-selected="openDeleteDialog"
    />

    <!-- Customer Table -->
    <Card>
      <div v-if="isLoading" class="p-8">
        <div class="space-y-4">
          <Skeleton v-for="i in 5" :key="i" class="h-12 w-full" />
        </div>
      </div>

      <div v-else-if="filteredCustomers.length === 0" class="p-8 text-center">
        <p class="text-muted-foreground">No customers found.</p>
      </div>

      <div v-else class="overflow-x-auto">
        <CustomerTableHeader 
          :is-all-selected="isAllSelected"
          :is-indeterminate="isIndeterminate"
          @toggle-select-all="toggleSelectAll"
        />
        
        <CustomerTableRow
          v-for="customer in paginatedCustomers"
          :key="customer.id"
          :customer="customer"
          :is-selected="isCustomerSelected(customer.id)"
          @toggle-selection="toggleCustomerSelection"
        />
      </div>

      <!-- Pagination -->
      <div v-if="!isLoading && filteredCustomers.length > 0" class="border-t p-4">
        <CustomerPagination
          :current-page="currentPage"
          :total-pages="totalPages"
          :start-item="startItem"
          :end-item="endItem"
          :total-items="filteredCustomers.length"
          @previous="previousPage"
          @next="nextPage"
        />
      </div>
    </Card>

    <!-- Delete Confirmation Dialog -->
    <DeleteCustomersDialog
      v-model:open="showDeleteDialog"
      :selected-count="selectedCount"
      :is-deleting="isDeleting"
      @confirm="handleDeleteConfirm"
    />
  </div>
</template>
