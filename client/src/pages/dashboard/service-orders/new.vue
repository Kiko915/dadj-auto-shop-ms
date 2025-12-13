<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { createServiceOrder } from '@/api/serviceOrders'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { 
  Loader2, 
  Check,
} from 'lucide-vue-next'

// Modular Components (Reusing Estimate components as they are identical for item building)
import EstimateItemBuilder from '@/components/views/estimates/EstimateItemBuilder.vue'
import EstimateCustomerVehicleSelector from '@/components/views/estimates/EstimateCustomerVehicleSelector.vue'
import EstimateSummary from '@/components/views/estimates/EstimateSummary.vue'

const router = useRouter()

// --- State ---

const selectedCustomer = ref(null)
const selectedVehicleId = ref('')
const items = ref([])
const isSubmitting = ref(false)

// --- Computed ---

const partsTotal = computed(() => {
  return items.value
    .filter(i => i.type === 'PART')
    .reduce((sum, i) => sum + (i.price * i.quantity), 0)
})

const laborTotal = computed(() => {
  return items.value
    .filter(i => i.type === 'LABOR')
    .reduce((sum, i) => sum + (i.price * i.quantity), 0)
})

const grandTotal = computed(() => partsTotal.value + laborTotal.value)

// --- Actions ---

const saveOrder = async () => {
  if (!selectedCustomer.value || !selectedVehicleId.value || items.value.length === 0) return

  isSubmitting.value = true
  try {
    const payload = {
      customerId: selectedCustomer.value.id,
      vehicleId: selectedVehicleId.value,
      // No estimateId
      items: items.value.map(item => ({
        type: item.type,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity,
        inventoryItemId: item.inventoryItemId
      })),
      partsTotal: partsTotal.value,
      laborTotal: laborTotal.value,
      totalAmount: grandTotal.value,
      status: 'PENDING'
    }

    await createServiceOrder(payload)
    toast.success('Service Order created successfully')
    
    router.push('/dashboard/service-orders')
  } catch (error) {
    console.error('Failed to create service order', error)
    toast.error(error.response?.data?.message || 'Failed to create service order')
  } finally {
    isSubmitting.value = false
  }
}

</script>

<template>
  <div class="container mx-auto p-6 max-w-7xl animate-in fade-in duration-500">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div class="space-y-1">
        <h1 class="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            New Service Order
        </h1>
        <p class="text-muted-foreground text-sm">Create a new service order directly.</p>
      </div>
      <div class="flex gap-3">
        <Button variant="outline" @click="$router.back()">Cancel</Button>
        <Button 
            @click="saveOrder" 
            :disabled="isSubmitting || !selectedCustomer || !selectedVehicleId || items.length === 0"
            class="min-w-[140px]"
        >
          <Loader2 v-if="isSubmitting" class="w-4 h-4 mr-2 animate-spin" />
          <Check v-else class="w-4 h-4 mr-2" />
          Create Order
        </Button>
      </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-8">
    
      <!-- Left Column: Item Builder (2/3) -->
      <div class="xl:col-span-2 space-y-6">
        <EstimateItemBuilder v-model:items="items" title="Service Order Items" />
      </div>

      <!-- Right Column: Summary & Actions (1/3) -->
      <div class="space-y-6">
        
        <!-- Customer & Vehicle Selector -->
        <EstimateCustomerVehicleSelector 
            v-model:customer="selectedCustomer" 
            v-model:vehicleId="selectedVehicleId" 
        />

        <!-- Totals Summary -->
        <EstimateSummary 
            :labor-total="laborTotal"
            :parts-total="partsTotal"
            :grand-total="grandTotal"
            :items-count="items.length"
            :show-expiry="false" 
            title="Order Summary"
        />

      </div>
    </div>
  </div>
</template>
