<script setup>
import { ref } from 'vue'
import { Plus, Loader2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { toast } from 'vue-sonner'
import { restockItem } from '@/api/inventory'

const props = defineProps({
  item: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['restock-success'])

const isOpen = ref(false)
const quantityToAdd = ref(1)
const isSubmitting = ref(false)

const handleRestock = async () => {
  if (quantityToAdd.value < 1) return

  isSubmitting.value = true
  try {
    const updatedItem = await restockItem(props.item.id, quantityToAdd.value)
    toast.success(`Restocked ${updatedItem.name}`, {
      description: `Added ${quantityToAdd.value} units. New quantity: ${updatedItem.quantity}`
    })
    emit('restock-success', updatedItem)
    isOpen.value = false
    quantityToAdd.value = 1
  } catch (error) {
    toast.error('Restock Failed', {
      description: 'Could not update stock quantity.'
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <Popover v-model:open="isOpen">
    <PopoverTrigger as-child>
      <Button 
        variant="outline" 
        size="icon" 
        class="h-8 w-8 rounded-full border-dashed border-primary/60 hover:border-primary hover:bg-primary/10 text-primary transition-all shadow-sm"
      >
        <Plus class="h-4 w-4" />
        <span class="sr-only">Quick Restock</span>
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-60">
      <div class="grid gap-4">
        <div class="space-y-2">
          <h4 class="font-medium leading-none">Quick Restock</h4>
          <p class="text-xs text-muted-foreground">
            Add stock for {{ item.name }}
          </p>
        </div>
        <div class="flex items-end gap-2">
          <div class="grid flex-1 gap-2">
            <Label htmlFor="quantity" class="sr-only">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              v-model="quantityToAdd"
              class="h-8"
            />
          </div>
          <Button size="sm" class="h-8" @click="handleRestock" :disabled="isSubmitting">
            <Loader2 v-if="isSubmitting" class="h-3 w-3 animate-spin" />
            <span v-else>Add</span>
          </Button>
        </div>
      </div>
    </PopoverContent>
  </Popover>
</template>
