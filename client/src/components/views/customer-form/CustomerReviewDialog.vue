<script setup lang="ts">
import { computed } from 'vue'
import { CheckCircle, Loader2, User, Phone, Star } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface CustomerData {
  firstName: string
  lastName: string
  middleName: string
  suffix: string
  phoneNumber: string
  email: string
  birthday: Date | null
  loyaltyStatus: string
  totalVehicles: string
  profilePicture: string | null
}

interface Props {
  open: boolean
  isSubmitting: boolean
  customerData: CustomerData
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'confirm': []
  'cancel': []
}>()

// Computed property for full name display
const fullName = computed(() => {
  return [
    props.customerData.firstName,
    props.customerData.middleName,
    props.customerData.lastName,
    props.customerData.suffix
  ]
    .filter(Boolean)
    .join(' ') || 'N/A'
})

// Computed property for initials
const initials = computed(() => {
  if (props.customerData.firstName && props.customerData.lastName) {
    return `${props.customerData.firstName[0]}${props.customerData.lastName[0]}`.toUpperCase()
  }
  return '?'
})

// Computed property for formatted birthday
const formattedBirthday = computed(() => {
  if (!props.customerData.birthday) return null
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(props.customerData.birthday))
})

const handleConfirm = () => {
  emit('confirm')
}

const handleCancel = () => {
  emit('cancel')
}
</script>

<template>
  <Dialog :open="open" @update:open="(val) => $emit('update:open', val)">
    <DialogContent class="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle class="text-2xl">Review Customer Information</DialogTitle>
        <DialogDescription>
          Please review the information below before adding this customer to the system.
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-6 py-4">
        <!-- Profile Picture & Name -->
        <div class="flex items-center gap-4">
          <Avatar class="h-20 w-20 border-2 border-border">
            <AvatarImage v-if="customerData.profilePicture" :src="customerData.profilePicture" alt="Profile preview" />
            <AvatarFallback class="text-xl">{{ initials }}</AvatarFallback>
          </Avatar>
          <div>
            <h3 class="text-xl font-semibold">{{ fullName }}</h3>
            <p class="text-sm text-muted-foreground">New Customer</p>
          </div>
        </div>

        <Separator />

        <!-- Personal Information -->
        <div class="space-y-3">
          <div class="flex items-center gap-2 mb-3">
            <User class="h-4 w-4 text-primary" />
            <h4 class="font-semibold">Personal Information</h4>
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            <div class="space-y-1">
              <p class="text-sm text-muted-foreground">First Name</p>
              <p class="font-medium">{{ customerData.firstName }}</p>
            </div>
            <div class="space-y-1">
              <p class="text-sm text-muted-foreground">Last Name</p>
              <p class="font-medium">{{ customerData.lastName }}</p>
            </div>
            <div v-if="customerData.middleName" class="space-y-1">
              <p class="text-sm text-muted-foreground">Middle Name</p>
              <p class="font-medium">{{ customerData.middleName }}</p>
            </div>
            <div v-if="customerData.suffix" class="space-y-1">
              <p class="text-sm text-muted-foreground">Suffix</p>
              <p class="font-medium">{{ customerData.suffix }}</p>
            </div>
            <div v-if="formattedBirthday" class="space-y-1">
              <p class="text-sm text-muted-foreground">Birthday</p>
              <p class="font-medium">{{ formattedBirthday }}</p>
            </div>
          </div>
        </div>

        <Separator />

        <!-- Contact Information -->
        <div class="space-y-3">
          <div class="flex items-center gap-2 mb-3">
            <Phone class="h-4 w-4 text-primary" />
            <h4 class="font-semibold">Contact Information</h4>
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            <div class="space-y-1">
              <p class="text-sm text-muted-foreground">Phone Number</p>
              <p class="font-medium">{{ customerData.phoneNumber }}</p>
            </div>
            <div class="space-y-1">
              <p class="text-sm text-muted-foreground">Email Address</p>
              <p class="font-medium">{{ customerData.email || 'Not provided' }}</p>
            </div>
          </div>
        </div>

        <Separator />

        <!-- Account Details -->
        <div class="space-y-3">
          <div class="flex items-center gap-2 mb-3">
            <Star class="h-4 w-4 text-primary" />
            <h4 class="font-semibold">Account Details</h4>
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            <div class="space-y-1">
              <p class="text-sm text-muted-foreground">Loyalty Status</p>
              <p class="font-medium capitalize">{{ customerData.loyaltyStatus }}</p>
            </div>
            <div class="space-y-1">
              <p class="text-sm text-muted-foreground">Total Vehicles</p>
              <p class="font-medium">{{ customerData.totalVehicles }}</p>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter class="gap-2 sm:gap-0">
        <Button
          type="button"
          variant="outline"
          class="mr-2"
          @click="handleCancel"
          :disabled="isSubmitting"
        >
          Edit Information
        </Button>
        <Button
          type="button"
          variant="default"
          @click="handleConfirm"
          :disabled="isSubmitting"
        >
          <Loader2 v-if="isSubmitting" class="mr-2 h-4 w-4 animate-spin" />
          <CheckCircle v-else class="mr-2 h-4 w-4" />
          {{ isSubmitting ? 'Adding Customer...' : 'Confirm & Add Customer' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
