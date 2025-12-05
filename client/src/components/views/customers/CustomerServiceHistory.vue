<script setup lang="ts">
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { History, Plus, Receipt } from 'lucide-vue-next'

type ServiceRecord = {
  id: string
  date: string
  vehicleId: string
  vehicleName: string
  totalAmount: number
  paymentStatus: 'Paid' | 'Outstanding' | 'Partial'
}

const props = defineProps<{
  serviceHistory: ServiceRecord[]
}>()

const emit = defineEmits<{
  startServiceOrder: []
  viewReceipt: [serviceId: string]
}>()

import formatDate from '@/utils/formatDate'

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(amount)
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Transaction History</CardTitle>
      <CardDescription>Complete service order history for this customer</CardDescription>
    </CardHeader>
    <CardContent>
      <!-- Empty State -->
      <div v-if="serviceHistory.length === 0" class="text-center py-12">
        <History class="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 class="text-lg font-semibold mb-2">No Service History</h3>
        <p class="text-muted-foreground mb-4">
          This customer hasn't had any services yet.
        </p>
        <Button @click="emit('startServiceOrder')">
          <Plus class="h-4 w-4 mr-2" />
          Create First Service Order
        </Button>
      </div>

      <!-- Service History Table -->
      <div v-else class="rounded-md border">
        <table class="w-full">
          <thead class="bg-muted/50">
            <tr class="border-b">
              <th class="px-4 py-3 text-left text-sm font-medium">Date</th>
              <th class="px-4 py-3 text-left text-sm font-medium">Vehicle</th>
              <th class="px-4 py-3 text-left text-sm font-medium">Total Amount</th>
              <th class="px-4 py-3 text-left text-sm font-medium">Payment Status</th>
              <th class="px-4 py-3 text-right text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="service in serviceHistory" :key="service.id" class="border-b hover:bg-muted/50">
              <td class="px-4 py-3">{{ formatDate(service.date) }}</td>
              <td class="px-4 py-3">{{ service.vehicleName }}</td>
              <td class="px-4 py-3 font-medium">{{ formatCurrency(service.totalAmount) }}</td>
              <td class="px-4 py-3">
                <Badge :variant="service.paymentStatus === 'Paid' ? 'default' : service.paymentStatus === 'Outstanding' ? 'destructive' : 'secondary'">
                  {{ service.paymentStatus }}
                </Badge>
              </td>
              <td class="px-4 py-3 text-right">
                <Button variant="outline" size="sm" @click="emit('viewReceipt', service.id)">
                  <Receipt class="h-4 w-4 mr-2" />
                  View Receipt
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </CardContent>
  </Card>
</template>
