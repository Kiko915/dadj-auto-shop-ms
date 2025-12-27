<script setup>
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { History, Plus, Receipt } from 'lucide-vue-next'
import formatDate from '@/utils/formatDate'

defineProps({
  serviceHistory: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['startServiceOrder', 'viewReceipt'])

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(amount)
}

const getPaymentStatusVariant = (status) => {
  const s = status?.toUpperCase()
  switch (s) {
    case 'PAID': return 'default'
    case 'UNPAID': 
    case 'OUTSTANDING': return 'destructive'
    case 'PARTIAL': return 'secondary'
    default: return 'secondary'
  }
}

const getPaymentStatusClass = (status) => {
  const s = status?.toUpperCase()
  switch (s) {
    case 'PAID': return 'bg-green-500 hover:bg-green-600 text-white border-transparent'
    case 'PARTIAL': return 'bg-yellow-500 hover:bg-yellow-600 text-white border-transparent'
    case 'UNPAID':
    case 'OUTSTANDING': return 'bg-red-500 hover:bg-red-600 text-white border-transparent'
    default: return ''
  }
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Payment Status</TableHead>
              <TableHead class="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="service in serviceHistory" :key="service.id">
              <TableCell>{{ formatDate(service.date) }}</TableCell>
              <TableCell>{{ service.vehicleName }}</TableCell>
              <TableCell class="font-medium">{{ formatCurrency(service.totalAmount) }}</TableCell>
              <TableCell>
                <Badge 
                  :variant="getPaymentStatusVariant(service.paymentStatus)"
                  :class="getPaymentStatusClass(service.paymentStatus)"
                >
                  {{ service.paymentStatus }}
                </Badge>
              </TableCell>
              <TableCell class="text-right">
                <Button variant="ghost" size="sm" @click="emit('viewReceipt', service.id)">
                  <Receipt class="h-4 w-4 mr-2" />
                  View Receipt
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </CardContent>
  </Card>
</template>
