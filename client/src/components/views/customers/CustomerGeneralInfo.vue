<script setup>
import { computed } from 'vue'
import { Card, CardContent, CardTitle, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Car, Package, DollarSign, Phone, Mail, Calendar, User, Clock } from 'lucide-vue-next'
import formatDate from '@/utils/formatDate'

const props = defineProps({
  customer: {
    type: Object,
    required: true
  }
})

defineEmits(['view-history'])

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
</script>

<template>
  <div class="space-y-6">
    <!-- Metrics Section -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card class="bg-blue-50/50 border-blue-200">
        <CardContent class="p-6">
          <div class="flex items-center gap-4">
            <div class="p-3 bg-blue-100 rounded-full">
              <Car class="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p class="text-sm font-medium text-blue-900">Registered Vehicles</p>
              <p class="text-2xl font-bold text-blue-700">{{ customer.totalVehicles }}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card 
        class="bg-green-50/50 border-green-200 cursor-pointer hover:bg-green-100/50 transition-colors"
        @click="$emit('view-history')"
      >
        <CardContent class="p-6">
          <div class="flex items-center gap-4">
            <div class="p-3 bg-green-100 rounded-full">
              <Package class="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p class="text-sm font-medium text-green-900">Service Count</p>
              <p class="text-2xl font-bold text-green-700">{{ customer.serviceCount }}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card 
        class="bg-amber-50/50 border-amber-200 cursor-pointer hover:bg-amber-100/50 transition-colors"
        @click="$emit('view-history')"
      >
        <CardContent class="p-6">
          <div class="flex items-center gap-4">
            <div class="p-3 bg-amber-100 rounded-full">
              <DollarSign class="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p class="text-sm font-medium text-amber-900">Total Spent</p>
              <p class="text-2xl font-bold text-amber-700">{{ formattedTotalSpent }}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <Card>
      <CardHeader>
        <div class="flex items-center gap-2">
          <User class="h-5 w-5 text-muted-foreground" />
          <CardTitle>Personal Information</CardTitle>
        </div>
      </CardHeader>
      <CardContent class="grid gap-6">
        <div class="grid grid-cols-2 gap-x-8 gap-y-6">
          <div class="space-y-1">
            <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Full Name</p>
            <p class="text-base font-medium">
              {{ customer.firstName }} 
              {{ customer.middleName ? customer.middleName + ' ' : '' }}
              {{ customer.lastName }}
              {{ customer.suffix ? ' ' + customer.suffix : '' }}
            </p>
          </div>
          
          <div class="space-y-1">
            <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Birthday</p>
            <p class="text-base font-medium">{{ formattedBirthday || 'N/A' }}</p>
          </div>

          <div class="space-y-1 col-span-2">
            <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Contact Details</p>
            <div class="grid sm:grid-cols-2 gap-4 mt-2">
              <div class="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                <Phone class="h-4 w-4 text-muted-foreground" />
                <span class="font-medium">{{ customer.phoneNumber }}</span>
              </div>
              <a :href="'mailto:' + customer.email" class="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer group">
                <Mail class="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                <span class="font-medium truncate group-hover:text-primary transition-colors" :title="customer.email">{{ customer.email }}</span>
              </a>
            </div>
          </div>
        </div>

        <Separator v-if="customer.notes" />

        <div v-if="customer.notes" class="space-y-2">
          <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Notes</p>
          <div class="p-4 rounded-lg bg-yellow-50/50 border border-yellow-100 text-sm text-yellow-900">
            {{ customer.notes }}
          </div>
        </div>

        <Separator />

        <div class="flex items-center gap-6 text-sm text-muted-foreground">
          <div class="flex items-center gap-2">
            <Calendar class="h-4 w-4" />
            <span>Member since {{ formatDate(customer.dateCreated) }}</span>
          </div>
          <div class="flex items-center gap-2">
            <Clock class="h-4 w-4" />
            <span>Last updated {{ formatDate(customer.lastModified) }}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
