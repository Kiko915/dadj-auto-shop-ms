<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { createEstimate, getEstimate, updateEstimate } from '@/api/estimates'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { 
  FilePlus, 
  Loader2, 
  Check,
  Save,
  Pencil
} from 'lucide-vue-next'
import { useRoute } from 'vue-router'

// Modular Components
import EstimateItemBuilder from '@/components/views/estimates/EstimateItemBuilder.vue'
import EstimateCustomerVehicleSelector from '@/components/views/estimates/EstimateCustomerVehicleSelector.vue'
import EstimateSummary from '@/components/views/estimates/EstimateSummary.vue'

const router = useRouter()
const route = useRoute()

// Computed: Check if editing
const isEditing = computed(() => !!route.query.edit)
const estimateId = computed(() => route.query.edit)

// --- State ---

const selectedCustomer = ref(null)
const selectedVehicleId = ref('')
const items = ref([])
const expiryDate = ref('')
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

// --- Actions: Estimate ---

// --- Actions: Estimate ---

const saveEstimate = async (status = 'PENDING') => {
  if (!selectedCustomer.value || !selectedVehicleId.value || items.value.length === 0) return

  isSubmitting.value = true
  try {
    const payload = {
      customerId: selectedCustomer.value.id,
      vehicleId: selectedVehicleId.value,
      status: status,
      expiryDate: expiryDate.value || null,
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
      totalAmount: grandTotal.value
    }

    if (isEditing.value) {
        await updateEstimate(estimateId.value, payload)
        toast.success('Estimate updated successfully')
    } else {
        await createEstimate(payload)
        toast.success('Estimate created successfully')
    }
    
    // Clear draft on success
    localStorage.removeItem(STORAGE_KEY)
    
    router.push('/dashboard/estimates') // Redirect to list
  } catch (error) {
    console.error('Failed to save estimate', error)
    toast.error(error.response?.data?.message || 'Failed to save estimate')
  } finally {
    isSubmitting.value = false
  }
}

// --- Auto-Save Logic ---
const STORAGE_KEY = 'estimate_draft'

const saveDraftToStorage = () => {
    const draft = {
        customer: selectedCustomer.value,
        vehicleId: selectedVehicleId.value,
        items: items.value,
        expiryDate: expiryDate.value
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
}

watch([selectedCustomer, selectedVehicleId, items, expiryDate], () => {
    saveDraftToStorage()
}, { deep: true })

onMounted(async () => {
    // If editing, fetch existing data
    if (isEditing.value) {
        try {
            const estimate = await getEstimate(estimateId.value)
            if (estimate) {
                selectedCustomer.value = estimate.customer
                selectedVehicleId.value = estimate.vehicleId // This might need to adjust if API returns vehicle object but we bind to ID. 
                // The selector component likely emits ID but might accept vehicle object or ID. 
                // Checking previous code: CustomerVehicleSelector takes 'vehicleId' v-model. 
                // However, fetching vehicles usually depends on selectedCustomer. 
                // We'll need to ensure the selector hydrates correctly. 
                // For now, assuming setting ID is enough if the list loads. 

                // Map items
                items.value = estimate.items.map(i => ({
                    ...i,
                    // ensure numbers
                    price: Number(i.price),
                    quantity: Number(i.quantity)
                }))
                
                if (estimate.expiryDate) expiryDate.value = estimate.expiryDate
            }
        } catch (e) {
            console.error('Failed to load estimate for editing', e)
            toast.error('Failed to load estimate')
            router.push('/dashboard/estimates')
        }
        return // Skip local storage draft restoration if editing
    }

    const savedDraft = localStorage.getItem(STORAGE_KEY)
    if (savedDraft) {
        try {
            const parsed = JSON.parse(savedDraft)
            if (parsed.customer) selectedCustomer.value = parsed.customer
            if (parsed.vehicleId) selectedVehicleId.value = parsed.vehicleId
            if (parsed.items) items.value = parsed.items
            if (parsed.expiryDate) expiryDate.value = parsed.expiryDate
            
            toast.info('Draft restored from previous session')
        } catch (e) {
            console.error('Failed to parse draft', e)
        }
    }
})
</script>

<template>
  <div class="container mx-auto p-6 max-w-7xl animate-in fade-in duration-500">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div class="space-y-1">
        <h1 class="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <!-- Do not add icons for the page titles -->
            {{ isEditing ? 'Edit Estimate' : 'New Estimate' }}
        </h1>
        <p class="text-muted-foreground text-sm">Create a professional service quote for approval.</p>
      </div>
      <div class="flex gap-3">
        <Button variant="outline" @click="$router.back()">Cancel</Button>
        <Button 
            variant="secondary"
            @click="saveEstimate('DRAFT')" 
            :disabled="isSubmitting || !selectedCustomer || !selectedVehicleId || items.length === 0"
        >
            <Save class="w-4 h-4 mr-2" />
            Save Draft
        </Button>
        <Button 
            @click="saveEstimate('PENDING')" 
            :disabled="isSubmitting || !selectedCustomer || !selectedVehicleId || items.length === 0"
            class="min-w-[140px]"
        >
          <Loader2 v-if="isSubmitting" class="w-4 h-4 mr-2 animate-spin" />
          <Check v-else class="w-4 h-4 mr-2" />
          {{ isEditing ? 'Update Estimate' : 'Create Estimate' }}
        </Button>
      </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-8">
    
      <!-- Left Column: Estimate Builder (2/3) -->
      <div class="xl:col-span-2 space-y-6">
        <EstimateItemBuilder v-model:items="items" />
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
            v-model:expiryDate="expiryDate"
        />

      </div>
    </div>
  </div>
</template>
