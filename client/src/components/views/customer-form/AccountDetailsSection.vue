<script setup lang="ts">
import { CheckCircle, AlertCircle } from 'lucide-vue-next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  loyaltyStatus: string
  totalVehicles?: never // Removed
  errors: {
    loyaltyStatus: string
  }
  touched: {
    loyaltyStatus: boolean
  }
}

defineProps<Props>()

const emit = defineEmits<{
  'update:loyaltyStatus': [value: string]
  'blur': [field: 'loyaltyStatus']
  'input': [field: 'loyaltyStatus']
}>()
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Account Details</CardTitle>
      <CardDescription>Customer account preferences and history</CardDescription>
    </CardHeader>
    <CardContent class="space-y-4">
      <div class="grid gap-4 sm:grid-cols-2">
        <!-- Loyalty Status -->
        <div class="space-y-2">
          <Label for="loyalty-status">
            Loyalty Status
            <span class="text-destructive">*</span>
          </Label>
          <div class="relative">
            <Select
              :model-value="loyaltyStatus"
              @update:model-value="(value: string) => {
                emit('update:loyaltyStatus', value)
                emit('input', 'loyaltyStatus')
              }"
            >
              <SelectTrigger
                id="loyalty-status"
                :class="{
                  'border-destructive': touched.loyaltyStatus && errors.loyaltyStatus,
                  'border-green-500': touched.loyaltyStatus && !errors.loyaltyStatus && loyaltyStatus
                }"
                @blur="$emit('blur', 'loyaltyStatus')"
              >
                <SelectValue placeholder="Select loyalty status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="regular">Regular</SelectItem>
                <SelectItem value="loyal">Loyal</SelectItem>
                <SelectItem value="vip">VIP</SelectItem>
              </SelectContent>
            </Select>
            <CheckCircle
              v-if="touched.loyaltyStatus && !errors.loyaltyStatus && loyaltyStatus"
              class="absolute right-10 top-1/2 h-4 w-4 -translate-y-1/2 text-green-500 pointer-events-none"
            />
            <AlertCircle
              v-if="touched.loyaltyStatus && errors.loyaltyStatus"
              class="absolute right-10 top-1/2 h-4 w-4 -translate-y-1/2 text-destructive pointer-events-none"
            />
          </div>
          <p v-if="touched.loyaltyStatus && errors.loyaltyStatus" class="text-sm text-destructive">
            {{ errors.loyaltyStatus }}
          </p>
        </div>


      </div>
    </CardContent>
  </Card>
</template>
