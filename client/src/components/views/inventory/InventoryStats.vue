<script setup>
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, AlertTriangle, DollarSign } from 'lucide-vue-next'

defineProps({
  stats: {
    type: Object,
    required: true,
    default: () => ({
      totalProducts: 0,
      lowStockItems: 0,
      totalValue: 0
    })
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP'
  }).format(value)
}
</script>

<template>
  <div class="grid gap-4 md:grid-cols-3">
    <!-- Total Products -->
    <Card class="relative overflow-hidden bg-gradient-to-br from-blue-50 to-white border-blue-100 transition-all hover:shadow-md">
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium text-blue-900">Total Products</CardTitle>
        <div class="p-2 bg-blue-100/50 rounded-lg">
          <Package class="h-4 w-4 text-blue-600" />
        </div>
      </CardHeader>
      <CardContent>
        <div v-if="loading" class="h-8 w-24 animate-pulse rounded bg-blue-100"></div>
        <div v-else class="text-2xl font-bold text-blue-700">{{ stats.totalProducts }} Items</div>
        <p class="text-xs text-blue-600/80">In your inventory</p>
      </CardContent>
    </Card>

    <!-- Low Stock Alert -->
    <Card class="relative overflow-hidden bg-gradient-to-br from-red-50 to-white border-red-100 transition-all hover:shadow-md">
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium text-red-900">Low Stock Alert</CardTitle>
        <div class="p-2 bg-red-100/50 rounded-lg">
          <AlertTriangle class="h-4 w-4 text-red-600" />
        </div>
      </CardHeader>
      <CardContent>
        <div v-if="loading" class="h-8 w-24 animate-pulse rounded bg-red-100"></div>
        <div v-else class="text-2xl font-bold text-red-700">
          {{ stats.lowStockItems }} Items
        </div>
        <p class="text-xs text-red-600/80">Needs restock</p>
      </CardContent>
    </Card>

    <!-- Total Inventory Value -->
    <Card class="relative overflow-hidden bg-gradient-to-br from-green-50 to-white border-green-100 transition-all hover:shadow-md">
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium text-green-900">Total Inventory Value</CardTitle>
        <div class="p-2 bg-green-100/50 rounded-lg">
          <DollarSign class="h-4 w-4 text-green-600" />
        </div>
      </CardHeader>
      <CardContent>
        <div v-if="loading" class="h-8 w-24 animate-pulse rounded bg-green-100"></div>
        <div v-else class="text-2xl font-bold text-green-700">{{ formatCurrency(stats.totalValue) }}</div>
        <p class="text-xs text-green-600/80">Overall value</p>
      </CardContent>
    </Card>
  </div>
</template>
