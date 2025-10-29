<script setup lang="ts">
import { Users, Star, Car } from 'lucide-vue-next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  totalCustomers: number
  loyalCustomers: number
  totalVehicles: number
}

defineProps<Props>()
</script>

<template>
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
</template>
