<script setup>
import { ref } from 'vue'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, AlertTriangle } from 'lucide-vue-next'

const props = defineProps({
  open: {
    type: Boolean,
    required: true
  },
  item: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:open', 'confirm'])

const isDeleting = ref(false)

const handleConfirm = async () => {
  isDeleting.value = true
  try {
    await emit('confirm', props.item)
  } finally {
    isDeleting.value = false
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="(val) => $emit('update:open', val)">
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <div class="flex items-center gap-4">
          <div class="p-3 rounded-full bg-red-100 text-red-600">
            <AlertTriangle class="h-6 w-6" />
          </div>
          <div class="space-y-1">
            <DialogTitle>Delete Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span class="font-medium text-foreground">{{ item?.name }}</span>? This action cannot be undone.
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>
      <DialogFooter class="mt-4">
        <Button variant="outline" @click="$emit('update:open', false)" :disabled="isDeleting">
          Cancel
        </Button>
        <Button variant="destructive" @click="handleConfirm" :disabled="isDeleting">
          <Loader2 v-if="isDeleting" class="mr-2 h-4 w-4 animate-spin" />
          Delete
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
