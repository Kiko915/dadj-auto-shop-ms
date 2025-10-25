<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { Search, Star } from 'lucide-vue-next'
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

type Customer = {
  id: string
  name: string
  phoneNumber: string
  emailAddress: string
  loyaltyStatus: 'Loyal' | 'Regular'
  totalVehicles: number
}

const router = useRouter()

const customers = ref<Customer[]>([
  {
    id: 'cust-1',
    name: 'Isabella Cortez',
    phoneNumber: '+63 917 555 2101',
    emailAddress: 'isabella.cortez@example.com',
    loyaltyStatus: 'Loyal',
    totalVehicles: 4
  },
  {
    id: 'cust-2',
    name: 'Miguel Dizon',
    phoneNumber: '+63 927 884 0023',
    emailAddress: 'miguel.dizon@example.com',
    loyaltyStatus: 'Regular',
    totalVehicles: 2
  },
  {
    id: 'cust-3',
    name: 'Rafael Dominguez',
    phoneNumber: '+63 905 778 4419',
    emailAddress: 'rafael.dominguez@example.com',
    loyaltyStatus: 'Loyal',
    totalVehicles: 5
  },
  {
    id: 'cust-4',
    name: 'Clarissa Yap',
    phoneNumber: '+63 936 112 7750',
    emailAddress: 'clarissa.yap@example.com',
    loyaltyStatus: 'Regular',
    totalVehicles: 1
  },
  {
    id: 'cust-5',
    name: 'Noah Mercado',
    phoneNumber: '+63 917 444 9034',
    emailAddress: 'noah.mercado@example.com',
    loyaltyStatus: 'Loyal',
    totalVehicles: 3
  }
])

const searchQuery = ref('')
const sortOrder = ref<'asc' | 'desc'>('asc')

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
        <Button asChild variant="secondary" class="md:w-[200px]">
          <RouterLink :to="{ name: 'add-customer' }">
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
        <TableBody v-if="filteredCustomers.length">
          <TableRow
            v-for="customer in filteredCustomers"
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
  </div>
</template>