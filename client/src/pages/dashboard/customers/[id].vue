<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { getCustomer } from '@/api/customers'
import { getCustomerVehicles } from '@/api/vehicles'
import { getCustomerServiceOrders } from '@/api/serviceOrders'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  User,
  Phone,
  Mail,
  Car,
  History,
  Edit,
  Plus,
  Receipt,
  ArrowLeft,
  DollarSign,
  Package,
} from 'lucide-vue-next'

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

const initials = computed(() => {
  if (!customer.value) return 'U'
  return `${customer.value.firstName[0]}${customer.value.lastName[0]}`.toUpperCase()
})

const loyaltyColor = computed(() => {
  if (!customer.value) return 'gray'
  switch (customer.value.loyaltyStatus) {
    case 'VIP':
      return 'purple'
    case 'Loyal':
      return 'amber'
    default:
      return 'gray'
  }
})

const formattedTotalSpent = computed(() => {
  if (!customer.value) return '₱0.00'
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(customer.value.totalSpent)
})

const formattedBirthday = computed(() => {
  if (!customer.value?.birthday) return null
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(customer.value.birthday))
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
  } catch (error: any) {
    console.error('Error fetching customer:', error)
    toast.error('Failed to load customer details')
    router.push('/dashboard/customers')
  } finally {
    isLoading.value = false
  }
}

const handleEditProfile = () => {
  router.push(`/dashboard/customers/${customerId.value}/edit`)
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

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(amount)
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
      <Card>
        <CardContent class="pt-6">
          <div class="flex items-start gap-6">
            <Avatar class="h-24 w-24">
              <AvatarImage :src="customer.profilePicture || ''" :alt="fullName" />
              <AvatarFallback class="text-2xl">{{ initials }}</AvatarFallback>
            </Avatar>
            <div class="flex-1 space-y-2">
              <div class="flex items-center gap-3">
                <h2 class="text-2xl font-bold">{{ fullName }}</h2>
                <Badge :variant="loyaltyColor === 'purple' ? 'default' : 'secondary'" :class="{
                  'bg-purple-100 text-purple-800': loyaltyColor === 'purple',
                  'bg-amber-100 text-amber-800': loyaltyColor === 'amber',
                }">
                  {{ customer.loyaltyStatus }}
                </Badge>
              </div>
              <div class="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div class="flex items-center gap-2">
                  <Phone class="h-4 w-4" />
                  <span>{{ customer.phoneNumber }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <Mail class="h-4 w-4" />
                  <span>{{ customer.email }}</span>
                </div>
              </div>
              <div class="flex gap-4 pt-2">
                <div class="flex items-center gap-2 text-sm">
                  <Car class="h-4 w-4 text-muted-foreground" />
                  <span class="font-semibold">{{ customer.totalVehicles }}</span>
                  <span class="text-muted-foreground">Vehicles</span>
                </div>
                <div class="flex items-center gap-2 text-sm">
                  <History class="h-4 w-4 text-muted-foreground" />
                  <span class="font-semibold">{{ customer.serviceCount }}</span>
                  <span class="text-muted-foreground">Services</span>
                </div>
                <div class="flex items-center gap-2 text-sm">
                  <DollarSign class="h-4 w-4 text-muted-foreground" />
                  <span class="font-semibold">{{ formattedTotalSpent }}</span>
                  <span class="text-muted-foreground">Total Spent</span>
                </div>
              </div>
            </div>
            <div class="flex gap-2">
              <Button variant="outline" @click="handleEditProfile">
                <Edit class="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
              <Button @click="handleStartServiceOrder">
                <Plus class="h-4 w-4 mr-2" />
                New Service Order
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

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
        <TabsContent value="general" class="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
              <CardDescription>Detailed customer profile and metrics</CardDescription>
            </CardHeader>
            <CardContent class="space-y-6">
              <!-- Personal Details -->
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1">
                  <p class="text-sm font-medium text-muted-foreground">First Name</p>
                  <p class="text-base">{{ customer.firstName }}</p>
                </div>
                <div class="space-y-1">
                  <p class="text-sm font-medium text-muted-foreground">Last Name</p>
                  <p class="text-base">{{ customer.lastName }}</p>
                </div>
                <div v-if="customer.middleName" class="space-y-1">
                  <p class="text-sm font-medium text-muted-foreground">Middle Name</p>
                  <p class="text-base">{{ customer.middleName }}</p>
                </div>
                <div v-if="customer.suffix" class="space-y-1">
                  <p class="text-sm font-medium text-muted-foreground">Suffix</p>
                  <p class="text-base">{{ customer.suffix }}</p>
                </div>
                <div v-if="formattedBirthday" class="space-y-1">
                  <p class="text-sm font-medium text-muted-foreground">Birthday</p>
                  <p class="text-base">{{ formattedBirthday }}</p>
                </div>
              </div>

              <Separator />

              <!-- Contact Information -->
              <div class="space-y-4">
                <h3 class="text-lg font-semibold">Contact Information</h3>
                <div class="grid grid-cols-2 gap-4">
                  <div class="space-y-1">
                    <p class="text-sm font-medium text-muted-foreground">Phone Number</p>
                    <p class="text-base">{{ customer.phoneNumber }}</p>
                  </div>
                  <div class="space-y-1">
                    <p class="text-sm font-medium text-muted-foreground">Email Address</p>
                    <p class="text-base">{{ customer.email }}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <!-- Metrics -->
              <div class="space-y-4">
                <h3 class="text-lg font-semibold">Customer Metrics</h3>
                <div class="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent class="pt-6">
                      <div class="flex flex-col items-center space-y-2">
                        <Car class="h-8 w-8 text-blue-500" />
                        <p class="text-3xl font-bold">{{ customer.totalVehicles }}</p>
                        <p class="text-sm text-muted-foreground">Registered Vehicles</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent class="pt-6">
                      <div class="flex flex-col items-center space-y-2">
                        <Package class="h-8 w-8 text-green-500" />
                        <p class="text-3xl font-bold">{{ customer.serviceCount }}</p>
                        <p class="text-sm text-muted-foreground">Service Count</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent class="pt-6">
                      <div class="flex flex-col items-center space-y-2">
                        <DollarSign class="h-8 w-8 text-amber-500" />
                        <p class="text-3xl font-bold">{{ formattedTotalSpent }}</p>
                        <p class="text-sm text-muted-foreground">Total Spent</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <Separator v-if="customer.notes" />

              <!-- Notes -->
              <div v-if="customer.notes" class="space-y-2">
                <h3 class="text-lg font-semibold">Notes</h3>
                <p class="text-sm text-muted-foreground">{{ customer.notes }}</p>
              </div>

              <Separator />

              <!-- Timestamps -->
              <div class="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div class="space-y-1">
                  <p class="font-medium">Customer Since</p>
                  <p>{{ formatDate(customer.dateCreated) }}</p>
                </div>
                <div class="space-y-1">
                  <p class="font-medium">Last Modified</p>
                  <p>{{ formatDate(customer.lastModified) }}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <!-- Vehicles Tab -->
        <TabsContent value="vehicles" class="space-y-4">
          <Card>
            <CardHeader>
              <div class="flex items-center justify-between">
                <div>
                  <CardTitle>Registered Vehicles</CardTitle>
                  <CardDescription>Manage customer's vehicles</CardDescription>
                </div>
                <Button @click="handleAddVehicle">
                  <Plus class="h-4 w-4 mr-2" />
                  Add New Vehicle
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div v-if="vehicles.length === 0" class="text-center py-12">
                <Car class="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 class="text-lg font-semibold mb-2">No Vehicles Registered</h3>
                <p class="text-muted-foreground mb-4">
                  This customer hasn't registered any vehicles yet.
                </p>
                <Button @click="handleAddVehicle">
                  <Plus class="h-4 w-4 mr-2" />
                  Add First Vehicle
                </Button>
              </div>

              <!-- Vehicles Table -->
              <div v-else class="rounded-md border">
                <table class="w-full">
                  <thead class="bg-muted/50">
                    <tr class="border-b">
                      <th class="px-4 py-3 text-left text-sm font-medium">License Plate</th>
                      <th class="px-4 py-3 text-left text-sm font-medium">Make & Model</th>
                      <th class="px-4 py-3 text-left text-sm font-medium">Year</th>
                      <th class="px-4 py-3 text-left text-sm font-medium">Type</th>
                      <th class="px-4 py-3 text-left text-sm font-medium">Mileage</th>
                      <th class="px-4 py-3 text-right text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="vehicle in vehicles" :key="vehicle.id" class="border-b hover:bg-muted/50">
                      <td class="px-4 py-3 font-medium">{{ vehicle.licensePlate }}</td>
                      <td class="px-4 py-3">{{ vehicle.make }} {{ vehicle.model }}</td>
                      <td class="px-4 py-3">{{ vehicle.year || 'N/A' }}</td>
                      <td class="px-4 py-3">{{ vehicle.vehicleType || 'N/A' }}</td>
                      <td class="px-4 py-3">{{ vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : 'N/A' }}</td>
                      <td class="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm">View Details</Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <!-- Service History Tab -->
        <TabsContent value="history" class="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>Complete service order history for this customer</CardDescription>
            </CardHeader>
            <CardContent>
              <div v-if="serviceHistory.length === 0" class="text-center py-12">
                <History class="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 class="text-lg font-semibold mb-2">No Service History</h3>
                <p class="text-muted-foreground mb-4">
                  This customer hasn't had any services yet.
                </p>
                <Button @click="handleStartServiceOrder">
                  <Plus class="h-4 w-4 mr-2" />
                  Create First Service Order
                </Button>
              </div>

              <!-- Service History Table -->
              <div v-else class="rounded-md border">
                <table class="w-full">
                  <thead class="bg-muted/50">
                    <tr class="border-b">
                      <th class="px-4 py-3 text-left text-sm font-medium">Date</th>
                      <th class="px-4 py-3 text-left text-sm font-medium">Vehicle</th>
                      <th class="px-4 py-3 text-left text-sm font-medium">Total Amount</th>
                      <th class="px-4 py-3 text-left text-sm font-medium">Payment Status</th>
                      <th class="px-4 py-3 text-right text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="service in serviceHistory" :key="service.id" class="border-b hover:bg-muted/50">
                      <td class="px-4 py-3">{{ formatDate(service.date) }}</td>
                      <td class="px-4 py-3">{{ service.vehicleName }}</td>
                      <td class="px-4 py-3 font-medium">{{ formatCurrency(service.totalAmount) }}</td>
                      <td class="px-4 py-3">
                        <Badge :variant="service.paymentStatus === 'Paid' ? 'default' : service.paymentStatus === 'Outstanding' ? 'destructive' : 'secondary'">
                          {{ service.paymentStatus }}
                        </Badge>
                      </td>
                      <td class="px-4 py-3 text-right">
                        <Button variant="outline" size="sm" @click="handleViewReceipt(service.id)">
                          <Receipt class="h-4 w-4 mr-2" />
                          View Receipt
                        </Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>

    <!-- Error State -->
    <div v-else class="text-center py-12">
      <p class="text-muted-foreground">Failed to load customer details</p>
      <Button @click="goBack" class="mt-4">Go Back</Button>
    </div>
  </div>
</template>
