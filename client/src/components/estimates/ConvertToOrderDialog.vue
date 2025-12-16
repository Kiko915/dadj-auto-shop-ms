<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AlertCircle, CheckCircle2, AlertTriangle, User, Calendar as CalendarIcon, Gauge, Wrench, PackageCheck, Loader2, Info, Check, X, BadgePercent } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { useForm } from 'vee-validate'
import * as z from 'zod'
import { toTypedSchema } from '@vee-validate/zod'
import { createServiceOrder } from '@/api/serviceOrders'
import { getMechanics } from '@/api/users'
import { toast } from 'vue-sonner'


const props = defineProps({
  open: Boolean,
  estimate: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:open', 'success'])

const mechanics = ref([])
const loadingMechanics = ref(false)
const isSubmitting = ref(false)

// Inventory Check Logic
const inventoryStatus = computed(() => {
  if (!props.estimate?.items) return []
  
  return props.estimate.items
    .filter(item => item.type === 'PART' && item.inventoryItem)
    .map(item => {
      const stock = item.inventoryItem.quantity || 0
      const needed = item.quantity
      const isSufficient = stock >= needed
      
      return {
        ...item,
        stock,
        isSufficient
      }
    })
})

const hasInventoryIssues = computed(() => {
  return inventoryStatus.value.some(item => !item.isSufficient)
})

// Form Validation
const formSchema = toTypedSchema(z.object({
  estimatedCompletion: z.string().min(1, 'Completion date is required'),
  mechanicId: z.string().optional(),
  odometer: z.coerce.number().min(0, 'Odometer must be non-negative').optional()
}))

const { handleSubmit, errors, setFieldValue, values } = useForm({
  validationSchema: formSchema,
  initialValues: {
    odometer: props.estimate?.vehicle?.mileage || 0
  }
})

// Fetch Mechanics
const fetchMechanics = async () => {
    loadingMechanics.value = true
    try {
        mechanics.value = await getMechanics()
    } catch (error) {
        console.error('Failed to fetch mechanics', error)
        toast.error('Failed to load mechanics list')
    } finally {
        loadingMechanics.value = false
    }
}

onMounted(() => {
    if (props.open) {
        fetchMechanics()
    }
})

// Initial fetch when dialog opens (handled by parent v-if usually, but we can watch prop)

watch(() => props.open, (newVal) => {
    if (newVal) {
        fetchMechanics()
        setFieldValue('odometer', props.estimate?.vehicle?.mileage || 0)
    }
})

const onSubmit = handleSubmit(async (values) => {
    isSubmitting.value = true
    try {
        await createServiceOrder({
            estimateId: props.estimate.id,
            mechanicId: values.mechanicId,
            odometer: values.odometer,
            estimatedCompletion: values.estimatedCompletion,
            estimatedCompletion: values.estimatedCompletion,
            discount: props.estimate.discount ?? 0,
            discountReason: props.estimate.discountReason ?? ''
        })
        
        toast.success(`Service Order created successfully!`)
        emit('update:open', false)
        emit('success')
    } catch (error) {
        console.error('Conversion error', error)
        if (error.response?.status === 409) {
             toast.error('A Service Order already exists for this estimate')
        } else {
             toast.error('Failed to convert estimate')
        }
    } finally {
        isSubmitting.value = false
    }
})
</script>

<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="sm:max-w-[650px] p-0 overflow-hidden gap-0">
      <DialogHeader class="px-6 py-4 bg-muted/40 border-b">
        <DialogTitle class="flex items-center gap-2 text-xl">
          <Wrench class="h-5 w-5 text-primary" />
          Convert to Service Order
        </DialogTitle>
        <DialogDescription>
          Creating a new job for 
          <span class="font-medium text-foreground">{{ estimate.vehicle?.make }} {{ estimate.vehicle?.model }}</span> 
          owned by 
          <span class="font-medium text-foreground">{{ estimate.customer?.firstName }} {{ estimate.customer?.lastName }}</span>
        </DialogDescription>
      </DialogHeader>

      <div class="px-6 py-6 space-y-8">
        <!-- Step 1: Operational Details -->
        <div class="space-y-4">
            <div class="flex items-center gap-2 text-primary font-medium border-b pb-2">
                <CalendarIcon class="h-4 w-4" />
                <h3>Operational Schedule</h3>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Estimated Completion -->
                <div class="space-y-2.5">
                    <Label for="completion" class="text-xs font-semibold uppercase text-muted-foreground tracking-wide">Est. Completion</Label>
                    <div class="relative">
                        <Input 
                            id="completion" 
                            type="datetime-local" 
                            :class="{'border-destructive focus-visible:ring-destructive': errors.estimatedCompletion}"
                            class="h-10"
                            @input="setFieldValue('estimatedCompletion', $event.target.value)"
                        />
                    </div>
                    <span v-if="errors.estimatedCompletion" class="text-xs text-destructive font-medium">{{ errors.estimatedCompletion }}</span>
                </div>

                <!-- Mechanic Assignment -->
                <div class="space-y-2.5">
                    <Label for="mechanic" class="text-xs font-semibold uppercase text-muted-foreground tracking-wide">Assign Mechanic</Label>
                    <Select @update:modelValue="setFieldValue('mechanicId', $event)">
                        <SelectTrigger class="h-10">
                            <SelectValue placeholder="Select a mechanic (Optional)" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem v-for="mech in mechanics" :key="mech.id" :value="mech.id">
                                <div class="flex items-center gap-3">
                                    <div class="h-6 w-6 rounded-full overflow-hidden bg-muted flex items-center justify-center border">
                                        <img v-if="mech.profilePicture" :src="mech.profilePicture" class="h-full w-full object-cover" />
                                        <User v-else class="h-3 w-3 text-muted-foreground" />
                                    </div>
                                    <span class="font-medium">{{ mech.name }}</span>
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

             <div class="space-y-2.5">
                <Label for="odometer" class="text-xs font-semibold uppercase text-muted-foreground tracking-wide">Vehicle Info</Label>
                <div class="flex items-start gap-4 p-3 bg-muted/30 rounded-lg border">
                    <div class="p-2 bg-background rounded-md border shadow-sm">
                        <Gauge class="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div class="flex-1 space-y-1">
                        <Label for="odometer" class="text-sm font-medium">Current Odometer Reading</Label>
                        <div class="flex items-center gap-2">
                            <Input 
                                id="odometer" 
                                type="number" 
                                class="h-9 w-40 bg-background"
                                :value="values.odometer" 
                                @input="setFieldValue('odometer', $event.target.value)" 
                            />
                            <span class="text-sm text-muted-foreground">km</span>
                        </div>
                         <p class="text-[11px] text-muted-foreground">
                            Last recorded: <span class="font-medium">{{ estimate.vehicle?.mileage || 0 }} km</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Discount Info (if any) -->
        <div v-if="estimate.discount > 0" class="flex items-start gap-4 p-3 bg-red-50/50 rounded-lg border border-red-100">
            <div class="p-2 bg-white rounded-md border border-red-100 shadow-sm text-red-600">
                 <BadgePercent class="h-5 w-5" />
            </div>
            <div class="flex-1 space-y-1">
                <Label class="text-sm font-medium text-red-900">Discount Applied</Label>
                <div class="flex items-center gap-2 text-sm text-red-700">
                    <span class="font-bold">- ₱{{ estimate.discount }}</span>
                    <span v-if="estimate.discountReason" class="text-red-600/80">({{ estimate.discountReason }})</span>
                </div>
            </div>
        </div>

        <!-- Step 2: Inventory Safety Check -->
        <div v-if="inventoryStatus.length > 0" class="space-y-4">
            <div class="flex items-center justify-between border-b pb-2">
                 <div class="flex items-center gap-2 text-primary font-medium">
                    <PackageCheck class="h-4 w-4" />
                    <h3>Inventory Check</h3>
                </div>
                 <Badge :variant="hasInventoryIssues ? 'destructive' : 'default'" class="rounded-full px-3">
                    <component :is="hasInventoryIssues ? AlertTriangle : CheckCircle2" class="h-3 w-3 mr-1.5" />
                    {{ hasInventoryIssues ? 'Stock Issues Detected' : 'All Parts Available' }}
                </Badge>
            </div>

            <div class="bg-muted/20 rounded-lg border divide-y overflow-hidden">
                <div v-for="item in inventoryStatus" :key="item.id" class="flex items-center justify-between p-3 hover:bg-muted/40 transition-colors">
                    <div class="flex items-center gap-3">
                        <div class="h-8 w-8 rounded-full flex items-center justify-center shrink-0"
                            :class="item.isSufficient ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'"
                        >
                             <component :is="item.isSufficient ? Check : X" class="h-4 w-4" />
                        </div>
                        <div>
                            <p class="text-sm font-medium leading-none" :class="{'text-destructive': !item.isSufficient}">{{ item.name }}</p>
                            <p class="text-xs text-muted-foreground mt-1">Required: {{ item.quantity }} units</p>
                        </div>
                    </div>
                    <div class="text-right">
                         <div class="text-xs font-semibold px-2 py-1 rounded border"
                            :class="item.isSufficient ? 'bg-background border-border text-muted-foreground' : 'bg-red-50 border-red-200 text-red-700'"
                        >
                            Stock: {{ item.stock }}
                        </div>
                    </div>
                </div>
            </div>
             <p v-if="hasInventoryIssues" class="text-xs flex items-center gap-1.5 bg-yellow-50/50 p-2 rounded text-yellow-700 border border-yellow-100">
                <Info class="h-3 w-3" />
                Note: Creating this order will allocate parts. Please ensure stock is replenished.
            </p>
        </div>
      </div>

      <DialogFooter class="px-6 py-4 bg-muted/40 border-t flex items-center justify-between sm:justify-between">
        <div class="text-xs text-muted-foreground hidden sm:block">
            <!-- Optional footer text -->
        </div>
        <div class="flex gap-2">
            <Button variant="outline" @click="$emit('update:open', false)">Cancel</Button>
            <Button @click="onSubmit" :disabled="isSubmitting" class="bg-primary hover:bg-primary/90 shadow-sm min-w-[140px]">
                <Loader2 v-if="isSubmitting" class="h-4 w-4 mr-2 animate-spin" />
                {{ isSubmitting ? 'Processing...' : 'Confirm & Create' }}
            </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
