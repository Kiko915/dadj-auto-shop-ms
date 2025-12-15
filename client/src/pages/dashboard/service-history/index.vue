<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { Search, RefreshCw, Calendar, History, User } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { getServiceOrders } from '@/api/serviceOrders'
import { getMechanics } from '@/api/users'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import DatePicker from '@/components/ui/date-picker/DatePicker.vue'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ServiceOrder } from '@/pages/dashboard/service-orders/types'
import ServiceHistoryList from './components/ServiceHistoryList.vue'
import ServiceOrderModal from '@/pages/dashboard/service-orders/components/ServiceOrderModal.vue'

// State
const loading = ref(true)
const search = ref('')
const mechanicFilter = ref('ALL')
const startDate = ref<Date | null>(null)
const endDate = ref<Date | null>(null)
const currentPage = ref(1)
const totalPages = ref(1)
const totalItems = ref(0)
const rawOrders = ref<ServiceOrder[]>([])
const mechanics = ref<any[]>([])

// Modal State
const selectedOrderId = ref<string | null>(null)
const isModalOpen = ref(false)

const handleSelectOrder = (id: string) => {
    selectedOrderId.value = id
    isModalOpen.value = true
}

// Fetch Data
const fetchData = async () => {
  loading.value = true
  try {
    const params: any = {
      page: currentPage.value,
      limit: 10, 
      search: search.value,
      status: 'COMPLETED,CANCELLED', // Hardcoded for history
      sortBy: 'updatedAt',
      sortOrder: 'desc'
    }

    if (mechanicFilter.value !== 'ALL') {
        params.mechanic = mechanicFilter.value
    }

    if (startDate.value) {
        params.startDate = startDate.value.toISOString()
    }

    if (endDate.value) {
        params.endDate = endDate.value.toISOString()
    }
    
    const data = await getServiceOrders(params)
    if (data && data.items) {
        rawOrders.value = data.items
        totalPages.value = data.totalPages
        currentPage.value = data.currentPage
        totalItems.value = data.totalItems
    }
    
  } catch (error: any) {
    console.error('Failed to fetch history:', error)
    toast.error('Error', {
      description: 'Failed to load service history.'
    })
  } finally {
    loading.value = false
  }
}

const fetchMechanicsList = async () => {
    try {
        const data = await getMechanics()
        mechanics.value = data
    } catch (error) {
        console.error('Failed to fetch mechanics:', error)
    }
}

const handlePageChange = (page: number) => {
    currentPage.value = page
    fetchData()
}



// Watch filters to trigger fetch
watch([mechanicFilter, startDate, endDate], () => {
    currentPage.value = 1
    fetchData()
})

// Debounce search
let searchTimeout: ReturnType<typeof setTimeout> | undefined
watch(search, () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(fetchData, 500)
})

onUnmounted(() => {
  if (searchTimeout) clearTimeout(searchTimeout)
})

// Initial load
onMounted(() => {
    fetchData()
    fetchMechanicsList()
})
</script>

<template>
  <div class="h-[calc(100vh-6rem)] flex flex-col space-y-4">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
      <div>
        <h1 class="text-3xl font-bold tracking-tight flex items-center gap-2">
            Service History
        </h1>
        <p class="text-muted-foreground">Archive of all completed and cancelled service orders.</p>
      </div>
      <div class="flex items-center gap-2">
         <Button variant="outline" size="icon" @click="fetchData()" :disabled="loading">
            <RefreshCw class="h-4 w-4" :class="{'animate-spin': loading}" />
         </Button>
      </div>
    </div>

    <!-- Controls -->
    <div class="flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between shrink-0">
      <div class="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full overflow-x-auto pb-1 sm:pb-0">
        
        <div class="relative w-full sm:w-64 shrink-0">
          <Search class="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            v-model="search" 
            placeholder="Search history..." 
            class="pl-8"
          />
        </div>
        
        <!-- Filters -->
         <div class="flex flex-wrap items-center gap-2">
            
            <!-- Mechanic Filter -->
             <Select v-model="mechanicFilter">
                <SelectTrigger class="h-9 border-dashed rounded-md px-3 text-xs sm:text-sm gap-2 min-w-[150px]">
                    <User class="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="All Mechanics" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="ALL">All Mechanics</SelectItem>
                    <SelectItem 
                        v-for="mech in mechanics" 
                        :key="mech.id" 
                        :value="mech.name"
                    >
                        {{ mech.name }}
                    </SelectItem>
                </SelectContent>
            </Select>

            <!-- Date Range Pickers -->
            <div class="flex items-center gap-2 border rounded-md p-1 border-dashed">
                <DatePicker 
                    v-model="startDate" 
                    placeholder="From Date"
                    date-style="medium"
                    class="w-[130px] h-8 border-none shadow-none focus-visible:ring-0" 
                />
                <span class="text-muted-foreground px-1">-</span>
                <DatePicker 
                    v-model="endDate" 
                    placeholder="To Date" 
                    date-style="medium"
                    class="w-[130px] h-8 border-none shadow-none focus-visible:ring-0"
                />
            </div>


         </div>

      </div>
    </div>

    <!-- Views -->
    <ServiceHistoryList 
        :orders="rawOrders"
        :loading="loading"
        :current-page="currentPage"
        :total-pages="totalPages"
        @page-change="handlePageChange"
        @select-order="handleSelectOrder"
    />

    <!-- Reusing Service Order Modal for Details -->
    <ServiceOrderModal 
        v-if="selectedOrderId"
        v-model:open="isModalOpen" 
        :order-id="selectedOrderId" 
        @order-updated="fetchData()"
        readonly 
    />
  </div>
</template>
