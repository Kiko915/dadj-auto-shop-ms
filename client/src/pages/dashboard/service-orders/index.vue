<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Plus, LayoutGrid, List, User, CircleDashed, Calendar, RefreshCw } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { getServiceOrders } from '@/api/serviceOrders'
import { getMechanics } from '@/api/users'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ServiceOrder } from './types'
import ServiceOrderBoard from './components/ServiceOrderBoard.vue'
import ServiceOrderList from './components/ServiceOrderList.vue'
import ServiceOrderModal from './components/ServiceOrderModal.vue'

const router = useRouter()

// State
const loading = ref(true)
const search = ref('')
const mechanicFilter = ref('ALL') 
const statusFilter = ref('ALL')
const dateFilter = ref('ALL')
const currentPage = ref(1)
const totalPages = ref(1)
const totalItems = ref(0)
const viewMode = ref<'BOARD' | 'LIST'>('BOARD')
const rawOrders = ref<ServiceOrder[]>([])
const availableMechanics = ref<any[]>([])

// Modal State
const selectedOrderId = ref<string | null>(null)
const isModalOpen = ref(false)

const handleSelectOrder = (id: string) => {
    selectedOrderId.value = id
    isModalOpen.value = true
}

// Fetch Data
const fetchData = async (append = false) => {
  loading.value = true
  try {
    // Determine limit based on view mode
    // Board view needs more items for drag-and-drop context
    // List view uses standard pagination
    const limit = viewMode.value === 'BOARD' ? 50 : 10

    const params: any = {
      page: currentPage.value,
      limit, 
      search: search.value,
      status: statusFilter.value,
      mechanic: mechanicFilter.value,
      dateFilter: dateFilter.value
    }
    
    const data = await getServiceOrders(params)
    if (data && data.items) {
        if (append) {
            rawOrders.value = [...rawOrders.value, ...data.items]
        } else {
            rawOrders.value = data.items
        }
        totalPages.value = data.totalPages
        // Keep current page if appending, otherwise set from response
        if (!append) currentPage.value = data.currentPage
        totalItems.value = data.totalItems
    }
    
  } catch (error: any) {
    console.error('Failed to fetch data:', error)
    toast.error('Error', {
      description: 'Failed to load service orders.'
    })
  } finally {
    loading.value = false
  }
}

// Watchers
watch(viewMode, () => {
    currentPage.value = 1
    fetchData()
})

const handlePageChange = (page: number) => {
    currentPage.value = page
    fetchData()
}

const handleLoadMore = () => {
    currentPage.value++
    fetchData(true)
}

// Watch filters to trigger fetch
watch([mechanicFilter, statusFilter, dateFilter], () => {
    currentPage.value = 1
    fetchData()
})

// Filtered Orders Computed Property
// Since filtering is now server-side, this just returns the fetched orders
const filteredOrders = computed(() => {
    return rawOrders.value
})

const fetchMechanics = async () => {
    try {
        const res = await getMechanics()
        availableMechanics.value = res
    } catch (error) {
        console.error('Failed to load mechanics', error)
    }
}

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
    fetchMechanics()
})
</script>

<template>
  <div class="h-[calc(100vh-6rem)] flex flex-col space-y-3">
    <!-- Header -->
    <div class="flex items-center justify-between gap-2 shrink-0">
      <div class="min-w-0">
        <h1 class="text-xl sm:text-3xl font-bold tracking-tight truncate">Service Orders</h1>
        <p class="text-muted-foreground text-xs sm:text-sm hidden sm:block">Manage active jobs and service workflow.</p>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <Button variant="outline" size="icon" @click="fetchData()" :disabled="loading">
          <RefreshCw class="h-4 w-4" :class="{'animate-spin': loading}" />
        </Button>
        <Button @click="router.push({ name: 'new-service-order' })">
          <Plus class="h-4 w-4 sm:mr-2" />
          <span class="hidden sm:inline">Create Direct Order</span>
        </Button>
      </div>
    </div>

    <!-- Controls -->
    <div class="flex flex-col gap-2 shrink-0">
      <!-- Row 1: view toggle + search -->
      <div class="flex items-center gap-2">
        <!-- View Toggle -->
        <div class="flex items-center rounded-lg border bg-muted p-1 h-9 shrink-0">
          <button
            @click="viewMode = 'BOARD'"
            class="flex items-center gap-1.5 px-3 py-1 text-sm font-medium rounded-md transition-all"
            :class="viewMode === 'BOARD' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:bg-background/50'"
          >
            <LayoutGrid class="h-4 w-4" />
            <span class="hidden sm:inline">Board</span>
          </button>
          <button
            @click="viewMode = 'LIST'"
            class="flex items-center gap-1.5 px-3 py-1 text-sm font-medium rounded-md transition-all"
            :class="viewMode === 'LIST' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:bg-background/50'"
          >
            <List class="h-4 w-4" />
            <span class="hidden sm:inline">List</span>
          </button>
        </div>

        <div class="relative flex-1">
          <Search class="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input v-model="search" placeholder="Search vehicle or customer..." class="pl-8 w-full" />
        </div>
      </div>

      <!-- Row 2: filters -->
      <div class="flex items-center gap-2 overflow-x-auto pb-1">
        <Select v-model="statusFilter">
          <SelectTrigger class="h-8 border-dashed rounded-md px-2.5 text-xs gap-1.5 shrink-0 min-w-[110px]">
            <CircleDashed class="h-3.5 w-3.5 text-muted-foreground" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Select v-model="mechanicFilter">
          <SelectTrigger class="h-8 border-dashed rounded-md px-2.5 text-xs gap-1.5 shrink-0 min-w-[120px]">
            <User class="h-3.5 w-3.5 text-muted-foreground" />
            <SelectValue placeholder="Mechanic" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Mechanics</SelectItem>
            <SelectItem value="Unassigned">Unassigned</SelectItem>
            <template v-for="mech in availableMechanics" :key="mech.id">
              <SelectItem :value="mech.name">{{ mech.name }}</SelectItem>
            </template>
          </SelectContent>
        </Select>

        <Select v-model="dateFilter">
          <SelectTrigger class="h-8 border-dashed rounded-md px-2.5 text-xs gap-1.5 shrink-0 min-w-[110px]">
            <Calendar class="h-3.5 w-3.5 text-muted-foreground" />
            <SelectValue placeholder="Due Date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Any Date</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="today">Due Today</SelectItem>
            <SelectItem value="week">Due This Week</SelectItem>
          </SelectContent>
        </Select>

        <Button
          v-if="mechanicFilter !== 'ALL' || statusFilter !== 'ALL' || dateFilter !== 'ALL'"
          variant="ghost" size="sm"
          class="h-8 px-2 text-xs text-muted-foreground hover:text-foreground shrink-0"
          @click="mechanicFilter = 'ALL'; statusFilter = 'ALL'; dateFilter = 'ALL'"
        >
          Reset
        </Button>
      </div>
    </div>

    <!-- Views -->
    <ServiceOrderBoard 
        v-if="viewMode === 'BOARD'" 
        :orders="filteredOrders"
        :total-items="totalItems"
        @refresh="fetchData()"
        @load-more="handleLoadMore"
        @select-order="handleSelectOrder"
    />
    
    <ServiceOrderList 
        v-else 
        :orders="filteredOrders"
        :loading="loading"
        :current-page="currentPage"
        :total-pages="totalPages"
        @page-change="handlePageChange"
        @select-order="handleSelectOrder"
    />

    <ServiceOrderModal 
        v-if="selectedOrderId"
        v-model:open="isModalOpen" 
        :order-id="selectedOrderId" 
        @order-updated="fetchData()"
    />

  </div>
</template>
