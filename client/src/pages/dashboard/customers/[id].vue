<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { getCustomer } from '@/api/customers'
import { getCustomerVehicles } from '@/api/vehicles'
import { getCustomerServiceOrders } from '@/api/serviceOrders'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ArrowLeft, User, Car, History } from 'lucide-vue-next'

// Component imports
import CustomerHeader from '@/components/views/customers/CustomerHeader.vue'
import CustomerGeneralInfo from '@/components/views/customers/CustomerGeneralInfo.vue'
import CustomerVehicles from '@/components/views/customers/CustomerVehicles.vue'
import CustomerServiceHistory from '@/components/views/customers/CustomerServiceHistory.vue'
import EditCustomerModal from '@/components/views/customers/EditCustomerModal.vue'

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
const fetchCustomerData = async () => {
  try {
    isLoading.value = true
    const response = await getCustomer(customerId.value)
    customer.value = response.customer

    // Fetch vehicles
    try {
      const vehiclesResponse = await getCustomerVehicles(customerId.value)
      vehicles.value = vehiclesResponse.vehicles || []
    } catch (error) {
      console.warn('Failed to fetch vehicles:', error)
      vehicles.value = []
    }

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

const handleEditProfile = () => {
  isEditModalOpen.value = true
}

const handleCustomerUpdated = async () => {
  await fetchCustomerData()
}

const handleStartServiceOrder = () => {
  router.push(`/dashboard/service-orders/new?customerId=${customerId.value}`)
}

const handleAddVehicle = () => {
  router.push(`/dashboard/customers/${customerId.value}/vehicles/new`)
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
            @add-vehicle="handleAddVehicle"
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
  </div>
</template>
