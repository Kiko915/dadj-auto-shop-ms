<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'

import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { getCustomer } from '@/api/customers'
import { getCustomerVehicles, createVehicle, updateVehicle, deleteVehicle } from '@/api/vehicles'
import { getCustomerServiceOrders } from '@/api/serviceOrders'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ArrowLeft, User, Car, History, AlertTriangle } from 'lucide-vue-next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

// Component imports
import CustomerHeader from '@/components/views/customers/CustomerHeader.vue'
import CustomerGeneralInfo from '@/components/views/customers/CustomerGeneralInfo.vue'
import CustomerVehicles from '@/components/views/customers/CustomerVehicles.vue'
import CustomerServiceHistory from '@/components/views/customers/CustomerServiceHistory.vue'
import EditCustomerModal from '@/components/views/customers/EditCustomerModal.vue'
import VehicleForm from '@/components/views/vehicles/VehicleForm.vue'
import VehicleDetailsSheet from '@/components/views/vehicles/VehicleDetailsSheet.vue'

// Types
type Customer = {
  id: string
  firstName: string
  lastName: string
  middleName?: string | null
  suffix?: string | null
  phoneNumber: string
  email: string
  birthday?: string | null
  profilePicture?: string | null
  loyaltyStatus: 'Loyal' | 'Regular' | 'VIP'
  totalVehicles: number
  serviceCount: number
  totalSpent: number
  notes?: string | null
  dateCreated: string
  lastModified: string
}

type Vehicle = {
  id: string
  licensePlate: string
  make: string
  model: string
  year?: number
  vehicleType?: string
  mileage?: number
}

type ServiceRecord = {
  id: string
  date: string
  vehicleId: string
  vehicleName: string
  totalAmount: number
  paymentStatus: 'Paid' | 'Outstanding' | 'Partial'
}

// Router
const route = useRoute()
const router = useRouter()
const customerId = computed(() => route.params.id as string)

// State
const customer = ref<Customer | null>(null)
const vehicles = ref<Vehicle[]>([])
const serviceHistory = ref<ServiceRecord[]>([])
const isLoading = ref(true)
const isNewCustomer = computed(() => route.query.new === 'true')
const showVehicleNotice = ref(false)
const isEditModalOpen = ref(false)

// Get active tab from URL query or default to 'general'
const activeTab = computed({
  get: () => {
    const tab = route.query.tab as string
    // Validate tab value
    const validTabs = ['general', 'vehicles', 'history']
    return validTabs.includes(tab) ? tab : 'general'
  },
  set: (value: string) => {
    // Update URL query parameter without reloading the page
    router.push({
      query: { ...route.query, tab: value }
    })
  }
})

// Computed
const fullName = computed(() => {
  if (!customer.value) return ''
  const parts = [
    customer.value.firstName,
    customer.value.middleName,
    customer.value.lastName,
    customer.value.suffix,
  ].filter(Boolean)
  return parts.join(' ')
})

// Methods
// Pagination State for Vehicles
const vehiclePage = ref(1)
const vehiclePageSize = ref(5) // Smaller page size for tab view
const vehicleTotal = ref(0)
const vehicleTotalPages = ref(1)
const vehicleSearch = ref('')
const vehicleMakeFilter = ref('All')
const vehicleUniqueMakes = ref<string[]>([])
const vehicleSortBy = ref('dateRegistered')
const vehicleSortOrder = ref<'asc' | 'desc'>('desc')
let searchTimeout: ReturnType<typeof setTimeout> | undefined

// Methods
const fetchCustomerData = async () => {
  try {
    isLoading.value = true
    const response = await getCustomer(customerId.value)
    customer.value = response.customer

    await fetchVehicles()

    // Fetch service history
    try {
      const serviceResponse = await getCustomerServiceOrders(customerId.value)
      serviceHistory.value = serviceResponse.serviceOrders || []
    } catch (error) {
      console.warn('Failed to fetch service history:', error)
      serviceHistory.value = []
    }

    // Check if this is a new customer with no vehicles
    if (isNewCustomer.value && vehicles.value.length === 0) {
      showVehicleNotice.value = true
      // Remove the 'new' query param after checking to prevent showing notice on refresh
      router.replace({
        query: { ...route.query, new: undefined }
      })
    }
  } catch (error: any) {
    console.error('Error fetching customer:', error)
    toast.error('Failed to load customer details')
    router.push('/dashboard/customers')
  } finally {
    isLoading.value = false
  }
}

const fetchVehicles = async () => {
  try {
    const params = {
      page: vehiclePage.value,
      pageSize: vehiclePageSize.value,
      search: vehicleSearch.value,
      make: vehicleMakeFilter.value,
      sortBy: vehicleSortBy.value,
      sortOrder: vehicleSortOrder.value
    }
    const vehiclesResponse = await getCustomerVehicles(customerId.value, params)
    vehicles.value = vehiclesResponse.vehicles || []
    
    // Update pagination state
    if (vehiclesResponse.meta) {
        vehicleTotal.value = vehiclesResponse.meta.total
        vehicleTotalPages.value = vehiclesResponse.meta.totalPages
        vehiclePage.value = vehiclesResponse.meta.page
        if (vehiclesResponse.meta.uniqueMakes) {
             vehicleUniqueMakes.value = vehiclesResponse.meta.uniqueMakes
        }
    }
  } catch (error) {
    console.warn('Failed to fetch vehicles:', error)
    vehicles.value = []
  }
}

const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > vehicleTotalPages.value) return
    vehiclePage.value = newPage
    fetchVehicles()
}

watch(vehicleSearch, () => {
    clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
        vehiclePage.value = 1
        fetchVehicles()
    }, 300)
})

watch(vehicleMakeFilter, () => {
    vehiclePage.value = 1
    fetchVehicles()
})

watch([vehicleSortBy, vehicleSortOrder], () => {
    fetchVehicles()
})

const handleEditProfile = () => {
  isEditModalOpen.value = true
}

const handleCustomerUpdated = async () => {
  await fetchCustomerData()
}

const handleStartServiceOrder = () => {
  router.push(`/dashboard/service-orders/new?customerId=${customerId.value}`)
}


const isAddVehicleModalOpen = ref(false)
const isVehicleDetailsSheetOpen = ref(false)
const isDeleteVehicleModalOpen = ref(false)
const isSavingVehicle = ref(false)
const isDeletingVehicle = ref(false)
const selectedVehicle = ref<any>(null)
const vehicleFormMode = ref<'create' | 'edit'>('create')

const handleAddVehicle = () => {
  selectedVehicle.value = null
  vehicleFormMode.value = 'create'
  isAddVehicleModalOpen.value = true
}

const handleViewVehicle = (vehicle: any) => {
  selectedVehicle.value = vehicle
  isVehicleDetailsSheetOpen.value = true
}

const handleEditVehicle = (vehicle: any) => {
  selectedVehicle.value = vehicle
  vehicleFormMode.value = 'edit'
  isAddVehicleModalOpen.value = true
  isVehicleDetailsSheetOpen.value = false // Close sheet if open
}

const handleDeleteVehicle = (vehicle: any) => {
  selectedVehicle.value = vehicle
  isDeleteVehicleModalOpen.value = true
}

const confirmDeleteVehicle = async () => {
  if (!selectedVehicle.value) return
  
  try {
    isDeletingVehicle.value = true
    await deleteVehicle(selectedVehicle.value.id)
    toast.success('Vehicle deleted successfully')
    await fetchVehicles()
    isDeleteVehicleModalOpen.value = false
    isVehicleDetailsSheetOpen.value = false // Close sheet if open
  } catch (error) {
    console.error('Failed to delete vehicle:', error)
    toast.error('Failed to delete vehicle')
  } finally {
    isDeletingVehicle.value = false
  }
}

const handleVehicleSaved = async (vehicleData: any) => {
  try {
    isSavingVehicle.value = true
    // Ensure customerId is set
    vehicleData.customerId = customerId.value
    
    if (vehicleFormMode.value === 'create') {
      await createVehicle(vehicleData)
      toast.success('Vehicle added successfully')
    } else {
      if (selectedVehicle.value?.id) {
        await updateVehicle(selectedVehicle.value.id, vehicleData)
        toast.success('Vehicle updated successfully')
      }
    }
    
    isAddVehicleModalOpen.value = false
    
    // Refresh data
    if (vehicleFormMode.value === 'create') {
        vehiclePage.value = 1
    }
    await fetchVehicles()
  } catch (error: any) {
    console.error('Failed to save vehicle:', error)
    if (error.response?.status === 409) {
      if (error.response?.data?.error === 'DUPLICATE_LICENSE_PLATE') {
        toast.error('A vehicle with this license plate already exists')
      } else if (error.response?.data?.error === 'DUPLICATE_VIN') {
        toast.error('A vehicle with this VIN already exists')
      } else {
        toast.error('A vehicle with this information already exists')
      }
    } else {
      toast.error(vehicleFormMode.value === 'create' ? 'Failed to add vehicle' : 'Failed to update vehicle')
    }
  } finally {
    isSavingVehicle.value = false
  }
}

const handleViewReceipt = (serviceId: string) => {
  router.push(`/dashboard/service-orders/${serviceId}`)
}

const goBack = () => {
  router.push('/dashboard/customers')
}

onMounted(() => {
  fetchCustomerData()
})

onBeforeUnmount(() => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
    searchTimeout = undefined
  }
})
</script>

<template>
  <div class="container mx-auto p-6 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <Button variant="ghost" size="icon" @click="goBack">
          <ArrowLeft class="h-5 w-5" />
        </Button>
        <div>
          <h1 class="text-3xl font-bold tracking-tight">Customer Details</h1>
          <p class="text-muted-foreground">View and manage customer information</p>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="space-y-4">
      <Card>
        <CardHeader>
          <Skeleton class="h-8 w-64" />
        </CardHeader>
        <CardContent class="space-y-4">
          <Skeleton class="h-20 w-full" />
          <Skeleton class="h-20 w-full" />
          <Skeleton class="h-20 w-full" />
        </CardContent>
      </Card>
    </div>

    <!-- Content -->
    <div v-else-if="customer" class="space-y-6">
      <!-- Customer Header Card -->
      <CustomerHeader
        :customer="customer"
        @edit-profile="handleEditProfile"
        @start-service-order="handleStartServiceOrder"
      />

      <!-- Tabbed Content -->
      <Tabs v-model="activeTab" default-value="general" class="space-y-4">
        <TabsList class="grid w-full grid-cols-3">
          <TabsTrigger value="general">
            <User class="h-4 w-4 mr-2" />
            General Info
          </TabsTrigger>
          <TabsTrigger value="vehicles">
            <Car class="h-4 w-4 mr-2" />
            Vehicles
          </TabsTrigger>
          <TabsTrigger value="history">
            <History class="h-4 w-4 mr-2" />
            Service History
          </TabsTrigger>
        </TabsList>

        <!-- General Info Tab -->
        <TabsContent value="general">
          <CustomerGeneralInfo :customer="customer" />
        </TabsContent>

        <!-- Vehicles Tab -->
        <TabsContent value="vehicles">
          <CustomerVehicles
            :vehicles="vehicles"
            :show-notice="showVehicleNotice"
            :customer-full-name="fullName"
            :current-page="vehiclePage"
            :total-pages="vehicleTotalPages"
            :total-vehicles="vehicleTotal"
            :search="vehicleSearch"
            :filter-make="vehicleMakeFilter"
            :unique-makes="vehicleUniqueMakes"
            :sort-by="vehicleSortBy"
            :sort-order="vehicleSortOrder"
            @update:search="vehicleSearch = $event"
            @update:filter-make="vehicleMakeFilter = $event"
            @update:sort-by="vehicleSortBy = $event"
            @update:sort-order="vehicleSortOrder = $event"
            @add-vehicle="handleAddVehicle"
            @view-vehicle="handleViewVehicle"
            @edit-vehicle="handleEditVehicle"
            @delete-vehicle="handleDeleteVehicle"
            @change-page="handlePageChange"
          />
        </TabsContent>

        <!-- Service History Tab -->
        <TabsContent value="history">
          <CustomerServiceHistory
            :service-history="serviceHistory"
            @start-service-order="handleStartServiceOrder"
            @view-receipt="handleViewReceipt"
          />
        </TabsContent>
      </Tabs>
    </div>

    <!-- Error State -->
    <div v-else class="text-center py-12">
      <p class="text-muted-foreground">Failed to load customer details</p>
      <Button @click="goBack" class="mt-4">Go Back</Button>
    </div>

    <!-- Edit Customer Modal -->
    <EditCustomerModal
      v-model:open="isEditModalOpen"
      :customer="customer"
      @customer-updated="handleCustomerUpdated"
    />

    <!-- Add/Edit Vehicle Modal -->
    <VehicleForm
      v-model:open="isAddVehicleModalOpen"
      :mode="vehicleFormMode"
      :vehicle="selectedVehicle || { customerId: customerId }"
      :loading="isSavingVehicle"
      @save="handleVehicleSaved"
      @cancel="isAddVehicleModalOpen = false"
    />

    <!-- Vehicle Details Sheet -->
    <VehicleDetailsSheet
      v-model:open="isVehicleDetailsSheetOpen"
      :vehicle="selectedVehicle"
      @edit="handleEditVehicle"
      @delete="handleDeleteVehicle"
    />

    <!-- Delete Confirmation Dialog -->
    <Dialog v-model:open="isDeleteVehicleModalOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2 text-destructive">
            <AlertTriangle class="h-5 w-5" />
            Delete Vehicle
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this vehicle? This action cannot be undone and will remove all associated service history.
          </DialogDescription>
        </DialogHeader>
        <div v-if="selectedVehicle" class="py-4">
          <div class="rounded-md bg-muted p-3">
            <div class="font-medium">{{ selectedVehicle.make }} {{ selectedVehicle.model }}</div>
            <div class="text-sm text-muted-foreground">License Plate: {{ selectedVehicle.licensePlate }}</div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="isDeleteVehicleModalOpen = false" :disabled="isDeletingVehicle">
            Cancel
          </Button>
          <Button variant="destructive" @click="confirmDeleteVehicle" :disabled="isDeletingVehicle">
            {{ isDeletingVehicle ? 'Deleting...' : 'Delete Vehicle' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
