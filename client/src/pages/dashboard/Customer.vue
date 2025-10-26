<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { Search, Star, Plus, ChevronLeft, ChevronRight, Users, TrendingUp, Car } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useCustomersStore } from '@/stores/customers'

type Customer = {
  id: string
  name: string
  phoneNumber: string
  emailAddress: string
  loyaltyStatus: 'Loyal' | 'Regular'
  totalVehicles: number
}

const router = useRouter()
const customersStore = useCustomersStore()
const { customers } = storeToRefs(customersStore)

const searchQuery = ref('')
const debouncedSearchQuery = ref('')
const sortOrder = ref<'asc' | 'desc'>('asc')
const currentPage = ref(1)
const itemsPerPage = ref(10)
const isLoading = ref(true)

// Debounce search input
let debounceTimeout: ReturnType<typeof setTimeout>
watch(searchQuery, (newValue) => {
  clearTimeout(debounceTimeout)
  debounceTimeout = setTimeout(() => {
    debouncedSearchQuery.value = newValue
    currentPage.value = 1 // Reset to first page on search
  }, 300)
})

// Reset pagination when sort order changes
watch(sortOrder, () => {
  currentPage.value = 1
})

// Reset pagination when items per page changes
watch(itemsPerPage, () => {
  currentPage.value = 1
})

// Simulate loading on mount
onMounted(() => {
  setTimeout(() => {
    isLoading.value = false
  }, 500)
})

const filteredCustomers = computed(() => {
  const query = debouncedSearchQuery.value.trim().toLowerCase()

  const filtered = customers.value.filter((customer) => {
    if (!query) return true
    const haystack = [
      customer.id,
      customer.name,
      customer.phoneNumber,
      customer.emailAddress,
      customer.loyaltyStatus,
      String(customer.totalVehicles)
    ]
      .join(' ')
      .toLowerCase()

    return haystack.includes(query)
  })

  return [...filtered].sort((a, b) => {
    const comparison = a.name.localeCompare(b.name)
    return sortOrder.value === 'asc' ? comparison : -comparison
  })
})

// Quick stats computed properties
const totalCustomers = computed(() => customers.value.length)
const loyalCustomers = computed(() => 
  customers.value.filter(c => c.loyaltyStatus === 'Loyal').length
)
const totalVehicles = computed(() => 
  customers.value.reduce((sum, c) => sum + c.totalVehicles, 0)
)

const totalPages = computed(() => Math.ceil(filteredCustomers.value.length / itemsPerPage.value))

const paginatedCustomers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredCustomers.value.slice(start, end)
})

// Smart pagination with ellipsis
const paginationRange = computed(() => {
  const pages: (number | string)[] = []
  const total = totalPages.value
  const current = currentPage.value

  if (total <= 7) {
    // Show all pages if 7 or fewer
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    // Always show first page
    pages.push(1)

    if (current > 3) {
      pages.push('...')
    }

    // Show pages around current page
    const start = Math.max(2, current - 1)
    const end = Math.min(total - 1, current + 1)

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    if (current < total - 2) {
      pages.push('...')
    }

    // Always show last page
    pages.push(total)
  }

  return pages
})

const goToPage = (page: number | string) => {
  if (typeof page === 'number' && page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

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

const viewProfile = (id: string) => {
  router.push({ path: `/dashboard/customers/${id}` })
}

</script>

<template>
  <div class="space-y-6">
    <header class="space-y-2">
      <h1 class="text-3xl font-bold tracking-tight">Customer Directory</h1>
      <p class="text-muted-foreground">
        Search, sort, and browse customers at a glance.
      </p>
    </header>

    <!-- Quick Stats Cards -->
    <div class="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Total Customers</CardTitle>
          <Users class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ totalCustomers }}</div>
          <p class="text-xs text-muted-foreground">All registered customers</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Loyal Customers</CardTitle>
          <Star class="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold text-amber-500">{{ loyalCustomers }}</div>
          <p class="text-xs text-muted-foreground">Premium tier members</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Total Vehicles</CardTitle>
          <Car class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ totalVehicles }}</div>
          <p class="text-xs text-muted-foreground">Across all customers</p>
        </CardContent>
      </Card>
    </div>

    <section class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div class="relative w-full md:max-w-2xl">
        <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          v-model="searchQuery"
          placeholder="Search name, phone, email, loyalty, vehicles"
          class="pl-10"
        />
      </div>
      <div class="flex flex-col items-stretch gap-2 sm:flex-row md:w-auto">
        <Button asChild variant="primary" class="sm:w-[180px]">
          <RouterLink :to="{ name: 'add-customer' }">
            <Plus class="mr-2 h-4 w-4" />
            Add Customer
          </RouterLink>
        </Button>
        <Select v-model="sortOrder">
          <SelectTrigger class="sm:w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">Name (A → Z)</SelectItem>
            <SelectItem value="desc">Name (Z → A)</SelectItem>
          </SelectContent>
        </Select>
        <Select v-model="itemsPerPage">
          <SelectTrigger class="sm:w-[120px]">
            <SelectValue placeholder="Per page" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem :value="10">10 / page</SelectItem>
            <SelectItem :value="25">25 / page</SelectItem>
            <SelectItem :value="50">50 / page</SelectItem>
            <SelectItem :value="100">100 / page</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </section>

    <section class="overflow-hidden rounded-xl border border-border bg-card shadow-lg">
      <Table class="text-base">
        <TableHeader>
          <TableRow>
            <TableHead class="h-12 px-4 text-base">Customer ID</TableHead>
            <TableHead class="h-12 px-4 text-base">Name</TableHead>
            <TableHead class="h-12 px-4 text-base">Phone Number</TableHead>
            <TableHead class="h-12 px-4 text-base">Email Address</TableHead>
            <TableHead class="h-12 px-4 text-base">Loyalty Status</TableHead>
            <TableHead class="h-12 px-4 text-right text-base">Total Vehicles</TableHead>
            <TableHead class="h-12 px-4 text-right text-base">Action</TableHead>
          </TableRow>
        </TableHeader>
        
        <!-- Loading State -->
        <TableBody v-if="isLoading">
          <TableRow v-for="i in itemsPerPage" :key="`skeleton-${i}`">
            <TableCell class="p-4"><Skeleton class="h-5 w-20" /></TableCell>
            <TableCell class="p-4"><Skeleton class="h-5 w-32" /></TableCell>
            <TableCell class="p-4"><Skeleton class="h-5 w-28" /></TableCell>
            <TableCell class="p-4"><Skeleton class="h-5 w-40" /></TableCell>
            <TableCell class="p-4"><Skeleton class="h-6 w-16" /></TableCell>
            <TableCell class="p-4 text-right"><Skeleton class="ml-auto h-5 w-8" /></TableCell>
            <TableCell class="p-4 text-right"><Skeleton class="ml-auto h-8 w-24" /></TableCell>
          </TableRow>
        </TableBody>

        <!-- Data Rows -->
        <TableBody v-else-if="paginatedCustomers.length">
          <TableRow
            v-for="customer in paginatedCustomers"
            :key="customer.id"
            class="hover:bg-muted/50"
          >
            <TableCell class="p-4 font-medium">{{ customer.id }}</TableCell>
            <TableCell class="p-4 font-medium">{{ customer.name }}</TableCell>
            <TableCell class="p-4">{{ customer.phoneNumber }}</TableCell>
            <TableCell class="p-4">{{ customer.emailAddress }}</TableCell>
            <TableCell class="p-4">
              <Badge
                v-if="customer.loyaltyStatus === 'Loyal'"
                class="bg-gradient-to-r from-amber-500 to-yellow-500 text-white hover:from-amber-600 hover:to-yellow-600"
              >
                <Star class="mr-1 h-3 w-3 fill-current" />
                {{ customer.loyaltyStatus }}
              </Badge>
              <Badge
                v-else
                variant="outline"
                class="capitalize"
              >
                {{ customer.loyaltyStatus.toLowerCase() }}
              </Badge>
            </TableCell>
            <TableCell class="p-4 text-right">{{ customer.totalVehicles }}</TableCell>
            <TableCell class="p-4 text-right">
              <Button
                type="button"
                variant="outline"
                size="sm"
                @click="viewProfile(customer.id)"
              >
                View Profile
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>

        <!-- Empty State -->
        <TableBody v-else>
          <TableRow>
            <TableCell colspan="7" class="p-12">
              <div class="flex flex-col items-center justify-center text-center">
                <Users class="mb-4 h-16 w-16 text-muted-foreground/40" />
                <h3 class="mb-2 text-lg font-semibold">No customers found</h3>
                <p class="mb-4 text-sm text-muted-foreground">
                  {{ searchQuery ? 'Try adjusting your search filters' : 'Get started by adding your first customer' }}
                </p>
                <Button
                  v-if="!searchQuery"
                  asChild
                  variant="primary"
                  size="sm"
                >
                  <RouterLink :to="{ name: 'add-customer' }">
                    <Plus class="mr-2 h-4 w-4" />
                    Add Customer
                  </RouterLink>
                </Button>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </section>

    <!-- Pagination Controls -->
    <section v-if="!isLoading && filteredCustomers.length > 0" class="flex items-center justify-between px-2">
      <div class="text-sm text-muted-foreground">
        Showing {{ (currentPage - 1) * itemsPerPage + 1 }} to 
        {{ Math.min(currentPage * itemsPerPage, filteredCustomers.length) }} of 
        {{ filteredCustomers.length }} customers
      </div>
      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          :disabled="currentPage === 1"
          @click="previousPage"
        >
          <ChevronLeft class="h-4 w-4" />
          Previous
        </Button>
        
        <div class="flex items-center gap-1">
          <Button
            v-for="(page, index) in paginationRange"
            :key="`page-${index}`"
            variant="outline"
            size="sm"
            :class="[
              'min-w-[40px]',
              currentPage === page ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground' : '',
              page === '...' ? 'pointer-events-none' : ''
            ]"
            :disabled="page === '...'"
            @click="goToPage(page)"
          >
            {{ page }}
          </Button>
        </div>

        <Button
          variant="outline"
          size="sm"
          :disabled="currentPage === totalPages"
          @click="nextPage"
        >
          Next
          <ChevronRight class="h-4 w-4" />
        </Button>
      </div>
    </section>
  </div>
</template>