<script setup>
import { ref, watch, computed, nextTick } from 'vue'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Loader2, Save, X, Plus } from 'lucide-vue-next'
import ImageUpload from '@/components/common/ImageUpload.vue'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import vehicleData from '@/data/vehicles.json'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  vehicle: {
    type: Object,
    default: () => ({}),
  },
  mode: {
    type: String,
    default: 'create', // or 'edit'
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const emits = defineEmits(['update:open', 'save', 'cancel'])

const isOpen = computed({
  get: () => props.open,
  set: (v) => emits('update:open', v),
})

const isSubmitting = ref(false)

// Local form state
const form = ref({
  customerId: '',
  licensePlate: '',
  make: '',
  model: '',
  year: '',
  vin: '',
  vehicleType: '',
  mileage: '',
  notes: '',
  color: '',
  imageUrl: '',
  imageFileId: '',
})

const predefinedVehicleTypes = [
  'Sedan',
  'SUV',
  'Truck',
  'Van',
  'Tricycle',
  'Motorcycle',
  'Jeepney'
]

const isCustomVehicleType = ref(false)
const customVehicleType = ref('')

// Make and Model State
const isCustomMake = ref(false)
const customMake = ref('')
const isCustomModel = ref(false)
const customModel = ref('')

const vehicleMakes = computed(() => vehicleData.map(v => v.brand).sort())
const vehicleModels = computed(() => {
  if (isCustomMake.value || !form.value.make) return []
  const brandData = vehicleData.find(v => v.brand === form.value.make)
  return brandData ? brandData.models.sort() : []
})

const handleVehicleTypeChange = (value) => {
  if (value === 'custom') {
    isCustomVehicleType.value = true
    form.value.vehicleType = ''
  } else {
    isCustomVehicleType.value = false
    form.value.vehicleType = value
  }
}

const handleMakeChange = (value) => {
  if (value === 'custom') {
    isCustomMake.value = true
    form.value.make = ''
    // If make is custom, model must be custom too (or just free text)
    isCustomModel.value = true
    form.value.model = ''
  } else {
    isCustomMake.value = false
    form.value.make = value
    // Reset model when make changes
    form.value.model = ''
    isCustomModel.value = false
  }
}

const handleModelChange = (value) => {
  if (value === 'custom') {
    isCustomModel.value = true
    form.value.model = ''
  } else {
    isCustomModel.value = false
    form.value.model = value
  }
}

// Populate when editing
watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      await nextTick()
      
      const v = props.vehicle || {}

      // 1. Extract values
      const type = v.vehicleType || v.type || ''
      const make = v.make || v.brand || ''
      const model = v.model || ''
      
      // 2. Handle Vehicle Type
      const isPredefinedType = predefinedVehicleTypes.includes(type)
      if (type && !isPredefinedType) {
        isCustomVehicleType.value = true
        customVehicleType.value = type
        form.value.vehicleType = ''
      } else {
        isCustomVehicleType.value = false
        customVehicleType.value = ''
        form.value.vehicleType = type
      }

      // 3. Handle Make
      // Ensure vehicleMakes is evaluated
      const makes = vehicleMakes.value
      const isPredefinedMake = makes.includes(make)
      
      if (make && !isPredefinedMake) {
        isCustomMake.value = true
        customMake.value = make
        form.value.make = ''
      } else {
        isCustomMake.value = false
        customMake.value = ''
        form.value.make = make
      }

      // 4. Handle Model
      // We need to set make first so vehicleModels computed works?
      // Actually vehicleModels depends on form.value.make.
      // So we must set form.value.make first.
      
      // Wait for make update to propagate to computed? 
      // Computed is synchronous dependency.
      
      if (isPredefinedMake) {
        // Check if model is in the list for this make
        const brandData = vehicleData.find(d => d.brand === make)
        const models = brandData ? brandData.models : []
        const isPredefinedModel = models.includes(model)
        
        if (model && !isPredefinedModel) {
          isCustomModel.value = true
          customModel.value = model
          form.value.model = ''
        } else {
          isCustomModel.value = false
          customModel.value = ''
          form.value.model = model
        }
      } else {
        // Custom make implies custom model
        isCustomModel.value = true
        customModel.value = model
        form.value.model = ''
      }

      // 5. Update other fields
      form.value.customerId = v.customerId || v.customer_id || ''
      form.value.licensePlate = v.licensePlate || v.plateNumber || v.plate_number || ''
      form.value.year = v.year || ''
      form.value.vin = v.vin || ''
      form.value.mileage = v.mileage || v.currentMileage || ''
      form.value.notes = v.notes || v.internalNotes || ''
      form.value.color = v.color || ''
      form.value.imageUrl = v.imageUrl || ''
      form.value.imageFileId = v.imageFileId || ''
    }
  },
  { immediate: true }
)

const errors = ref({})

const validate = () => {
  errors.value = {}
  if (!form.value.customerId || !String(form.value.customerId).trim()) errors.value.customerId = 'Customer ID is required.'
  if (!form.value.licensePlate || !form.value.licensePlate.trim()) errors.value.licensePlate = 'License plate is required.'
  
  // Validate Make
  if (isCustomMake.value) {
    if (!customMake.value.trim()) errors.value.make = 'Make is required'
  } else {
    if (!form.value.make || !form.value.make.trim()) errors.value.make = 'Make is required.'
  }

  // Validate Model
  if (isCustomModel.value) {
    if (!customModel.value.trim()) errors.value.model = 'Model is required'
  } else {
    if (!form.value.model || !form.value.model.trim()) errors.value.model = 'Model is required.'
  }

  // year and mileage are optional but if present should be numeric-ish
  if (form.value.year && isNaN(Number(form.value.year))) errors.value.year = 'Year must be a number.'
  if (form.value.mileage && isNaN(Number(form.value.mileage))) errors.value.mileage = 'Mileage must be a number.'
  
  // If custom vehicle type is selected, ensure it's not empty
  if (isCustomVehicleType.value && !customVehicleType.value.trim()) {
    errors.value.vehicleType = 'Please specify the vehicle type'
  }
  
  return Object.keys(errors.value).length === 0
}

const handleSave = async () => {
  if (!validate()) return
  
  isSubmitting.value = true
  
  // Apply custom values
  if (isCustomVehicleType.value) {
    form.value.vehicleType = customVehicleType.value
  }
  if (isCustomMake.value) {
    form.value.make = customMake.value
  }
  if (isCustomModel.value) {
    form.value.model = customModel.value
  }

  // Simulate a small delay for better UX or wait for actual API if passed as async
  try {
    // Emit a copy of the data
    emits('save', { ...form.value })
    // We don't close immediately here, the parent handles it or we wait for success
    // But based on current usage, parent closes it. 
    // Ideally parent should handle loading state, but for now we just emit.
  } finally {
    isSubmitting.value = false
  }
}

const handleCancel = () => {
  emits('cancel')
  isOpen.value = false
}
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="max-w-3xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle class="text-xl">{{ mode === 'edit' ? 'Edit Vehicle' : 'Add New Vehicle' }}</DialogTitle>
        <DialogDescription>
          {{ mode === 'edit' ? 'Update the vehicle details below.' : 'Register a new vehicle for this customer.' }}
        </DialogDescription>
      </DialogHeader>

      <div class="grid gap-6 py-4">
        <!-- Section 1: Vehicle Details -->
        <div class="space-y-4">
          <h3 class="text-sm font-medium text-muted-foreground uppercase tracking-wider">Vehicle Details</h3>
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-2">
              <Label for="licensePlate">License Plate <span class="text-destructive">*</span></Label>
              <Input 
                id="licensePlate" 
                v-model="form.licensePlate" 
                placeholder="ABC 1234"
                :class="{ 'border-destructive': errors.licensePlate }"
              />
              <p v-if="errors.licensePlate" class="text-xs text-destructive">{{ errors.licensePlate }}</p>
            </div>

            <div class="space-y-2">
              <Label for="vehicleType">Vehicle Type</Label>
              <div v-if="!isCustomVehicleType" class="flex gap-2">
                <Select :model-value="form.vehicleType" @update:model-value="handleVehicleTypeChange">
                  <SelectTrigger class="w-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="type in predefinedVehicleTypes" :key="type" :value="type">
                      {{ type }}
                    </SelectItem>
                    <Separator class="my-2" />
                    <SelectItem value="custom" class="text-primary font-medium">
                      <div class="flex items-center gap-2">
                        <Plus class="h-4 w-4" /> Add New Type
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div v-else class="flex gap-2">
                <Input 
                  v-model="customVehicleType" 
                  placeholder="Enter vehicle type" 
                  :class="{ 'border-destructive': errors.vehicleType }"
                />
                <Button variant="ghost" size="icon" @click="isCustomVehicleType = false">
                  <X class="h-4 w-4" />
                </Button>
              </div>
              <p v-if="errors.vehicleType" class="text-xs text-destructive">{{ errors.vehicleType }}</p>
            </div>

            <div class="space-y-2">
              <Label for="make">Make <span class="text-destructive">*</span></Label>
              <div v-if="!isCustomMake" class="flex gap-2">
                <Select :model-value="form.make" @update:model-value="handleMakeChange">
                  <SelectTrigger class="w-full" :class="{ 'border-destructive': errors.make }">
                    <SelectValue placeholder="Select make" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="make in vehicleMakes" :key="make" :value="make">
                      {{ make }}
                    </SelectItem>
                    <Separator class="my-2" />
                    <SelectItem value="custom" class="text-primary font-medium">
                      <div class="flex items-center gap-2">
                        <Plus class="h-4 w-4" /> Add New Make
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div v-else class="flex gap-2">
                <Input 
                  v-model="customMake" 
                  placeholder="Enter make" 
                  :class="{ 'border-destructive': errors.make }"
                />
                <Button variant="ghost" size="icon" @click="handleMakeChange('')">
                  <X class="h-4 w-4" />
                </Button>
              </div>
              <p v-if="errors.make" class="text-xs text-destructive">{{ errors.make }}</p>
            </div>

            <div class="space-y-2">
              <Label for="model">Model <span class="text-destructive">*</span></Label>
              <div v-if="!isCustomModel && vehicleModels.length > 0" class="flex gap-2">
                <Select :model-value="form.model" @update:model-value="handleModelChange">
                  <SelectTrigger class="w-full" :class="{ 'border-destructive': errors.model }">
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="model in vehicleModels" :key="model" :value="model">
                      {{ model }}
                    </SelectItem>
                    <Separator class="my-2" />
                    <SelectItem value="custom" class="text-primary font-medium">
                      <div class="flex items-center gap-2">
                        <Plus class="h-4 w-4" /> Add New Model
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div v-else class="flex gap-2">
                <Input 
                  v-model="customModel" 
                  placeholder="Enter model" 
                  :class="{ 'border-destructive': errors.model }"
                />
                <Button v-if="vehicleModels.length > 0" variant="ghost" size="icon" @click="handleModelChange('')">
                  <X class="h-4 w-4" />
                </Button>
              </div>
              <p v-if="errors.model" class="text-xs text-destructive">{{ errors.model }}</p>
            </div>

            <div class="space-y-2">
              <Label for="year">Year</Label>
              <Input 
                id="year" 
                v-model="form.year" 
                placeholder="e.g. 2023"
                :class="{ 'border-destructive': errors.year }"
              />
              <p v-if="errors.year" class="text-xs text-destructive">{{ errors.year }}</p>
            </div>

            <div class="space-y-2">
              <Label for="color">Color</Label>
              <Input id="color" v-model="form.color" placeholder="e.g. Pearl White" />
            </div>
          </div>
        </div>

        <Separator />

        <!-- Section 2: Technical Specs -->
        <div class="space-y-4">
          <h3 class="text-sm font-medium text-muted-foreground uppercase tracking-wider">Technical Specifications</h3>
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-2">
              <Label for="vin">VIN (Vehicle Identification Number)</Label>
              <Input id="vin" v-model="form.vin" placeholder="Optional" />
            </div>

            <div class="space-y-2">
              <Label for="mileage">Current Mileage (km)</Label>
              <Input 
                id="mileage" 
                v-model="form.mileage" 
                placeholder="e.g. 15000"
                :class="{ 'border-destructive': errors.mileage }"
              />
              <p v-if="errors.mileage" class="text-xs text-destructive">{{ errors.mileage }}</p>
            </div>
          </div>
        </div>

        <Separator />

        <!-- Section 3: Media -->
        <div class="space-y-4">
          <h3 class="text-sm font-medium text-muted-foreground uppercase tracking-wider">Media</h3>
          <ImageUpload 
            v-model="form.imageUrl" 
            label="Vehicle Image"
            folder="/vehicles"
            fileNamePrefix="vehicle"
            :error="errors.imageUrl"
            @update:error="(val) => errors.imageUrl = val"
            @update:fileId="(val) => form.imageFileId = val"
            @upload-start="isSubmitting = true"
            @upload-end="isSubmitting = false"
          />
        </div>

        <Separator />

        <!-- Section 4: Additional Info -->
        <div class="space-y-4">
          <h3 class="text-sm font-medium text-muted-foreground uppercase tracking-wider">Additional Information</h3>
          <div class="space-y-2">
            <Label for="notes">Internal Notes</Label>
            <Textarea 
              id="notes" 
              v-model="form.notes" 
              rows="3" 
              placeholder="Any specific notes about this vehicle..." 
              class="resize-none"
            />
          </div>
          <!-- Hidden Customer ID field -->
          <input type="hidden" v-model="form.customerId" />
        </div>
      </div>

      <DialogFooter class="gap-2 sm:gap-0">
        <Button variant="outline" @click="handleCancel">Cancel</Button>
        <Button @click="handleSave" :disabled="isSubmitting || loading" class="ml-2">
          <Loader2 v-if="isSubmitting || loading" class="mr-2 h-4 w-4 animate-spin" />
          <Save v-else class="mr-2 h-4 w-4" />
          {{ mode === 'edit' ? 'Save Changes' : 'Add Vehicle' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
