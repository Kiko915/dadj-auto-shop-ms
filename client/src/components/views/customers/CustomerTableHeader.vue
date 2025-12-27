<script setup lang="ts">
import { computed } from 'vue'
import { Checkbox } from '@/components/ui/checkbox'

interface Props {
  isAllSelected: boolean
  isIndeterminate: boolean
}

interface Emits {
  (e: 'toggle-select-all'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const checkboxValue = computed(() => {
  if (props.isIndeterminate) return 'indeterminate'
  return props.isAllSelected
})

const handleCheckboxChange = () => {
  emit('toggle-select-all')
}
</script>

<template>
  <div class="grid grid-cols-[auto_120px_1fr_150px_200px_120px_100px_80px] gap-4 border-b p-4 font-medium text-sm">
    <Checkbox 
      :model-value="checkboxValue" 
      @update:model-value="handleCheckboxChange" 
    />
    <div>Customer ID</div>
    <div>Name</div>
    <div>Phone</div>
    <div>Email</div>
    <div>Loyalty Status</div>
    <div>Total Vehicles</div>
    <div>Actions</div>
  </div>
</template>
