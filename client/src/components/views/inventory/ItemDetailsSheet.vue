<script setup>
import { ref, watch } from 'vue'
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetFooter
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Package, 
  Tag, 
  DollarSign, 
  AlertTriangle, 
  Calendar, 
  Barcode,
  Edit,
  Trash2,
  Image as ImageIcon,
  Copy,
  Check
} from 'lucide-vue-next'
import { getInventoryItem } from '@/api/inventory'

const props = defineProps({
  open: Boolean,
  itemId: [Number, String]
})

const emit = defineEmits(['update:open', 'edit', 'delete'])

const item = ref(null)
const isLoading = ref(false)
const error = ref(null)

const fetchItemDetails = async () => {
  if (!props.itemId) return
  
  isLoading.value = true
  error.value = null
  try {
    item.value = await getInventoryItem(props.itemId)
  } catch (err) {
    console.error('Failed to fetch item details:', err)
    error.value = 'Failed to load item details.'
  } finally {
    isLoading.value = false
  }
}

watch(() => props.open, (isOpen) => {
  if (isOpen && props.itemId) {
    fetchItemDetails()
  } else {
    // Reset state when closed
    setTimeout(() => {
      item.value = null
      error.value = null
    }, 300)
  }
})

// Local formatter if utility doesn't exist
const formatMoney = (amount) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP'
  }).format(amount)
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
const copied = ref(false)
const copySku = async () => {
  if (item.value?.sku) {
    await navigator.clipboard.writeText(item.value.sku)
    copied.value = true
    setTimeout(() => copied.value = false, 2000)
  }
}
</script>

<template>
  <Sheet :open="open" @update:open="(val) => $emit('update:open', val)">
    <SheetContent class="w-full sm:max-w-lg overflow-y-auto p-0 gap-0">
      <!-- Loading State -->
      <div v-if="isLoading" class="flex flex-col items-center justify-center h-full space-y-4">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p class="text-sm text-muted-foreground">Loading details...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="flex flex-col items-center justify-center h-full space-y-4 text-center p-6">
        <AlertTriangle class="h-12 w-12 text-destructive/50" />
        <p class="text-destructive font-medium">{{ error }}</p>
        <Button variant="outline" @click="fetchItemDetails">Try Again</Button>
      </div>

      <!-- Content -->
      <div v-else-if="item" class="flex flex-col h-full">
        <!-- Hero Image Section -->
        <div class="relative h-64 w-full bg-muted flex items-center justify-center overflow-hidden">
          <img 
            v-if="item.imageUrl" 
            :src="item.imageUrl" 
            :alt="item.name" 
            class="h-full w-full object-cover"
          />
          <ImageIcon v-else class="h-16 w-16 text-muted-foreground/30" />
          
          <!-- Floating Status Badge -->
          <div class="absolute top-4 right-4">
            <Badge 
              :variant="item.quantity <= item.lowStockThreshold ? 'destructive' : 'secondary'" 
              class="px-3 py-1 text-sm font-medium shadow-lg backdrop-blur-md"
              :class="item.quantity > item.lowStockThreshold ? 'bg-green-500/90 text-white hover:bg-green-600' : ''"
            >
              {{ item.quantity <= item.lowStockThreshold ? 'Low Stock' : 'In Stock' }}
            </Badge>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto">
          <div class="p-6 space-y-8">
            <!-- Header Info -->
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-sm font-bold tracking-wider text-primary uppercase">{{ item.brand }}</span>
                <Badge variant="outline" class="text-xs">{{ item.category }}</Badge>
              </div>
              <h2 class="text-3xl font-bold leading-tight text-foreground">{{ item.name }}</h2>
            </div>

            <!-- Key Stats Grid -->
            <div class="grid grid-cols-2 gap-4">
              <div class="p-4 rounded-xl bg-muted/50 border border-border/50 space-y-1">
                <div class="flex items-center gap-2 text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  <Package class="h-3.5 w-3.5" /> Stock Level
                </div>
                <div class="flex items-baseline gap-1">
                  <span class="text-2xl font-bold tabular-nums">{{ item.quantity }}</span>
                  <span class="text-sm text-muted-foreground">units</span>
                </div>
                <div class="h-1.5 w-full bg-border/50 rounded-full overflow-hidden mt-2">
                  <div 
                    class="h-full rounded-full transition-all duration-500"
                    :class="item.quantity <= item.lowStockThreshold ? 'bg-destructive' : 'bg-green-500'"
                    :style="{ width: `${Math.min((item.quantity / (item.lowStockThreshold * 3)) * 100, 100)}%` }"
                  />
                </div>
              </div>

              <div class="p-4 rounded-xl bg-muted/50 border border-border/50 space-y-1">
                <div class="flex items-center gap-2 text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  <DollarSign class="h-3.5 w-3.5" /> Selling Price
                </div>
                <div class="flex items-baseline gap-1">
                  <span class="text-2xl font-bold text-primary tabular-nums">{{ formatMoney(item.sellingPrice) }}</span>
                </div>
                <p class="text-xs text-muted-foreground mt-1">
                  Cost: {{ formatMoney(item.buyingPrice) }}
                </p>
              </div>
            </div>

            <!-- SKU & Details -->
            <div class="space-y-6">
              <div v-if="item.sku" class="flex items-center justify-between p-3 rounded-lg border border-dashed border-border bg-background">
                <div class="flex items-center gap-3">
                  <div class="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
                    <Barcode class="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div class="space-y-0.5">
                    <p class="text-xs text-muted-foreground font-medium">SKU / Part Number</p>
                    <p class="font-mono text-sm font-bold">{{ item.sku }}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" class="h-8 w-8 text-muted-foreground hover:text-foreground" @click="copySku">
                  <Check v-if="copied" class="h-4 w-4 text-green-500" />
                  <Copy v-else class="h-4 w-4" />
                </Button>
              </div>

              <div v-if="item.description" class="space-y-3">
                <h3 class="text-sm font-semibold flex items-center gap-2">
                  <Tag class="h-4 w-4 text-primary" /> Description
                </h3>
                <p class="text-sm leading-relaxed text-muted-foreground bg-muted/30 p-4 rounded-lg">
                  {{ item.description }}
                </p>
              </div>

              <div class="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar class="h-3.5 w-3.5" />
                <span>Last updated on {{ formatDate(item.updatedAt) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="p-6 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div class="flex gap-3">
            <Button class="flex-1" variant="outline" @click="$emit('edit', item)">
              <Edit class="mr-2 h-4 w-4" /> Edit Details
            </Button>
            <Button variant="destructive" size="icon" @click="$emit('delete', item)">
              <Trash2 class="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </SheetContent>
  </Sheet>
</template>
