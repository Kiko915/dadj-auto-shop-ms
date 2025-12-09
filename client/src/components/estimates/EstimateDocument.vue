<script setup>
import { computed } from 'vue'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { 
  User, 
  Car,
  AlertCircle
} from 'lucide-vue-next'

const props = defineProps({
    estimate: {
        type: Object,
        required: true
    }
})

const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })
}

const formatCurrency = (amount) => {
    const value = Number(amount)
    if (!Number.isFinite(value)) return '₱0.00'
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP'
    }).format(value)
}

const formattedEstimateId = computed(() => {
    const id = props.estimate.id
    return id.startsWith('EST-') ? id : id.slice(-8).toUpperCase()
})

const items = computed(() => {
    return props.estimate.items || []
})
</script>

<template>
    <div class="bg-white border rounded-lg shadow-sm p-8 print:border-none print:shadow-none print:p-0">
        
        <!-- Document Header (Visible mostly in print/preview) -->
        <div class="flex justify-between items-start mb-8 border-b pb-6">
            <div>
                <img src="/logo/symbol_w_wordmark_primary.png" alt="Logo" class="h-12 mb-4" />
                <h2 class="text-2xl font-bold text-gray-900">Repair Estimate</h2>
                <p class="text-sm text-gray-500 mt-1">#{{ formattedEstimateId }}</p>
            </div>
            <div class="text-right">
                <div class="font-semibold text-gray-900">DADJ Auto Shop</div>
                <p class="text-sm text-gray-500">St. John Village, Brgy Bungkol, Liliw Laguna</p>
                <p class="text-sm text-gray-500">09054050454 - Jerry Arce ( Facebook )</p>
            </div>
        </div>

        <!-- Info Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <!-- Customer Info -->
            <div class="p-4 rounded-lg bg-gray-50 border border-gray-100">
                <div class="flex items-center gap-2 mb-3 text-gray-900 font-semibold">
                    <User class="h-4 w-4 text-primary" />
                    Customer Details
                </div>
                <div class="space-y-1 text-sm">
                    <p><span class="text-gray-500 w-20 inline-block">Name:</span> {{ estimate.customer?.firstName ?? '' }} {{ estimate.customer?.lastName ?? '' }}</p>
                    <p><span class="text-gray-500 w-20 inline-block">Email:</span> {{ estimate.customer?.email ?? '' }}</p>
                    <p><span class="text-gray-500 w-20 inline-block">Phone:</span> {{ estimate.customer?.phoneNumber ?? '' }}</p>
                </div>
            </div>

            <!-- Vehicle Info -->
            <div class="p-4 rounded-lg bg-gray-50 border border-gray-100">
                <div class="flex items-center gap-2 mb-3 text-gray-900 font-semibold">
                    <Car class="h-4 w-4 text-primary" />
                    Vehicle Details
                </div>
                <div class="space-y-1 text-sm">
                    <p><span class="text-gray-500 w-20 inline-block">Vehicle:</span> {{ estimate.vehicle?.make ?? '' }} {{ estimate.vehicle?.model ?? '' }}</p>
                    <p><span class="text-gray-500 w-20 inline-block">License:</span> {{ estimate.vehicle?.licensePlate ?? '' }}</p>
                    <p v-if="estimate.vehicle?.vin"><span class="text-gray-500 w-20 inline-block">VIN:</span> {{ estimate.vehicle?.vin }}</p>
                </div>
            </div>
        </div>

        <!-- Items Table -->
        <div class="rounded-md border overflow-hidden mb-8">
            <Table>
                <TableHeader class="bg-gray-50">
                    <TableRow>
                        <TableHead class="w-[50%]">Item Description</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead class="text-right">Qty</TableHead>
                        <TableHead class="text-right">Price</TableHead>
                        <TableHead class="text-right">Total</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow v-for="item in items" :key="item.id">
                        <TableCell>
                            <div class="font-medium">{{ item.name }}</div>
                            <div v-if="item.description" class="text-sm text-muted-foreground">{{ item.description }}</div>
                        </TableCell>
                        <TableCell>
                            <Badge variant="outline" class="text-[10px] uppercase">{{ item.type }}</Badge>
                            
                            <!-- Stock Tooltip for PARTS -->
                            <TooltipProvider v-if="item.type === 'PART' && item.inventoryItem">
                                <Tooltip>
                                    <TooltipTrigger as-child>
                                        <AlertCircle class="h-3 w-3 text-muted-foreground inline ml-2 cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Current Stock: {{ item.inventoryItem.quantity }}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </TableCell>
                        <TableCell class="text-right">{{ item.quantity }}</TableCell>
                        <TableCell class="text-right">{{ formatCurrency(item.price) }}</TableCell>
                        <TableCell class="text-right font-medium">{{ formatCurrency(item.total) }}</TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </div>

        <!-- Footer -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- Left: Terms -->
            <div class="text-sm text-gray-500 space-y-2">
                <p class="font-semibold text-gray-900">Terms & Notes:</p>
                <p>
                    1. This estimate is valid {{ estimate.expiryDate ? `until ${formatDate(estimate.expiryDate)}` : 'for 30 days from the date of issue' }}.
                </p>
                <p>2. Prices for parts are subject to change based on supplier availability.</p>
                <p>3. Additional labor may be charged if unforeseen issues arise.</p>
            </div>

            <!-- Right: Totals -->
            <div class="bg-gray-50 rounded-lg p-6 space-y-3">
                <div class="flex justify-between text-sm">
                    <span class="text-muted-foreground">Labor Total:</span>
                    <span>{{ formatCurrency(estimate.laborTotal) }}</span>
                </div>
                <div class="flex justify-between text-sm">
                    <span class="text-muted-foreground">Parts Total:</span>
                    <span>{{ formatCurrency(estimate.partsTotal) }}</span>
                </div>
                <div class="border-t pt-3 flex justify-between font-bold text-lg">
                    <span>Grand Total:</span>
                    <span>{{ formatCurrency(estimate.totalAmount) }}</span>
                </div>
            </div>
        </div>

    </div>
</template>
