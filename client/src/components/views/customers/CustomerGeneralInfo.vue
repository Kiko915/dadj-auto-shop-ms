<script setup lang="ts">
import { computed } from 'vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Car, Package, DollarSign } from 'lucide-vue-next'

type Customer = {
  firstName: string
  lastName: string
  middleName?: string | null
  suffix?: string | null
  phoneNumber: string
  email: string
  birthday?: string | null
  loyaltyStatus: string
  totalVehicles: number
  serviceCount: number
  totalSpent: number
  notes?: string | null
  dateCreated: string
  lastModified: string
}

const props = defineProps<{
  customer: Customer
}>()

const formattedTotalSpent = computed(() => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(props.customer.totalSpent)
})

const formattedBirthday = computed(() => {
  if (!props.customer.birthday) return null
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(props.customer.birthday))
})

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Customer Information</CardTitle>
      <CardDescription>Detailed customer profile and metrics</CardDescription>
    </CardHeader>
    <CardContent class="space-y-6">
      <!-- Personal Details -->
      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-1">
          <p class="text-sm font-medium text-muted-foreground">First Name</p>
          <p class="text-base">{{ customer.firstName }}</p>
        </div>
        <div class="space-y-1">
          <p class="text-sm font-medium text-muted-foreground">Last Name</p>
          <p class="text-base">{{ customer.lastName }}</p>
        </div>
        <div v-if="customer.middleName" class="space-y-1">
          <p class="text-sm font-medium text-muted-foreground">Middle Name</p>
          <p class="text-base">{{ customer.middleName }}</p>
        </div>
        <div v-if="customer.suffix" class="space-y-1">
          <p class="text-sm font-medium text-muted-foreground">Suffix</p>
          <p class="text-base">{{ customer.suffix }}</p>
        </div>
        <div v-if="formattedBirthday" class="space-y-1">
          <p class="text-sm font-medium text-muted-foreground">Birthday</p>
          <p class="text-base">{{ formattedBirthday }}</p>
        </div>
      </div>

      <Separator />

      <!-- Contact Information -->
      <div class="space-y-4">
        <h3 class="text-lg font-semibold">Contact Information</h3>
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1">
            <p class="text-sm font-medium text-muted-foreground">Phone Number</p>
            <p class="text-base">{{ customer.phoneNumber }}</p>
          </div>
          <div class="space-y-1">
            <p class="text-sm font-medium text-muted-foreground">Email Address</p>
            <p class="text-base">{{ customer.email }}</p>
          </div>
        </div>
      </div>

      <Separator />

      <!-- Metrics -->
      <div class="space-y-4">
        <h3 class="text-lg font-semibold">Customer Metrics</h3>
        <div class="grid grid-cols-3 gap-4">
          <Card>
            <CardContent class="pt-6">
              <div class="flex flex-col items-center space-y-2">
                <Car class="h-8 w-8 text-blue-500" />
                <p class="text-3xl font-bold">{{ customer.totalVehicles }}</p>
                <p class="text-sm text-muted-foreground">Registered Vehicles</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent class="pt-6">
              <div class="flex flex-col items-center space-y-2">
                <Package class="h-8 w-8 text-green-500" />
                <p class="text-3xl font-bold">{{ customer.serviceCount }}</p>
                <p class="text-sm text-muted-foreground">Service Count</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent class="pt-6">
              <div class="flex flex-col items-center space-y-2">
                <DollarSign class="h-8 w-8 text-amber-500" />
                <p class="text-3xl font-bold">{{ formattedTotalSpent }}</p>
                <p class="text-sm text-muted-foreground">Total Spent</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator v-if="customer.notes" />

      <!-- Notes -->
      <div v-if="customer.notes" class="space-y-2">
        <h3 class="text-lg font-semibold">Notes</h3>
        <p class="text-sm text-muted-foreground">{{ customer.notes }}</p>
      </div>

      <Separator />

      <!-- Timestamps -->
      <div class="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
        <div class="space-y-1">
          <p class="font-medium">Customer Since</p>
          <p>{{ formatDate(customer.dateCreated) }}</p>
        </div>
        <div class="space-y-1">
          <p class="font-medium">Last Modified</p>
          <p>{{ formatDate(customer.lastModified) }}</p>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
