<script setup>
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-vue-next'

const props = defineProps({
  open: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: 'Are you sure?'
  },
  description: {
    type: String,
    default: 'This action cannot be undone.'
  },
  confirmText: {
    type: String,
    default: 'Confirm'
  },
  cancelText: {
    type: String,
    default: 'Cancel'
  },
  variant: {
    type: String,
    default: 'default', // 'default' | 'destructive'
    validator: (value) => ['default', 'destructive'].includes(value)
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:open', 'confirm', 'cancel'])

const handleConfirm = () => {
  emit('confirm')
}

const handleCancel = () => {
  emit('update:open', false)
  emit('cancel')
}
</script>

<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <div class="flex items-center gap-2">
          <div v-if="variant === 'destructive'" class="p-2 rounded-full bg-red-100 text-red-600">
            <AlertTriangle class="h-5 w-5" />
          </div>
          <DialogTitle>{{ title }}</DialogTitle>
        </div>
        <DialogDescription class="pt-2">
          {{ description }}
        </DialogDescription>
      </DialogHeader>
      
      <DialogFooter class="mt-4">
        <Button 
          variant="outline" 
          @click="handleCancel" 
          :disabled="loading"
        >
          {{ cancelText }}
        </Button>
        <Button 
          :variant="variant" 
          @click="handleConfirm" 
          :disabled="loading"
        >
          {{ loading ? 'Processing...' : confirmText }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
