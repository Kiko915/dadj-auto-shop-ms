<script setup>
import { ref, watch } from 'vue'
import { 
  Sheet, 
  SheetContent, 
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Car, 
  Calendar, 
  Edit,
  Trash2,
  Image as ImageIcon,
  Info,
  Hash,
  Gauge,
  Palette,
  FileText
} from 'lucide-vue-next'
import { getVehicle } from '@/api/vehicles'

const props = defineProps({
  open: Boolean,
  vehicleId: [String],
  vehicle: [Object], // Optional: pass vehicle object directly to avoid fetch if desired, but we'll fetch for freshness
  readonly: Boolean
})

const emit = defineEmits(['update:open', 'edit', 'delete'])

const item = ref(null)
const isLoading = ref(false)
const error = ref(null)
const resetTimeout = ref(null)

const fetchVehicleDetails = async () => {
  // If we have a vehicle object passed and no ID (or same ID), we could use it.
  // But let's prefer fetching for latest data if ID is present.
  if (!props.vehicleId) {
    if (props.vehicle) {
      item.value = props.vehicle
      return
    }
    return
  }
  
  isLoading.value = true
  error.value = null
  try {
    const response = await getVehicle(props.vehicleId)
    item.value = response.vehicle
  } catch (err) {
    console.error('Failed to fetch vehicle details:', err)
    error.value = 'Failed to load vehicle details.'
  } finally {
    isLoading.value = false
  }
}

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    if (resetTimeout.value) {
      clearTimeout(resetTimeout.value)
      resetTimeout.value = null
    }
    fetchVehicleDetails()
  } else {
    // Reset state when closed
    if (resetTimeout.value) clearTimeout(resetTimeout.value)
    
    resetTimeout.value = setTimeout(() => {
      item.value = null
      error.value = null
      resetTimeout.value = null
    }, 300)
  }
})

import formatDate from '@/utils/formatDate'
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
        <Info class="h-12 w-12 text-destructive/50" />
        <p class="text-destructive font-medium">{{ error }}</p>
        <Button variant="outline" @click="fetchVehicleDetails">Try Again</Button>
      </div>

      <!-- Content -->
      <div v-else-if="item" class="flex flex-col h-full">
        <!-- Hero Image Section -->
        <div class="relative h-64 w-full bg-muted flex items-center justify-center overflow-hidden">
          <img 
            v-if="item.imageUrl" 
            :src="item.imageUrl" 
            :alt="`${item.make} ${item.model}`" 
            class="h-full w-full object-cover"
          />
          <Car v-else class="h-16 w-16 text-muted-foreground/30" />
          
          <!-- Floating Status Badge -->
          <div class="absolute top-4 right-4">
            <Badge 
              variant="secondary" 
              class="px-3 py-1 text-sm font-medium shadow-lg backdrop-blur-md bg-background/80"
            >
              {{ item.year || 'N/A' }}
            </Badge>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto">
          <div class="p-6 space-y-8">
            <!-- Header Info -->
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-sm font-bold tracking-wider text-primary uppercase">{{ item.make }}</span>
                <Badge variant="outline" class="text-xs">{{ item.vehicleType || 'Unknown Type' }}</Badge>
              </div>
              <h2 class="text-3xl font-bold leading-tight text-foreground">{{ item.model }}</h2>
              <div class="flex items-center gap-2 text-muted-foreground">
                <div class="px-2 py-1 bg-muted rounded text-sm font-mono font-medium text-foreground">
                  {{ item.licensePlate }}
                </div>
              </div>
            </div>

            <!-- Key Stats Grid -->
            <div class="grid grid-cols-2 gap-4">
              <div class="p-4 rounded-xl bg-muted/50 border border-border/50 space-y-1">
                <div class="flex items-center gap-2 text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  <Gauge class="h-3.5 w-3.5" /> Mileage
                </div>
                <div class="flex items-baseline gap-1">
                  <span class="text-2xl font-bold tabular-nums">{{ item.mileage ? item.mileage.toLocaleString() : '—' }}</span>
                  <span class="text-sm text-muted-foreground">km</span>
                </div>
              </div>

              <div class="p-4 rounded-xl bg-muted/50 border border-border/50 space-y-1">
                <div class="flex items-center gap-2 text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  <Palette class="h-3.5 w-3.5" /> Color
                </div>
                <div class="flex items-baseline gap-1">
                  <span class="text-lg font-medium text-foreground">{{ item.color || 'N/A' }}</span>
                </div>
              </div>
            </div>

            <!-- Details List -->
            <div class="space-y-6">
              <!-- VIN -->
              <div v-if="item.vin" class="flex items-center justify-between p-3 rounded-lg border border-dashed border-border bg-background">
                <div class="flex items-center gap-3">
                  <div class="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
                    <Hash class="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div class="space-y-0.5">
                    <p class="text-xs text-muted-foreground font-medium">VIN (Vehicle Identification Number)</p>
                    <p class="font-mono text-sm font-bold">{{ item.vin }}</p>
                  </div>
                </div>
              </div>

              <!-- Notes -->
              <div v-if="item.notes" class="space-y-3">
                <h3 class="text-sm font-semibold flex items-center gap-2">
                  <FileText class="h-4 w-4 text-primary" /> Notes
                </h3>
                <p class="text-sm leading-relaxed text-muted-foreground bg-muted/30 p-4 rounded-lg">
                  {{ item.notes }}
                </p>
              </div>

              <!-- Metadata -->
              <div class="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar class="h-3.5 w-3.5" />
                <span>Registered on {{ formatDate(item.dateRegistered) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div v-if="!readonly" class="p-6 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
