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
    <Card>
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium">Total Products</CardTitle>
        <Package class="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div v-if="loading" class="h-8 w-24 animate-pulse rounded bg-muted"></div>
        <div v-else class="text-2xl font-bold">{{ stats.totalProducts }} Items</div>
        <p class="text-xs text-muted-foreground">In your inventory</p>
      </CardContent>
    </Card>

    <!-- Low Stock Alert -->
    <Card>
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium">Low Stock Alert</CardTitle>
        <AlertTriangle class="h-4 w-4 text-destructive" />
      </CardHeader>
      <CardContent>
        <div v-if="loading" class="h-8 w-24 animate-pulse rounded bg-muted"></div>
        <div v-else class="text-2xl font-bold text-destructive">
          {{ stats.lowStockItems }} Items
        </div>
        <p class="text-xs text-muted-foreground">Needs restock</p>
      </CardContent>
    </Card>

    <!-- Total Inventory Value -->
    <Card>
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium">Total Inventory Value</CardTitle>
        <DollarSign class="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div v-if="loading" class="h-8 w-24 animate-pulse rounded bg-muted"></div>
        <div v-else class="text-2xl font-bold">{{ formatCurrency(stats.totalValue) }}</div>
        <p class="text-xs text-muted-foreground">Overall value</p>
      </CardContent>
    </Card>
  </div>
</template>
