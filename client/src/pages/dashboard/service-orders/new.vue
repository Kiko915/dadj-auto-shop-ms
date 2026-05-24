<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { createServiceOrder } from '@/api/serviceOrders'
import { getCustomer, searchCustomers } from '@/api/customers'
import { getCustomerVehicles } from '@/api/vehicles'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { 
  Loader2, 
  Check,
  Tag,
  Gift,
  AlertTriangle
} from 'lucide-vue-next'

// Modular Components (Reusing Estimate components as they are identical for item building)
import EstimateItemBuilder from '@/components/views/estimates/EstimateItemBuilder.vue'
import EstimateCustomerVehicleSelector from '@/components/views/estimates/EstimateCustomerVehicleSelector.vue'
import EstimateSummary from '@/components/views/estimates/EstimateSummary.vue'
import VoiceOrderAssistant from '@/components/voice/VoiceOrderAssistant.vue'
import DiagnosticAdvisor from '@/components/ai/DiagnosticAdvisor.vue'

const router = useRouter()
const route = useRoute()

// --- State ---

const selectedCustomer = ref(null)
const selectedVehicleId = ref('')
const items = ref([])
const isSubmitting = ref(false)
const discount = ref(0)
const discountReason = ref('')

// --- Helpers ---
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP'
    }).format(amount)
}

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

const isDiscountExcessive = computed(() => {
    return discount.value < 0 || discount.value > grandTotalBeforeDiscount.value
})

const grandTotal = computed(() => {
    const total = grandTotalBeforeDiscount.value - discount.value
    return total > 0 ? total : 0
})

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

    if (newVal.birthday) {
        // Parse as local date by splitting the ISO string to avoid UTC conversion issues
        const [year, month, day] = newVal.birthday.split('T')[0].split('-').map(Number)
        // Check if day and month match today
        if (day === today.getDate() && month === today.getMonth() + 1) {
            isBirthday = true;
        }
    }

    const isVIP = ['vip'].includes(newVal.loyaltyStatus?.toLowerCase());
    const isLoyal = ['loyal'].includes(newVal.loyaltyStatus?.toLowerCase());

    // Priority: Birthday > VIP > Loyal
    if (isBirthday) {
        toast.success(`🎉 It's ${newVal.firstName}'s Birthday! Eligible for Birthday Discount. Please check amount.`)
        discountReason.value = "Birthday Discount"
        // Optionally auto-apply a default birthday discount
        // discount.value = 500
    } else if (isVIP || isLoyal) {
        const type = isVIP ? 'VIP' : 'Loyal';
        toast.info(`💎 Customer is ${type}. Eligible for loyalty discount.`)
        discountReason.value = `${type} Loyalty Discount`
        // Optionally auto-apply a loyalty discount
        // discount.value = isVIP ? 200 : 100
    } else {
        // Reset if manually changing customers unless manually overridden? 
        // Safer to reset to avoid applying wrong discount to wrong person
        discount.value = 0
        discountReason.value = ''
    }
})

const bestVehicleMatch = (vehicles, description) => {
  if (!vehicles.length) return null
  if (vehicles.length === 1) return vehicles[0]

  const words = description.toLowerCase().split(/\s+/).filter(w => w.length > 1)

  let best = null
  let bestScore = 0

  for (const v of vehicles) {
    const make  = v.make?.toLowerCase() || ''
    const model = v.model?.toLowerCase() || ''
    const plate = v.licensePlate?.toLowerCase() || ''
    const year  = v.year?.toString() || ''
    let score = 0

    for (const word of words) {
      if (make  && (make.includes(word)  || word.includes(make)))  score += 3
      if (model && (model.includes(word) || word.includes(model))) score += 3
      if (plate && plate.includes(word)) score += 5
      if (year  && year.includes(word))  score += 2
    }

    if (score > bestScore) { bestScore = score; best = v }
  }

  return bestScore > 0 ? best : null
}

const findCustomer = async (fullName) => {
  // Try full string first (works if name is stored in one field)
  let results = await searchCustomers(fullName)
  if (results.length > 0) return results

  const parts = fullName.trim().split(/\s+/)
  if (parts.length < 2) return []

  // Try last name (usually most unique)
  const lastName = parts.slice(1).join(' ')
  results = await searchCustomers(lastName)
  if (results.length > 0) {
    const firstName = parts[0].toLowerCase()
    const filtered = results.filter(c =>
      c.firstName?.toLowerCase().startsWith(firstName) ||
      firstName.startsWith(c.firstName?.toLowerCase())
    )
    return filtered.length > 0 ? filtered : results
  }

  // Fall back to first name
  return await searchCustomers(parts[0])
}

const applyVoiceOrder = async (data) => {
  if (data.customerName) {
    try {
      const results = await findCustomer(data.customerName)

      if (results.length === 0) {
        toast.warning(`"${data.customerName}" not found — please select manually.`)
      } else {
        // Step 1: fetch and set customer
        const customerRes = await getCustomer(results[0].id)
        selectedCustomer.value = customerRes.customer
        toast.success(`Customer: ${customerRes.customer.firstName} ${customerRes.customer.lastName}`)

        // Step 2: fetch vehicles independently (don't block on failure)
        try {
          const vehicleRes = await getCustomerVehicles(results[0].id, { pageSize: 100 })
          const vehicles = Array.isArray(vehicleRes)
            ? vehicleRes
            : vehicleRes.vehicles || vehicleRes.items || []

          if (vehicles.length > 0) {
            const desc = data.vehicleDescription || ''
            const match = desc.trim()
              ? bestVehicleMatch(vehicles, desc)
              : vehicles.length === 1 ? vehicles[0] : null

            if (match) {
              // Give the selector component time to render vehicles after customer prop change
              await nextTick()
              await new Promise(r => setTimeout(r, 1200))
              selectedVehicleId.value = match.id
              toast.success(`Vehicle: ${[match.year, match.make, match.model].filter(Boolean).join(' ')}`)
            } else if (vehicles.length > 1) {
              toast.info('Multiple vehicles — please select one manually.')
            }
          }
        } catch (e) {
          console.error('Vehicle match failed:', e)
          toast.warning('Could not auto-select vehicle — please select manually.')
        }
      }
    } catch (e) {
      console.error('Voice apply error:', e)
      toast.error('Failed to find customer.')
    }
  }

  if (data.items?.length) {
    const newItems = data.items.map(item => ({
      type: item.type || 'PART',
      name: item.name || '',
      description: '',
      quantity: Number(item.quantity) || 1,
      price: Number(item.price) || 0,
      inventoryItemId: null,
    }))
    items.value.push(...newItems)
    toast.success(`Added ${newItems.length} item(s) from voice input.`)
  }
}

const applyDiagnosis = (data) => {
  if (data.items?.length) {
    const newItems = data.items.map(item => ({
      type: item.type || 'LABOR',
      name: item.name || '',
      description: item.description || '',
      quantity: Number(item.quantity) || 1,
      price: Number(item.price) || 0,
      inventoryItemId: null,
    }))
    items.value.push(...newItems)
  }
}

const saveOrder = async () => {
  if (!selectedCustomer.value || !selectedVehicleId.value || items.value.length === 0 || isDiscountExcessive.value) return

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
  <div class="w-full max-w-7xl mx-auto animate-in fade-in duration-500 pb-24 sm:pb-6">

    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-8">
      <div class="space-y-0.5">
        <h1 class="text-xl sm:text-3xl font-bold tracking-tight text-foreground">
          New Service Order
        </h1>
        <p class="text-muted-foreground text-xs sm:text-sm">Create a new service order directly.</p>
      </div>
      <!-- Desktop action buttons — hidden on mobile (mobile has sticky bar) -->
      <div class="hidden sm:flex flex-wrap gap-2">
        <DiagnosticAdvisor @apply="applyDiagnosis" />
        <VoiceOrderAssistant @apply="applyVoiceOrder" />
        <Button variant="outline" @click="$router.back()">Cancel</Button>
        <Button
          @click="saveOrder"
          :disabled="isSubmitting || !selectedCustomer || !selectedVehicleId || items.length === 0 || isDiscountExcessive"
          class="min-w-[140px]"
        >
          <Loader2 v-if="isSubmitting" class="w-4 h-4 mr-2 animate-spin" />
          <Check v-else class="w-4 h-4 mr-2" />
          Create Order
        </Button>
      </div>
      <!-- Mobile: AI buttons in header -->
      <div class="flex sm:hidden gap-2">
        <DiagnosticAdvisor @apply="applyDiagnosis" />
        <VoiceOrderAssistant @apply="applyVoiceOrder" />
      </div>
    </div>

    <!-- Main Grid -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-8">

      <!-- Right Column first on mobile (customer must be selected before items) -->
      <div class="xl:col-span-1 xl:order-2 space-y-4 min-w-0">

        <!-- Customer & Vehicle Selector -->
        <EstimateCustomerVehicleSelector
          v-model:customer="selectedCustomer"
          v-model:vehicleId="selectedVehicleId"
        />

        <!-- Discount Control -->
        <Card class="bg-white shadow-sm border-slate-200">
          <CardHeader class="pb-3 border-b px-4">
            <CardTitle class="text-sm font-semibold flex items-center gap-2">
              <Tag class="w-4 h-4 text-purple-500" /> Apply Discount
            </CardTitle>
          </CardHeader>
          <CardContent class="pt-4 space-y-3 px-4">
            <div class="space-y-1.5">
              <Label class="text-xs">Discount Amount (₱)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                :max="grandTotalBeforeDiscount"
                v-model="discount"
                placeholder="0.00"
                :class="{'border-destructive focus-visible:ring-destructive': isDiscountExcessive}"
              />
              <div v-if="isDiscountExcessive" class="flex items-center gap-1.5 text-xs text-destructive font-medium animate-in fade-in-0">
                <AlertTriangle class="h-3.5 w-3.5 shrink-0" />
                Discount cannot exceed {{ formatCurrency(grandTotalBeforeDiscount) }} or be negative.
              </div>
            </div>
            <div class="space-y-1.5">
              <Label class="text-xs">Reason / Promo Code</Label>
              <Input type="text" v-model="discountReason" placeholder="e.g. Senior Citizen, Promo" />
            </div>
            <div v-if="selectedCustomer?.birthday && discountReason.includes('Birthday')" class="bg-purple-50 text-purple-700 p-2 rounded text-xs flex items-center gap-2">
              <Gift class="w-3 h-3 shrink-0" /> Birthday verified: {{ new Date(selectedCustomer.birthday).toLocaleDateString() }}
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

      <!-- Left Column: Item Builder -->
      <div class="xl:col-span-2 xl:order-1 min-w-0">
        <EstimateItemBuilder v-model:items="items" title="Service Order Items" />
      </div>

    </div>

    <!-- Mobile Sticky Bottom Bar -->
    <div class="fixed bottom-0 left-0 right-0 z-40 sm:hidden bg-background border-t shadow-lg px-4 py-3 flex gap-2">
      <Button variant="outline" class="flex-1" @click="$router.back()">Cancel</Button>
      <Button
        class="flex-1"
        @click="saveOrder"
        :disabled="isSubmitting || !selectedCustomer || !selectedVehicleId || items.length === 0 || isDiscountExcessive"
      >
        <Loader2 v-if="isSubmitting" class="w-4 h-4 mr-1.5 animate-spin" />
        <Check v-else class="w-4 h-4 mr-1.5" />
        Create Order
      </Button>
    </div>

  </div>
</template>
