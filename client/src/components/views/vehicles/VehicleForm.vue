<script setup>
import { ref, watch, computed } from 'vue'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

const props = defineProps({
  modelValue: {
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
})

const emits = defineEmits(['update:modelValue', 'save', 'cancel'])

const open = computed({
  get: () => props.modelValue,
  set: (v) => emits('update:modelValue', v),
})

// Local form state
const form = ref({
  customerId: '',
  licensePlate: '',
  make: '',
  model: '',
  year: '',
  vin: '',
  vehicleType: '',
  currentMileage: '',
  internalNotes: '',
  color: '',
})

// Populate when editing
watch(
  () => props.vehicle,
  (v) => {
    form.value = {
      customerId: v?.customerId || v?.customer_id || '' ,
      licensePlate: v?.licensePlate || v?.plateNumber || v?.plate_number || '',
      make: v?.make || '',
      model: v?.model || '',
      year: v?.year || '',
      vin: v?.vin || '',
      vehicleType: v?.vehicleType || v?.type || '',
      currentMileage: v?.currentMileage || v?.mileage || '',
      internalNotes: v?.internalNotes || v?.notes || '',
      color: v?.color || '',
    }
  },
  { immediate: true }
)

const errors = ref({})

const validate = () => {
  errors.value = {}
  if (!form.value.customerId || !String(form.value.customerId).trim()) errors.value.customerId = 'Customer ID is required.'
  if (!form.value.licensePlate || !form.value.licensePlate.trim()) errors.value.licensePlate = 'License plate is required.'
  if (!form.value.make || !form.value.make.trim()) errors.value.make = 'Make is required.'
  if (!form.value.model || !form.value.model.trim()) errors.value.model = 'Model is required.'
  // year and currentMileage are optional but if present should be numeric-ish
  if (form.value.year && isNaN(Number(form.value.year))) errors.value.year = 'Year must be a number.'
  if (form.value.currentMileage && isNaN(Number(form.value.currentMileage))) errors.value.currentMileage = 'Mileage must be a number.'
  return Object.keys(errors.value).length === 0
}

const handleSave = () => {
  if (!validate()) return
  // Emit a copy of the data
  emits('save', { ...form.value })
  open.value = false
}

const handleCancel = () => {
  emits('cancel')
  open.value = false
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ mode === 'edit' ? 'Edit Vehicle' : 'Add Vehicle' }}</DialogTitle>
      </DialogHeader>

      <div class="grid grid-cols-1 gap-3">
        <div>
          <Label>Customer ID</Label>
          <Input v-model="form.customerId" />
          <p v-if="errors.customerId" class="text-sm text-destructive">{{ errors.customerId }}</p>
        </div>

        <div>
          <Label>License Plate</Label>
          <Input v-model="form.licensePlate" />
          <p v-if="errors.licensePlate" class="text-sm text-destructive">{{ errors.licensePlate }}</p>
        </div>

        <div>
          <Label>Make</Label>
          <Input v-model="form.make" />
          <p v-if="errors.make" class="text-sm text-destructive">{{ errors.make }}</p>
        </div>

        <div>
          <Label>Model</Label>
          <Input v-model="form.model" />
          <p v-if="errors.model" class="text-sm text-destructive">{{ errors.model }}</p>
        </div>

        <div>
          <Label>Year</Label>
          <Input v-model="form.year" />
          <p v-if="errors.year" class="text-sm text-destructive">{{ errors.year }}</p>
        </div>

        <div>
          <Label>Vehicle Type</Label>
          <Input v-model="form.vehicleType" placeholder="e.g. Sedan, SUV, Pickup" />
        </div>

        <div>
          <Label>Current Mileage</Label>
          <Input v-model="form.currentMileage" />
          <p v-if="errors.currentMileage" class="text-sm text-destructive">{{ errors.currentMileage }}</p>
        </div>

        <div>
          <Label>Color</Label>
          <Input v-model="form.color" />
        </div>

        <div>
          <Label>VIN (optional)</Label>
          <Input v-model="form.vin" />
        </div>

        <div>
          <Label>Internal Notes</Label>
          <textarea v-model="form.internalNotes" rows="3" class="w-full rounded-md border px-3 py-2 text-base"></textarea>
        </div>
      </div>

      <DialogFooter class="flex justify-end gap-2 mt-4">
        <Button variant="outline" @click="handleCancel">Cancel</Button>
        <Button @click="handleSave">{{ mode === 'edit' ? 'Save Changes' : 'Add Vehicle' }}</Button>
      </DialogFooter>
      <DialogClose />
    </DialogContent>
  </Dialog>
</template>
