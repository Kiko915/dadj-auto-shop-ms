<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { createServiceOrder } from '@/api/serviceOrders'
import { getCustomer } from '@/api/customers'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { 
  Loader2, 
  Check,
  Tag,
  Gift
} from 'lucide-vue-next'

// Modular Components (Reusing Estimate components as they are identical for item building)
import EstimateItemBuilder from '@/components/views/estimates/EstimateItemBuilder.vue'
import EstimateCustomerVehicleSelector from '@/components/views/estimates/EstimateCustomerVehicleSelector.vue'
import EstimateSummary from '@/components/views/estimates/EstimateSummary.vue'

const router = useRouter()
const route = useRoute()

// --- State ---

const selectedCustomer = ref(null)
const selectedVehicleId = ref('')
const items = ref([])
const isSubmitting = ref(false)
const discount = ref(0)
const discountReason = ref('')

// --- Lifecycle ---

onMounted(async () => {
    const customerId = route.query.customerId
    if (customerId) {
        try {
            const response = await getCustomer(customerId)
            selectedCustomer.value = response.customer
        } catch (error) {
            console.error('Failed to pre-fill customer:', error)
            toast.error('Failed to load selected customer')
        }
    }
})

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

// --- Actions ---

const grandTotalBeforeDiscount = computed(() => partsTotal.value + laborTotal.value)
const grandTotal = computed(() => Math.max(0, grandTotalBeforeDiscount.value - discount.value))

// Auto-apply discount logic
watch(selectedCustomer, (newVal) => {
    if (!newVal) { 
        discount.value = 0;
        discountReason.value = '';
        return 
    }

    const today = new Date();
    const birthDate = newVal.birthday ? new Date(newVal.birthday) : null;
    let isBirthday = false;

    if (birthDate) {
        // Check if day and month match
        if (birthDate.getDate() === today.getDate() && birthDate.getMonth() === today.getMonth()) {
            isBirthday = true;
        }
    }

    const isVIP = ['vip'].includes(newVal.loyaltyStatus?.toLowerCase());
    const isLoyal = ['loyal'].includes(newVal.loyaltyStatus?.toLowerCase());

    // Priority: Birthday > VIP > Loyal
    if (isBirthday) {
        toast.success(`🎉 It's ${newVal.firstName}'s Birthday! Recommendation: Apply Birthday Discount.`)
        discountReason.value = "Birthday Discount"
    } else if (isVIP || isLoyal) {
        const type = isVIP ? 'VIP' : 'Loyal';
        toast.info(`💎 Customer is ${type}. Eligible for loyalty discount.`)
        discountReason.value = `${type} Loyalty Discount`
    } else {
        // Reset if manually changing customers unless manually overridden? 
        // Safer to reset to avoid applying wrong discount to wrong person
        discount.value = 0
        discountReason.value = ''
    }
})

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
      discount: discount.value,
      discountReason: discountReason.value,
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

        <!-- Discount Control -->
        <Card class="bg-white shadow-sm border-slate-200">
            <CardHeader class="pb-3 border-b">
                <CardTitle class="text-sm font-semibold flex items-center gap-2">
                    <Tag class="w-4 h-4 text-purple-500" /> Apply Discount
                </CardTitle>
            </CardHeader>
            <CardContent class="pt-4 space-y-4">
                <div class="space-y-2">
                     <Label class="text-xs">Discount Amount (₱)</Label>
                     <Input type="number" step="0.01" min="0" v-model="discount" placeholder="0.00" />
                </div>
                <div class="space-y-2">
                     <Label class="text-xs">Reason / Promo Code</Label>
                     <Input type="text" v-model="discountReason" placeholder="e.g. Senior Citizen, Promo" />
                </div>

                <div v-if="selectedCustomer?.birthday && discountReason.includes('Birthday')" class="bg-purple-50 text-purple-700 p-2 rounded text-xs flex items-center gap-2">
                    <Gift class="w-3 h-3" /> Birthday verified: {{ new Date(selectedCustomer.birthday).toLocaleDateString() }}
                </div>
            </CardContent>
        </Card>

        <!-- Totals Summary -->
        <EstimateSummary 
            :labor-total="laborTotal"
            :parts-total="partsTotal"
            :grand-total="grandTotal"
            :discount="discount"
            :discount-reason="discountReason"
            :items-count="items.length"
            :show-expiry="false" 
            title="Order Summary"
        />

      </div>
    </div>
  </div>
</template>
