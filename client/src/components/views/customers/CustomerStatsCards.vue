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
    <Card class="relative overflow-hidden bg-gradient-to-br from-blue-50 to-white border-blue-100 transition-all hover:shadow-md">
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium text-blue-900">Total Customers</CardTitle>
        <div class="p-2 bg-blue-100/50 rounded-lg">
          <Users class="h-4 w-4 text-blue-600" />
        </div>
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold text-blue-700">{{ totalCustomers }}</div>
        <p class="text-xs text-blue-600/80">All registered customers</p>
      </CardContent>
    </Card>

    <Card class="relative overflow-hidden bg-gradient-to-br from-amber-50 to-white border-amber-100 transition-all hover:shadow-md">
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium text-amber-900">Loyal Customers</CardTitle>
        <div class="p-2 bg-amber-100/50 rounded-lg">
          <Star class="h-4 w-4 text-amber-600" />
        </div>
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold text-amber-700">{{ loyalCustomers }}</div>
        <p class="text-xs text-amber-600/80">Premium tier members</p>
      </CardContent>
    </Card>

    <Card class="relative overflow-hidden bg-gradient-to-br from-green-50 to-white border-green-100 transition-all hover:shadow-md">
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium text-green-900">Total Vehicles</CardTitle>
        <div class="p-2 bg-green-100/50 rounded-lg">
          <Car class="h-4 w-4 text-green-600" />
        </div>
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold text-green-700">{{ totalVehicles }}</div>
        <p class="text-xs text-green-600/80">Across all customers</p>
      </CardContent>
    </Card>
  </div>
</template>
