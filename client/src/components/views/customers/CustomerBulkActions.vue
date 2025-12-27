<script setup lang="ts">
import { X, Trash2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'

interface Props {
  selectedCount: number
}

interface Emits {
  (e: 'clear-selection'): void
  (e: 'delete-selected'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()
</script>

<template>
  <section v-if="selectedCount > 0" class="flex items-center justify-between rounded-lg border border-primary bg-primary/10 p-4">
    <div class="flex items-center gap-3">
      <Checkbox :model-value="true" disabled class="pointer-events-none" />
      <span class="text-sm font-medium">
        {{ selectedCount }} {{ selectedCount === 1 ? 'customer' : 'customers' }} selected
      </span>
    </div>
    <div class="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        @click="emit('clear-selection')"
      >
        <X class="mr-2 h-4 w-4" />
        Clear Selection
      </Button>
      <Button
        variant="destructive"
        size="sm"
        @click="emit('delete-selected')"
      >
        <Trash2 class="mr-2 h-4 w-4" />
        Delete Selected
      </Button>
    </div>
  </section>
</template>
