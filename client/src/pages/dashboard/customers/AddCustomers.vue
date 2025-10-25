<script setup lang="ts">
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useCustomersStore } from '@/stores/customers'

type FormState = {
  customerId: string
  name: string
  phoneNumber: string
  email: string
  loyaltyStatus: string
  totalVehicles: string
}

const router = useRouter()
const customersStore = useCustomersStore()

const form = reactive<FormState>({
  customerId: '',
  name: '',
  phoneNumber: '',
  email: '',
  loyaltyStatus: '',
  totalVehicles: ''
})

const resetForm = () => {
  form.customerId = ''
  form.name = ''
  form.phoneNumber = ''
  form.email = ''
  form.loyaltyStatus = ''
  form.totalVehicles = ''
}

const errors = reactive<Record<keyof FormState, string>>({
  customerId: '',
  name: '',
  phoneNumber: '',
  email: '',
  loyaltyStatus: '',
  totalVehicles: ''
})

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phonePattern = /^[+\d][\d\s-]{6,}$/

const validate = () => {
  let isValid = true

  Object.keys(errors).forEach((key) => {
    errors[key as keyof FormState] = ''
  })

  if (!form.customerId.trim()) {
    errors.customerId = 'Customer ID is required.'
    isValid = false
  }

  if (!form.name.trim()) {
    errors.name = 'Name is required.'
    isValid = false
  }

  if (!form.phoneNumber.trim()) {
    errors.phoneNumber = 'Phone number is required.'
    isValid = false
  } else {
    const phoneValid = phonePattern.test(form.phoneNumber.trim())
    errors.phoneNumber = phoneValid ? '' : 'Enter a valid phone number.'
    isValid = phoneValid && isValid
  }

  if (!form.email.trim()) {
    errors.email = 'Email address is required.'
    isValid = false
  } else {
    const emailValid = emailPattern.test(form.email.trim())
    errors.email = emailValid ? '' : 'Enter a valid email address.'
    isValid = emailValid && isValid
  }

  if (!form.loyaltyStatus) {
    errors.loyaltyStatus = 'Select a loyalty status.'
    isValid = false
  }

  if (form.totalVehicles === '' || form.totalVehicles === null || form.totalVehicles === undefined) {
    errors.totalVehicles = 'Total vehicles is required.'
    isValid = false
  } else {
    const total = Number(form.totalVehicles)
    const totalValid = !isNaN(total) && total >= 0
    errors.totalVehicles = totalValid ? '' : 'Total vehicles must be a non-negative number.'
    isValid = totalValid && isValid
  }

  return isValid
}

const handleSubmit = () => {
  if (!validate()) return

  const payload = {
    id: form.customerId.trim(),
    name: form.name.trim(),
    phoneNumber: form.phoneNumber.trim(),
    emailAddress: form.email.trim(),
    loyaltyStatus: form.loyaltyStatus,
    totalVehicles: Number(form.totalVehicles)
  }

  customersStore.addCustomer(payload)
  toast.success('Customer added successfully', {
    description: `${payload.name} has been added to your customer list.`
  })
  router.push({ name: 'customers' })
  resetForm()
}

const handleCancel = () => {
  router.back()
}
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-6 p-6">
    <header class="space-y-2">
      <h1 class="text-2xl font-semibold tracking-tight">Add Customer</h1>
      <p class="text-sm text-muted-foreground">
        Enter the customer details exactly as they should appear in the directory.
      </p>
    </header>

    <Card>
      <CardHeader class="space-y-1 px-6">
        <CardTitle>Customer Information</CardTitle>
        <CardDescription>All fields are required to create a new customer record.</CardDescription>
      </CardHeader>
      <CardContent class="space-y-6 px-6">
        <form id="add-customer-form" class="space-y-6" @submit.prevent="handleSubmit">
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-2">
              <Label for="customer-id">Customer ID</Label>
              <Input
                id="customer-id"
                v-model="form.customerId"
                placeholder="cust-123"
                required
              />
              <p v-if="errors.customerId" class="text-sm text-destructive">{{ errors.customerId }}</p>
            </div>

            <div class="space-y-2">
              <Label for="name">Full Name</Label>
              <Input
                id="name"
                v-model="form.name"
                placeholder="Juan Dela Cruz"
                required
              />
              <p v-if="errors.name" class="text-sm text-destructive">{{ errors.name }}</p>
            </div>

            <div class="space-y-2">
              <Label for="phone">Phone Number</Label>
              <Input
                id="phone"
                v-model="form.phoneNumber"
                placeholder="+63 900 000 0000"
                required
              />
              <p v-if="errors.phoneNumber" class="text-sm text-destructive">{{ errors.phoneNumber }}</p>
            </div>

            <div class="space-y-2">
              <Label for="email">Email Address</Label>
              <Input
                id="email"
                v-model="form.email"
                type="email"
                placeholder="name@email.com"
                required
              />
              <p v-if="errors.email" class="text-sm text-destructive">{{ errors.email }}</p>
            </div>

            <div class="space-y-2">
              <Label for="loyalty">Loyalty Status</Label>
              <Select v-model="form.loyaltyStatus" required>
                <SelectTrigger id="loyalty">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Loyal">Loyal</SelectItem>
                  <SelectItem value="Regular">Regular</SelectItem>
                </SelectContent>
              </Select>
              <p v-if="errors.loyaltyStatus" class="text-sm text-destructive">{{ errors.loyaltyStatus }}</p>
            </div>

            <div class="space-y-2">
              <Label for="vehicles">Total Vehicles</Label>
              <Input
                id="vehicles"
                v-model="form.totalVehicles"
                type="number"
                min="0"
                step="1"
                placeholder="0"
                required
              />
              <p v-if="errors.totalVehicles" class="text-sm text-destructive">{{ errors.totalVehicles }}</p>
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter class="flex flex-col gap-2 px-6 pt-0 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          class="w-full sm:w-auto"
          @click="handleCancel"
        >
          Back
        </Button>
        <Button
          type="submit"
          variant="primary"
          class="w-full sm:w-auto"
          form="add-customer-form"
        >
          Save Customer
        </Button>
      </CardFooter>
    </Card>
  </div>
</template>