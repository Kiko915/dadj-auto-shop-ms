<script setup lang="ts">
import { AlertTriangle } from 'lucide-vue-next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface Props {
  open: boolean
  selectedCount: number
  isDeleting: boolean
}

interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'confirm'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Delete Customers</DialogTitle>
        <DialogDescription>
          This action cannot be undone.
        </DialogDescription>
      </DialogHeader>
      
      <div class="flex items-start gap-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <div class="rounded-full bg-destructive/10 p-2">
          <AlertTriangle class="h-5 w-5 text-destructive" />
        </div>
        <div class="flex-1 space-y-2">
          <p class="text-sm font-medium">
            You are about to delete {{ selectedCount }} {{ selectedCount === 1 ? 'customer' : 'customers' }}
          </p>
          <p class="text-sm text-muted-foreground">
            This will permanently delete the selected customer{{ selectedCount === 1 ? '' : 's' }} and all associated data.
          </p>
        </div>
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          @click="emit('update:open', false)"
          :disabled="isDeleting"
        >
          Cancel
        </Button>
        <Button
          variant="destructive"
          @click="emit('confirm')"
          :disabled="isDeleting"
        >
          {{ isDeleting ? 'Deleting...' : 'Delete' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
