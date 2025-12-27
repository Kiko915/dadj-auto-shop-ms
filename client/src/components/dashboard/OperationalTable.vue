<template>
  <div class="rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Vehicle</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Status</TableHead>
          <TableHead class="text-right">Due Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-if="loading" v-for="i in 3" :key="i">
           <TableCell><Skeleton class="h-4 w-[100px]" /></TableCell>
           <TableCell><Skeleton class="h-4 w-[120px]" /></TableCell>
           <TableCell><Skeleton class="h-4 w-[80px]" /></TableCell>
           <TableCell class="text-right"><Skeleton class="h-4 w-[80px] ml-auto" /></TableCell>
        </TableRow>
        
        <TableRow 
            v-else-if="orders && orders.length > 0" 
            v-for="order in orders" 
            :key="order.id"
            :class="{'bg-red-50 hover:bg-red-100': isOverdue(order.estimatedCompletion)}"
            class="cursor-pointer"
            @click="$router.push(`/dashboard/service-orders/${order.id}`)"
        >
          <TableCell class="font-medium">
            <div>{{ order.vehicle?.licensePlate }}</div>
            <div class="text-xs text-muted-foreground">{{ order.vehicle?.make }} {{ order.vehicle?.model }}</div>
          </TableCell>
          <TableCell>
            {{ order.customer?.firstName }} {{ order.customer?.lastName }}
          </TableCell>
          <TableCell>
            <Badge variant="outline" :class="getStatusColor(order.status)">
              {{ order.status }}
            </Badge>
          </TableCell>
          <TableCell class="text-right">
            <div :class="{'text-red-600 font-bold': isOverdue(order.estimatedCompletion)}">
                {{ formatDate(order.estimatedCompletion) }}
            </div>
          </TableCell>
        </TableRow>

        <TableRow v-else>
            <TableCell colspan="4" class="h-24 text-center">
                No priority jobs due today.
            </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
</template>

<script setup>
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

const props = defineProps({
  orders: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false }
})

const isOverdue = (date) => {
    if (!date) return false
    return new Date(date) < new Date().setHours(0,0,0,0)
}

const formatDate = (date) => {
    if (!date) return 'No Date'
    return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

const getStatusColor = (status) => {
  switch (status) {
    case 'PENDING': return 'bg-yellow-100 text-yellow-800'
    case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800'
    case 'COMPLETED': return 'bg-green-100 text-green-800'
    case 'CANCELLED': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}
</script>
