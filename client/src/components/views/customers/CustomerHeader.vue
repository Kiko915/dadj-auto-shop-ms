<script setup lang="ts">
import { computed } from 'vue'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Phone, Mail, Car, History, Edit, Plus, DollarSign, Gift, Crown, Star } from 'lucide-vue-next'

type Customer = {
  id: string
  firstName: string
  lastName: string
  middleName?: string | null
  suffix?: string | null
  phoneNumber: string
  email: string
  birthday?: string | null
  profilePicture?: string | null
  loyaltyStatus: 'Loyal' | 'Regular' | 'VIP'
  totalVehicles: number
  serviceCount: number
  totalSpent: number
}

const props = defineProps<{
  customer: Customer
}>()

const emit = defineEmits<{
  editProfile: []
  startServiceOrder: []
}>()

const fullName = computed(() => {
  const parts = [
    props.customer.firstName,
    props.customer.middleName,
    props.customer.lastName,
    props.customer.suffix,
  ].filter(Boolean)
  return parts.join(' ')
})

const initials = computed(() => {
  return `${props.customer.firstName[0]}${props.customer.lastName[0]}`.toUpperCase()
})

const loyaltyColor = computed(() => {
  switch (props.customer.loyaltyStatus) {
    case 'VIP':
      return 'purple'
    case 'Loyal':
      return 'amber'
    default:
      return 'gray'
  }
})

const isBirthdayToday = computed(() => {
  if (!props.customer.birthday) return false
  const date = new Date(props.customer.birthday)
  const today = new Date()
  return date.getDate() === today.getDate() && date.getMonth() === today.getMonth()
})

const formattedTotalSpent = computed(() => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(props.customer.totalSpent)
})
</script>

<template>
  <Card>
    <CardContent class="pt-6">
      <div class="flex items-start gap-6">
        <Avatar class="h-24 w-24">
          <AvatarImage :src="customer.profilePicture || ''" :alt="fullName" />
          <AvatarFallback class="text-2xl">{{ initials }}</AvatarFallback>
        </Avatar>
        <div class="flex-1 space-y-2">
          <div class="flex items-center gap-3">
            <h2 class="text-2xl font-bold">{{ fullName }}</h2>
            <!-- VIP Badge -->
            <Badge v-if="customer.loyaltyStatus?.toLowerCase() === 'vip'" class="bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-0 shadow-sm gap-1.5 pl-1.5 pr-2.5">
              <Crown class="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
              VIP Member
            </Badge>

            <!-- Loyal Badge -->
            <Badge v-else-if="customer.loyaltyStatus?.toLowerCase() === 'loyal'" variant="secondary" class="bg-amber-100 text-amber-700 border-amber-200 gap-1.5 pl-1.5 pr-2.5">
              <Star class="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              Loyal Customer
            </Badge>

            <!-- Regular Badge -->
            <Badge v-else variant="outline" class="text-slate-500 border-slate-200 bg-slate-50">
              Regular
            </Badge>
            <Badge v-if="isBirthdayToday" variant="secondary" class="bg-pink-100 text-pink-600 gap-1 pl-1.5 pr-2.5">
              <Gift class="w-3.5 h-3.5" />
              Birthday Today!
            </Badge>
          </div>
          <div class="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div class="flex items-center gap-2">
              <Phone class="h-4 w-4" />
              <span>{{ customer.phoneNumber }}</span>
            </div>
            <div class="flex items-center gap-2">
              <Mail class="h-4 w-4" />
              <span>{{ customer.email }}</span>
            </div>
          </div>
          <div class="flex gap-4 pt-2">
            <div class="flex items-center gap-2 text-sm">
              <Car class="h-4 w-4 text-muted-foreground" />
              <span class="font-semibold">{{ customer.totalVehicles }}</span>
              <span class="text-muted-foreground">Vehicles</span>
            </div>
            <div class="flex items-center gap-2 text-sm">
              <History class="h-4 w-4 text-muted-foreground" />
              <span class="font-semibold">{{ customer.serviceCount }}</span>
              <span class="text-muted-foreground">Services</span>
            </div>
            <div class="flex items-center gap-2 text-sm">
              <DollarSign class="h-4 w-4 text-muted-foreground" />
              <span class="font-semibold">{{ formattedTotalSpent }}</span>
              <span class="text-muted-foreground">Total Spent</span>
            </div>
          </div>
        </div>
        <div class="flex gap-2">
          <Button variant="outline" @click="emit('editProfile')">
            <Edit class="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
          <Button @click="emit('startServiceOrder')">
            <Plus class="h-4 w-4 mr-2" />
            New Service Order
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
