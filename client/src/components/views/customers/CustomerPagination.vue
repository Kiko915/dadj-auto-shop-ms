<script setup lang="ts">
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

interface Props {
  currentPage: number
  totalPages: number
  startItem: number
  endItem: number
  totalItems: number
}

interface Emits {
  (e: 'previous'): void
  (e: 'next'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()
</script>

<template>
  <div class="flex items-center justify-between">
    <p class="text-sm text-muted-foreground">
      Showing {{ startItem }}-{{ endItem }} of {{ totalItems }} customers
    </p>
    <div class="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        @click="emit('previous')"
        :disabled="currentPage === 1"
      >
        <ChevronLeft class="h-4 w-4" />
        Previous
      </Button>
      <span class="text-sm">
        Page {{ currentPage }} of {{ totalPages }}
      </span>
      <Button
        variant="outline"
        size="sm"
        @click="emit('next')"
        :disabled="currentPage === totalPages"
      >
        Next
        <ChevronRight class="h-4 w-4" />
      </Button>
    </div>
  </div>
</template>
