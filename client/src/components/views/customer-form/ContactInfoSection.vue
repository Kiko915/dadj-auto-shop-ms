<script setup lang="ts">
import { CheckCircle, AlertCircle } from 'lucide-vue-next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  phoneNumber: string
  email: string
  errors: {
    phoneNumber: string
    email: string
  }
  touched: {
    phoneNumber: boolean
    email: boolean
  }
}

defineProps<Props>()

const emit = defineEmits<{
  'update:phoneNumber': [value: string]
  'update:email': [value: string]
  'blur': [field: 'phoneNumber' | 'email']
  'input': [field: 'phoneNumber' | 'email']
}>()
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Contact Information</CardTitle>
      <CardDescription>Customer's contact details</CardDescription>
    </CardHeader>
    <CardContent class="space-y-4">
      <div class="grid gap-4 sm:grid-cols-2">
        <!-- Phone Number -->
        <div class="space-y-2">
          <Label for="phone-number">
            Phone Number
            <span class="text-destructive">*</span>
          </Label>
          <div class="relative">
            <Input
              id="phone-number"
              :model-value="phoneNumber"
              type="tel"
              placeholder="+639123456789"
              :class="{
                'border-destructive': touched.phoneNumber && errors.phoneNumber,
                'border-green-500': touched.phoneNumber && !errors.phoneNumber && phoneNumber
              }"
              @blur="$emit('blur', 'phoneNumber')"
              @input="(e) => {
                $emit('update:phoneNumber', (e.target as HTMLInputElement).value)
                touched.phoneNumber && $emit('input', 'phoneNumber')
              }"
            />
            <CheckCircle
              v-if="touched.phoneNumber && !errors.phoneNumber && phoneNumber"
              class="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-green-500"
            />
            <AlertCircle
              v-if="touched.phoneNumber && errors.phoneNumber"
              class="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-destructive"
            />
          </div>
          <p v-if="touched.phoneNumber && errors.phoneNumber" class="text-sm text-destructive">
            {{ errors.phoneNumber }}
          </p>
        </div>

        <!-- Email Address -->
        <div class="space-y-2">
          <Label for="email">
            Email Address
            <span class="text-destructive">*</span>
          </Label>
          <div class="relative">
            <Input
              id="email"
              :model-value="email"
              type="email"
              placeholder="juan.delacruz@example.com"
              :class="{
                'border-destructive': touched.email && errors.email,
                'border-green-500': touched.email && !errors.email && email
              }"
              @blur="$emit('blur', 'email')"
              @input="(e) => {
                $emit('update:email', (e.target as HTMLInputElement).value)
                touched.email && $emit('input', 'email')
              }"
            />
            <CheckCircle
              v-if="touched.email && !errors.email && email"
              class="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-green-500"
            />
            <AlertCircle
              v-if="touched.email && errors.email"
              class="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-destructive"
            />
          </div>
          <p v-if="touched.email && errors.email" class="text-sm text-destructive">
            {{ errors.email }}
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
