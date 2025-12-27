<script setup>
import { ref } from 'vue'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { IconButton } from '@/components/ui/button'
import VehicleForm from './VehicleForm.vue'

const props = defineProps({
  vehicles: {
    type: Array,
    default: () => [],
  },
})

const emits = defineEmits(['create', 'edit', 'delete'])

const isFormOpen = ref(false)
const formMode = ref('create')
const editingVehicle = ref(null)

const openCreate = () => {
  formMode.value = 'create'
  editingVehicle.value = null
  isFormOpen.value = true
}

const openEdit = (vehicle) => {
  formMode.value = 'edit'
  editingVehicle.value = { ...vehicle }
  isFormOpen.value = true
}

const handleSave = (payload) => {
  if (formMode.value === 'create') {
    emits('create', payload)
  } else {
    // include id if editing
    emits('edit', { ...editingVehicle.value, ...payload })
  }
}

const handleDelete = (vehicle) => {
  emits('delete', vehicle)
}
</script>

<template>
  <Card>
    <CardHeader class="flex items-center justify-between">
      <CardTitle>Vehicles</CardTitle>
      <div>
        <Button size="sm" @click="openCreate">Add Vehicle</Button>
      </div>
    </CardHeader>
    <CardContent>
      <div class="space-y-3">
        <div v-if="!vehicles || vehicles.length === 0" class="text-sm text-muted-foreground">No vehicles added yet.</div>

        <div v-for="v in vehicles" :key="v.id || v.licensePlate || v.plateNumber" class="flex items-center justify-between p-3 border rounded-md">
          <div>
            <div class="font-medium">{{ v.make }} {{ v.model }} <span class="text-muted-foreground">({{ v.year }})</span></div>
            <div class="text-sm text-muted-foreground">Plate: {{ v.licensePlate || v.plateNumber }} • Type: {{ v.vehicleType || v.type || '—' }} • Mileage: {{ v.currentMileage || '—' }} <span v-if="v.vin">• VIN: {{ v.vin }}</span></div>
          </div>
          <div class="flex items-center gap-2">
            <Button size="sm" variant="outline" @click.prevent="openEdit(v)">Edit</Button>
            <Button size="sm" variant="destructive" @click.prevent="handleDelete(v)">Delete</Button>
          </div>
        </div>
      </div>
    </CardContent>

    <VehicleForm
      v-model:open="isFormOpen"
      :vehicle="editingVehicle"
      :mode="formMode"
      @save="handleSave"
      @cancel="() => (isFormOpen = false)"
    />
  </Card>
</template>
