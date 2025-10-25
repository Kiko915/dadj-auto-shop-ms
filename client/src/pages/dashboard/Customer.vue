<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { Search, Star, Plus, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
const sortOrder = ref<'asc' | 'desc'>('asc')
const currentPage = ref(1)
const itemsPerPage = 10

const filteredCustomers = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

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

const totalPages = computed(() => Math.ceil(filteredCustomers.value.length / itemsPerPage))

const paginatedCustomers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredCustomers.value.slice(start, end)
})

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
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
  <div class="space-y-6 p-6">
    <header class="space-y-2">
      <h1 class="text-2xl font-semibold tracking-tight">Customer Directory</h1>
      <p class="text-sm text-muted-foreground">
        Search, sort, and browse customers at a glance.
      </p>
    </header>

    <section class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div class="relative w-full md:max-w-2xl">
        <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          v-model="searchQuery"
          placeholder="Search name, phone, email, loyalty, vehicles"
          class="pl-10"
        />
      </div>
      <div class="flex flex-col items-stretch gap-2 md:w-auto">
        <Button asChild variant="primary" class="md:w-[200px]">
          <RouterLink :to="{ name: 'add-customer' }">
            <Plus class="mr-2 h-4 w-4" />
            Add Customer
          </RouterLink>
        </Button>
        <Select v-model="sortOrder">
          <SelectTrigger class="md:w-[200px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">Name (A → Z)</SelectItem>
            <SelectItem value="desc">Name (Z → A)</SelectItem>
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
        <TableBody v-if="paginatedCustomers.length">
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
                variant="secondary"
                class="capitalize"
              >
                <Star class="h-3 w-3" />
                {{ customer.loyaltyStatus.toLowerCase() }}
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
        <TableBody v-else>
          <TableRow>
            <TableCell colspan="7" class="p-10 text-center text-sm text-muted-foreground">
              No customers found. Adjust your filters and try again.
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </section>

    <!-- Pagination Controls -->
    <section class="flex items-center justify-between px-2">
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
            v-for="page in totalPages"
            :key="page"
            variant="outline"
            size="sm"
            :class="[
              'min-w-[40px]',
              currentPage === page ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''
            ]"
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