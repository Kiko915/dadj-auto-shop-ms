<script setup lang="ts">
import { Eye } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { ComputedRef } from 'vue'

interface Customer {
  id: string
  firstName: string
  middleName?: string | null
  lastName: string
  suffix?: string | null
  email: string
  phoneNumber: string
  loyaltyStatus: 'Loyal' | 'Regular' | 'VIP'
  totalVehicles?: number
}

interface Props {
  customer: Customer
  isSelected: boolean
}

interface Emits {
  (e: 'toggle-selection', customerId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const getFullName = (customer: Customer) => {
  const parts = [customer.firstName]
  if (customer.middleName) {
    parts.push(customer.middleName)
  }
  parts.push(customer.lastName)
  if (customer.suffix) {
    parts.push(customer.suffix)
  }
  return parts.join(' ')
}

const handleCheckboxChange = () => {
  emit('toggle-selection', props.customer.id)
}
</script>

<template>
  <div class="grid grid-cols-[auto_120px_1fr_150px_200px_120px_100px_80px] gap-4 border-b p-4 hover:bg-muted/50 text-sm">
    <Checkbox :model-value="isSelected" @update:model-value="handleCheckboxChange" />
    
    <!-- Customer ID -->
    <div class="text-muted-foreground font-mono text-xs">
      {{ customer.id.substring(0, 8) }}...
    </div>
    
    <!-- Name -->
    <div class="flex items-center gap-2">
      <span>{{ getFullName(customer) }}</span>
    </div>
    
    <!-- Phone -->
    <div class="text-muted-foreground">{{ customer.phoneNumber }}</div>
    
    <!-- Email -->
    <div class="text-muted-foreground truncate" :title="customer.email">
      {{ customer.email }}
    </div>
    
    <!-- Loyalty Status -->
    <div>
      <Badge 
        v-if="customer.loyaltyStatus?.toLowerCase() === 'loyal'" 
        variant="secondary" 
        class="bg-amber-500/10 text-amber-700 hover:bg-amber-500/20"
      >
        Loyal
      </Badge>
      <Badge 
        v-else-if="customer.loyaltyStatus?.toLowerCase() === 'vip'" 
        variant="secondary"
        class="bg-purple-500/10 text-purple-700 hover:bg-purple-500/20"
      >
        VIP
      </Badge>
      <Badge 
        v-else
        variant="secondary"
        class="bg-gray-500/10 text-gray-700 hover:bg-gray-500/20"
      >
        Regular
      </Badge>
    </div>
    
    <!-- Total Vehicles -->
    <div class="text-center text-muted-foreground">
      {{ customer.totalVehicles || 0 }}
    </div>
    
    <!-- Actions -->
    <div class="flex justify-center">
      <Button
        variant="ghost"
        size="sm"
        as-child
      >
        <RouterLink :to="`/dashboard/customers/${customer.id}`">
          <Eye class="h-4 w-4" />
        </RouterLink>
      </Button>
    </div>
  </div>
</template>
