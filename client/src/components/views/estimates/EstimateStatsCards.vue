<script setup lang="ts">
import { FileText, Clock, TrendingUp, XCircle } from 'lucide-vue-next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  stats: {
    totalEstimates: number
    pendingEstimates: number
    approvedEstimates: number
    declinedEstimates: number
    revenue: number
  }
}

defineProps<Props>()

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP'
  }).format(value)
}
</script>

<template>
  <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
    <Card class="relative overflow-hidden bg-gradient-to-br from-blue-50 to-white border-blue-100 transition-all hover:shadow-md">
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium text-blue-900">Total Estimates</CardTitle>
        <div class="p-2 bg-blue-100/50 rounded-lg">
          <FileText class="h-4 w-4 text-blue-600" />
        </div>
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold text-blue-700">{{ stats.totalEstimates }}</div>
        <p class="text-xs text-blue-600/80">Lifetime generated</p>
      </CardContent>
    </Card>

    <Card class="relative overflow-hidden bg-gradient-to-br from-amber-50 to-white border-amber-100 transition-all hover:shadow-md">
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium text-amber-900">Pending Approval</CardTitle>
        <div class="p-2 bg-amber-100/50 rounded-lg">
          <Clock class="h-4 w-4 text-amber-600" />
        </div>
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold text-amber-700">{{ stats.pendingEstimates }}</div>
        <p class="text-xs text-amber-600/80">Awaiting action</p>
      </CardContent>
    </Card>

    <Card class="relative overflow-hidden bg-gradient-to-br from-green-50 to-white border-green-100 transition-all hover:shadow-md">
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium text-green-900">Projected Revenue</CardTitle>
        <div class="p-2 bg-green-100/50 rounded-lg">
          <TrendingUp class="h-4 w-4 text-green-600" />
        </div>
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold text-green-700">{{ formatCurrency(stats.revenue) }}</div>
        <p class="text-xs text-green-600/80">From {{ stats.approvedEstimates }} approved estimates</p>
      </CardContent>
    </Card>

    <Card class="relative overflow-hidden bg-gradient-to-br from-red-50 to-white border-red-100 transition-all hover:shadow-md">
       <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
         <CardTitle class="text-sm font-medium text-red-900">Declined</CardTitle>
         <div class="p-2 bg-red-100/50 rounded-lg">
           <XCircle class="h-4 w-4 text-red-600" />
         </div>
       </CardHeader>
       <CardContent>
         <div class="text-2xl font-bold text-red-700">{{ stats.declinedEstimates }}</div>
         <p class="text-xs text-red-600/80">Estimates rejected</p>
       </CardContent>
     </Card>
  </div>
</template>
