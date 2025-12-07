<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { 
  Car, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Users, 
  Calendar,
  AlertCircle,
  Eye,
  ChevronLeft,
  ChevronRight
} from 'lucide-vue-next'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getAllVehicles } from '@/api/vehicles'
import VehicleDetailsSheet from '@/components/views/vehicles/VehicleDetailsSheet.vue'



const router = useRouter()
const vehicles = ref([])
const loading = ref(true)
const searchQuery = ref('')
const debouncedSearchQuery = ref('')
const filterMake = ref('All')
const selectedVehicle = ref(null)
const isDetailsSheetOpen = ref(false)
let debounceTimeout = null

// Pagination State
const currentPage = ref(1)
const pageSize = ref(10)
const totalVehicles = ref(0)
const totalPages = ref(1)

// Watch search query for debounce
watch(searchQuery, (newValue) => {
  if (debounceTimeout) clearTimeout(debounceTimeout)
  debounceTimeout = setTimeout(() => {
    debouncedSearchQuery.value = newValue
    currentPage.value = 1 // Reset to first page on search
    fetchVehicles()
  }, 300)
})

// Watch filterMake to trigger fetch
watch(filterMake, () => {
  currentPage.value = 1
  fetchVehicles()
})

// Computed Stats (Note: These will now only reflect the CURRENT PAGE. 
// For accurate global stats, we'd need a separate stats endpoint.)
const stats = computed(() => {
  // Use metadata total for the count if available, otherwise array length
  const total = totalVehicles.value || vehicles.value.length
  
  // These specific stats for "New This Month" and "Active Owners" are strictly
  // limited to the fetched page in this implementation. 
  // Ideally, these numbers should come from a dedicated dashboard stats API.
  // We'll leave them as is, acting on the current view for now.
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  
  const newThisMonth = vehicles.value.filter(v => {
    const date = new Date(v.dateRegistered)
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear
  }).length

  const uniqueOwners = new Set(vehicles.value.map(v => v.customerId)).size

  return [
    {
      title: 'Total Vehicles',
      value: total,
      icon: Car,
      description: 'Registered in system',
      trend: 'global count', // Context update
      cssClasses: {
        bg: 'bg-gradient-to-br from-blue-50 to-white border-blue-100',
        title: 'text-blue-900',
        iconBg: 'bg-blue-100/50',
        icon: 'text-blue-600',
        value: 'text-blue-700',
        description: 'text-blue-600/80'
      }
    },
    // ... keep other stats logic or accept it's partial
     {
      title: 'New This Month',
      value: newThisMonth, // This will be inaccurate with pagination
      icon: Calendar,
      description: 'In current view', // Updated description
      trend: 'Visualized only',
      cssClasses: {
        bg: 'bg-gradient-to-br from-green-50 to-white border-green-100',
        title: 'text-green-900',
        iconBg: 'bg-green-100/50',
        icon: 'text-green-600',
        value: 'text-green-700',
        description: 'text-green-600/80'
      }
    },
    {
      title: 'Active Owners',
      value: uniqueOwners, // This will be inaccurate with pagination
      icon: Users,
      description: 'In current view', // Updated description
      trend: 'Visualized only',
      cssClasses: {
        bg: 'bg-gradient-to-br from-indigo-50 to-white border-indigo-100',
        title: 'text-indigo-900',
        iconBg: 'bg-indigo-100/50',
        icon: 'text-indigo-600',
        value: 'text-indigo-700',
        description: 'text-indigo-600/80'
      }
    }
  ]
})

const uniqueMakes = ref(['All'])

const fetchVehicles = async () => {
  try {
    loading.value = true
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      search: debouncedSearchQuery.value,
      make: filterMake.value
    }
    
    const response = await getAllVehicles(params)
    vehicles.value = response.vehicles
    
    // Update pagination meta
    if (response.meta) {
      totalVehicles.value = response.meta.total
      totalPages.value = response.meta.totalPages
      currentPage.value = response.meta.page
      if (response.meta.uniqueMakes) {
        uniqueMakes.value = response.meta.uniqueMakes
      }
    }
  } catch (error) {
    console.error('Failed to fetch vehicles:', error)
  } finally {
    loading.value = false
  }
}

const changePage = (newPage) => {
  if (newPage < 1 || newPage > totalPages.value) return
  currentPage.value = newPage
  fetchVehicles()
}

const navigateToCustomer = (customerId) => {
  router.push(`/dashboard/customers/${customerId}`)
}

const openDetails = (vehicle) => {
  selectedVehicle.value = vehicle
  isDetailsSheetOpen.value = true
}

onMounted(() => {
  fetchVehicles()
})

onBeforeUnmount(() => {
  if (debounceTimeout) clearTimeout(debounceTimeout)
  debounceTimeout = null
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-3xl font-bold tracking-tight">Vehicles</h2>
        <p class="text-muted-foreground">
          Manage and track all vehicles in the service center.
        </p>
      </div>
    </div>

    <!-- Stat Cards -->
    <div class="grid gap-4 md:grid-cols-3">
      <Card 
        v-for="stat in stats" 
        :key="stat.title"
        :class="['relative overflow-hidden transition-all hover:shadow-md border', stat.cssClasses.bg]"
      >
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle :class="['text-sm font-medium', stat.cssClasses.title]">
            {{ stat.title }}
          </CardTitle>
          <div :class="['p-2 rounded-lg', stat.cssClasses.iconBg]">
            <component :is="stat.icon" :class="['h-4 w-4', stat.cssClasses.icon]" />
          </div>
        </CardHeader>
        <CardContent>
          <div :class="['text-2xl font-bold', stat.cssClasses.value]">{{ stat.value }}</div>
          <p :class="['text-xs', stat.cssClasses.description]">
            {{ stat.description }}
          </p>
        </CardContent>
      </Card>
    </div>

    <!-- Vehicles Table -->
    <Card>
      <CardHeader>
        <CardTitle>All Vehicles</CardTitle>
        <CardDescription>
          A list of all vehicles including their owner, make, model, and registration details.
        </CardDescription>
        <div class="flex items-center py-4">
          <div class="relative w-full max-w-sm">
            <Search class="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search vehicles..."
              v-model="searchQuery"
              class="pl-8"
            />
          </div>
          <div class="ml-auto flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button variant="outline" size="sm" class="h-8 border-dashed">
                  <Filter class="mr-2 h-4 w-4" />
                  Filter Make
                  <span v-if="filterMake !== 'All'" class="ml-2 rounded-sm bg-primary px-1 font-normal text-primary-foreground">
                    {{ filterMake }}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" class="w-[200px]">
                <DropdownMenuLabel>Filter by Make</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  v-for="make in uniqueMakes"
                  :key="make"
                  :checked="filterMake === make"
                  @click="filterMake = make"
                >
                  {{ make }}
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vehicle</TableHead>
              <TableHead>Make & Model</TableHead>
              <TableHead>Year</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Mileage</TableHead>
              <TableHead>Reg. Date</TableHead>
              <TableHead class="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-if="loading">
              <TableCell colspan="7" class="h-24 text-center">
                Loading vehicles...
              </TableCell>
            </TableRow>
            <TableRow v-else-if="vehicles.length === 0">
              <TableCell colspan="7" class="h-64 text-center">
                <div class="flex flex-col items-center justify-center space-y-3">
                  <div class="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    <Search class="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div class="space-y-1">
                    <h3 class="font-semibold text-lg">No vehicles found</h3>
                    <p class="text-sm text-muted-foreground max-w-xs mx-auto">
                      We couldn't find any vehicles details matching your search filters.
                    </p>
                  </div>
                  <Button 
                    v-if="searchQuery || filterMake !== 'All'"
                    variant="link" 
                    @click="() => { searchQuery = ''; filterMake = 'All' }"
                    class="text-primary mt-2"
                  >
                    Clear all filters
                  </Button>
                </div>
              </TableCell>
            </TableRow>
            <TableRow v-for="vehicle in vehicles" :key="vehicle.id">
              <TableCell class="font-medium">
                <div class="flex items-center gap-3">
                    <div class="relative h-10 w-10 rounded-md overflow-hidden bg-muted flex items-center justify-center border border-border">
                        <img 
                          v-if="vehicle.imageUrl" 
                          :src="vehicle.imageUrl" 
                          :alt="vehicle.licensePlate"
                          class="h-full w-full object-cover"
                        />
                        <Car v-else class="h-5 w-5 text-muted-foreground/50" />
                    </div>
                    <span class="font-mono text-sm">{{ vehicle.licensePlate }}</span>
                </div>
              </TableCell>
              <TableCell>
                <div class="flex flex-col">
                    <span class="font-medium">{{ vehicle.make }} {{ vehicle.model }}</span>
                    <span class="text-xs text-muted-foreground">{{ vehicle.vehicleType || 'N/A' }}</span>
                </div>
              </TableCell>
              <TableCell>{{ vehicle.year || 'N/A' }}</TableCell>
              <TableCell>
                <div 
                    class="flex flex-col cursor-pointer hover:underline"
                    @click="navigateToCustomer(vehicle.customerId)"
                >
                    <span class="font-medium">{{ vehicle.customer?.firstName }} {{ vehicle.customer?.lastName }}</span>
                    <span class="text-xs text-muted-foreground">{{ vehicle.customer?.phoneNumber }}</span>
                </div>
              </TableCell>
              <TableCell>{{ vehicle.mileage ? vehicle.mileage.toLocaleString() + ' km' : 'N/A' }}</TableCell>
              <TableCell>{{ new Date(vehicle.dateRegistered).toLocaleDateString() }}</TableCell>
              <TableCell class="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <Button variant="ghost" class="h-8 w-8 p-0">
                      <span class="sr-only">Open menu</span>
                      <MoreHorizontal class="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem @click="openDetails(vehicle)">
                      <Eye class="mr-2 h-4 w-4" /> View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem @click="navigateToCustomer(vehicle.customerId)">
                      <Users class="mr-2 h-4 w-4" /> View Owner
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>View Service History</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <!-- Pagination Footer -->
        <div class="flex items-center justify-between space-x-2 py-4 border-t mt-4">
          <div class="text-sm text-muted-foreground">
            Page {{ currentPage }} of {{ totalPages }} ({{ totalVehicles }} vehicles)
          </div>
          <div class="space-x-2">
            <Button
              variant="outline"
              size="sm"
              :disabled="currentPage === 1 || loading"
              @click="changePage(currentPage - 1)"
            >
              <ChevronLeft class="h-4 w-4 mr-2" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              :disabled="currentPage === totalPages || loading"
              @click="changePage(currentPage + 1)"
            >
              Next
              <ChevronRight class="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Details Sheet -->
    <VehicleDetailsSheet 
      v-model:open="isDetailsSheetOpen"
      :vehicle="selectedVehicle"
      :readonly="true"
      @edit="(v) => console.log('Edit', v)"
      @delete="(v) => console.log('Delete', v)"
    />
  </div>
</template>
