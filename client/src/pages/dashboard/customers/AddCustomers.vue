<script setup lang="ts">
import { reactive, ref, watch, onMounted, onUnmounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { CheckCircle, Loader2, AlertTriangle } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle } from 'lucide-vue-next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { createCustomer } from '@/api/customers'
import ProfilePictureUpload from '@/components/views/customer-form/ProfilePictureUpload.vue'
import ContactInfoSection from '@/components/views/customer-form/ContactInfoSection.vue'
import AccountDetailsSection from '@/components/views/customer-form/AccountDetailsSection.vue'
import CustomerReviewDialog from '@/components/views/customer-form/CustomerReviewDialog.vue'
import api from '@/api/index'

type FormState = {
  firstName: string
  lastName: string
  middleName: string
  suffix: string
  phoneNumber: string
  email: string
  loyaltyStatus: string
  totalVehicles: string
  profilePicture: string | null
}

const STORAGE_KEY = 'addCustomerFormDraft'

const router = useRouter()
const isSubmitting = ref(false)
const showDiscardDialog = ref(false)
const showConfirmDialog = ref(false)
const uploadedImageFileId = ref<string | null>(null) // Track uncommitted ImageKit uploads

// Load saved form data from localStorage on mount
const loadSavedFormData = (): Partial<FormState> | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (error) {
    console.error('Failed to load saved form data:', error)
  }
  return null
}

const form = reactive<FormState>({
  firstName: '',
  lastName: '',
  middleName: '',
  suffix: '',
  phoneNumber: '',
  email: '',
  loyaltyStatus: '',
  totalVehicles: '0',
  profilePicture: null
})

const resetForm = () => {
  form.firstName = ''
  form.lastName = ''
  form.middleName = ''
  form.suffix = ''
  form.phoneNumber = ''
  form.email = ''
  form.loyaltyStatus = ''
  form.totalVehicles = '0'
  form.profilePicture = null
}

// Save form data to localStorage whenever it changes
const saveFormToLocalStorage = () => {
  try {
    // Since profilePicture is now an ImageKit URL (not Base64), it's much smaller
    // No need to worry about size limitations
    const dataToSave = { ...form }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave))
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.error('Failed to save form data: Storage quota exceeded')
    } else {
      console.error('Failed to save form data:', error)
    }
  }
}

// Clear saved form data from localStorage
const clearSavedFormData = () => {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Failed to clear saved form data:', error)
  }
}

// Watch for form changes and save to localStorage
watch(form, () => {
  saveFormToLocalStorage()
}, { deep: true })

// Load saved data on component mount
onMounted(() => {
  const savedData = loadSavedFormData()
  if (savedData) {
    // Check if there's any meaningful data (not just default values)
    const hasData = savedData.firstName || savedData.lastName || savedData.phoneNumber || savedData.email
    
    if (hasData) {
      Object.assign(form, savedData)
      
      toast.info('Draft Restored', {
        description: 'Your previous form data has been restored.'
      })
    }
  }
})

// Clear localStorage when component is unmounted (navigating away)
// But only if the form was successfully submitted
onUnmounted(() => {
  // This will be handled by handleSubmit when successful
  // or kept in localStorage if user navigates away without submitting
})

// Cleanup unused uploads when user navigates away without submitting
onBeforeUnmount(async () => {
  // Only cleanup if there's an uncommitted upload
  if (uploadedImageFileId.value) {
    await cleanupUnusedUpload()
  }
})

const errors = reactive<Record<keyof FormState, string>>({
  firstName: '',
  lastName: '',
  middleName: '',
  suffix: '',
  phoneNumber: '',
  email: '',
  loyaltyStatus: '',
  totalVehicles: '',
  profilePicture: ''
})

const touched = reactive<Record<keyof FormState, boolean>>({
  firstName: false,
  lastName: false,
  middleName: false,
  suffix: false,
  phoneNumber: false,
  email: false,
  loyaltyStatus: false,
  totalVehicles: false,
  profilePicture: false
})

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const phonePattern = /^\+?[1-9]\d{1,14}$/

// Real-time validation
const validateField = (field: keyof FormState) => {
  errors[field] = ''

  switch (field) {
    case 'firstName':
      if (!form.firstName.trim()) {
        errors.firstName = 'First name is required'
      } else if (form.firstName.trim().length < 2) {
        errors.firstName = 'First name must be at least 2 characters'
      }
      break

    case 'lastName':
      if (!form.lastName.trim()) {
        errors.lastName = 'Last name is required'
      } else if (form.lastName.trim().length < 2) {
        errors.lastName = 'Last name must be at least 2 characters'
      }
      break

    case 'middleName':
      // Middle name is optional, but if provided, validate length
      if (form.middleName.trim() && form.middleName.trim().length < 2) {
        errors.middleName = 'Middle name must be at least 2 characters'
      }
      break

    case 'suffix':
      // Suffix is optional, no validation needed
      break

    case 'phoneNumber':
      if (!form.phoneNumber.trim()) {
        errors.phoneNumber = 'Phone number is required'
      } else if (!phonePattern.test(form.phoneNumber.replace(/[\s-]/g, ''))) {
        errors.phoneNumber = 'Enter a valid phone number (e.g., +63 900 000 0000)'
      }
      break

    case 'email':
      if (!form.email.trim()) {
        errors.email = 'Email address is required'
      } else if (!emailPattern.test(form.email.trim())) {
        errors.email = 'Enter a valid email address'
      }
      break

    case 'loyaltyStatus':
      if (!form.loyaltyStatus) {
        errors.loyaltyStatus = 'Loyalty status is required'
      }
      break

    case 'totalVehicles':
      const total = Number(form.totalVehicles)
      if (form.totalVehicles === '' || form.totalVehicles === null) {
        errors.totalVehicles = 'Total vehicles is required'
      } else if (isNaN(total) || total < 0) {
        errors.totalVehicles = 'Must be a non-negative number'
      }
      break
  }
}

const validate = () => {
  let isValid = true

  // Mark all fields as touched
  Object.keys(touched).forEach((key) => {
    touched[key as keyof FormState] = true
  })

  // Validate all fields
  Object.keys(form).forEach((key) => {
    if (key !== 'profilePicture') {
      validateField(key as keyof FormState)
      if (errors[key as keyof FormState]) {
        isValid = false
      }
    }
  })

  return isValid
}

const handleBlur = (field: keyof Omit<FormState, 'profilePicture'>) => {
  touched[field] = true
  validateField(field)
}

const handleInput = (field: keyof Omit<FormState, 'profilePicture'>) => {
  if (touched[field]) {
    validateField(field)
  }
}

const handleSubmit = async () => {
  if (!validate()) {
    toast.error('Validation Error', {
      description: 'Please fix the errors in the form before submitting.'
    })
    return
  }

  // Show confirmation dialog instead of submitting immediately
  showConfirmDialog.value = true
}

const confirmSubmit = async () => {
  isSubmitting.value = true
  showConfirmDialog.value = false

  try {
    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      middleName: form.middleName.trim() || undefined,
      suffix: form.suffix.trim() || undefined,
      phoneNumber: form.phoneNumber.trim(),
      email: form.email.trim(),
      loyaltyStatus: form.loyaltyStatus,
      totalVehicles: Number(form.totalVehicles),
      profilePicture: form.profilePicture || undefined
    }

    // Call the backend API
    const response = await createCustomer(payload)
    
    const fullNameDisplay = [payload.firstName, payload.middleName, payload.lastName, payload.suffix]
      .filter(Boolean)
      .join(' ')
    
    toast.success('Customer added successfully! 🎉', {
      description: `${fullNameDisplay} has been added to your customer list.`
    })

    // Clear localStorage after successful submission
    clearSavedFormData()

    // Clear the fileId since the image is now committed to a customer
    uploadedImageFileId.value = null

    isSubmitting.value = false
    resetForm()
    router.push({ name: 'customers' })
  } catch (error) {
    isSubmitting.value = false
    
    // Handle specific error cases
    if (error.response?.data?.error === 'DUPLICATE_EMAIL') {
      toast.error('Email Already Exists', {
        description: 'A customer with this email address already exists.'
      })
      errors.email = 'This email is already registered'
      touched.email = true
    } else if (error.response?.data?.error === 'MISSING_FIELDS') {
      toast.error('Validation Error', {
        description: 'Please fill in all required fields.'
      })
    } else if (error.response?.data?.error === 'INVALID_EMAIL') {
      toast.error('Invalid Email', {
        description: 'Please enter a valid email address.'
      })
      errors.email = 'Invalid email format'
      touched.email = true
    } else {
      console.error('Customer Creation Error:', error)
      toast.error('Failed to Add Customer', {
        description: error.response?.data?.message || 'An unexpected error occurred. Please try again.'
      })
    }
  }
}

const cancelSubmit = () => {
  showConfirmDialog.value = false
}

// Cleanup function to delete unused ImageKit uploads
const cleanupUnusedUpload = async () => {
  if (uploadedImageFileId.value) {
    try {
      await api.delete(`/imagekit/delete/${uploadedImageFileId.value}`)
      console.log('Cleaned up unused ImageKit upload:', uploadedImageFileId.value)
    } catch (error) {
      // Silently fail - file might already be deleted or doesn't exist
      console.warn('Failed to clean up ImageKit upload:', error)
    } finally {
      uploadedImageFileId.value = null
    }
  }
}

const handleCancel = () => {
  // Ask user if they want to discard changes
  const hasData = form.firstName || form.lastName || form.phoneNumber || form.email
  
  if (hasData) {
    showDiscardDialog.value = true
  } else {
    router.back()
  }
}

const confirmDiscard = async () => {
  // Clean up any uploaded images that weren't submitted
  await cleanupUnusedUpload()
  
  clearSavedFormData()
  showDiscardDialog.value = false
  router.back()
}

const cancelDiscard = () => {
  showDiscardDialog.value = false
}

</script>

<template>
  <div class="mx-auto max-w-4xl space-y-6">
    <header class="space-y-2">
      <h1 class="text-3xl font-bold tracking-tight">Add Customer</h1>
      <p class="text-muted-foreground">
        Create a new customer profile with complete details and optional profile picture.
      </p>
    </header>

    <form @submit.prevent="handleSubmit">
      <div class="space-y-6">
        <!-- Profile Picture Section -->
        <ProfilePictureUpload
          :name="`${form.firstName} ${form.lastName}`"
          :error="errors.profilePicture"
          v-model="form.profilePicture"
          @update:error="(val) => errors.profilePicture = val"
          @update:fileId="(id) => uploadedImageFileId = id"
        />

        <!-- Personal Information -->
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Customer name details</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="grid gap-4 sm:grid-cols-2">
              <!-- First Name -->
              <div class="space-y-2">
                <Label for="firstName">
                  First Name
                  <span class="text-destructive">*</span>
                </Label>
                <div class="relative">
                  <Input
                    id="firstName"
                    v-model="form.firstName"
                    placeholder="Juan"
                    :class="{
                      'border-destructive': touched.firstName && errors.firstName,
                      'border-green-500': touched.firstName && !errors.firstName && form.firstName
                    }"
                    @blur="handleBlur('firstName')"
                    @input="handleInput('firstName')"
                  />
                  <CheckCircle
                    v-if="touched.firstName && !errors.firstName && form.firstName"
                    class="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-green-500"
                  />
                  <AlertCircle
                    v-if="touched.firstName && errors.firstName"
                    class="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-destructive"
                  />
                </div>
                <p v-if="touched.firstName && errors.firstName" class="text-sm text-destructive">
                  {{ errors.firstName }}
                </p>
              </div>

              <!-- Last Name -->
              <div class="space-y-2">
                <Label for="lastName">
                  Last Name
                  <span class="text-destructive">*</span>
                </Label>
                <div class="relative">
                  <Input
                    id="lastName"
                    v-model="form.lastName"
                    placeholder="Dela Cruz"
                    :class="{
                      'border-destructive': touched.lastName && errors.lastName,
                      'border-green-500': touched.lastName && !errors.lastName && form.lastName
                    }"
                    @blur="handleBlur('lastName')"
                    @input="handleInput('lastName')"
                  />
                  <CheckCircle
                    v-if="touched.lastName && !errors.lastName && form.lastName"
                    class="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-green-500"
                  />
                  <AlertCircle
                    v-if="touched.lastName && errors.lastName"
                    class="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-destructive"
                  />
                </div>
                <p v-if="touched.lastName && errors.lastName" class="text-sm text-destructive">
                  {{ errors.lastName }}
                </p>
              </div>

              <!-- Middle Name -->
              <div class="space-y-2">
                <Label for="middleName">
                  Middle Name
                  <span class="text-muted-foreground text-xs">(Optional)</span>
                </Label>
                <div class="relative">
                  <Input
                    id="middleName"
                    v-model="form.middleName"
                    placeholder="Santos"
                    :class="{
                      'border-destructive': touched.middleName && errors.middleName,
                      'border-green-500': touched.middleName && !errors.middleName && form.middleName
                    }"
                    @blur="handleBlur('middleName')"
                    @input="handleInput('middleName')"
                  />
                  <CheckCircle
                    v-if="touched.middleName && !errors.middleName && form.middleName"
                    class="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-green-500"
                  />
                  <AlertCircle
                    v-if="touched.middleName && errors.middleName"
                    class="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-destructive"
                  />
                </div>
                <p v-if="touched.middleName && errors.middleName" class="text-sm text-destructive">
                  {{ errors.middleName }}
                </p>
              </div>

              <!-- Suffix -->
              <div class="space-y-2">
                <Label for="suffix">
                  Suffix
                  <span class="text-muted-foreground text-xs">(Optional)</span>
                </Label>
                <div class="relative">
                  <Input
                    id="suffix"
                    v-model="form.suffix"
                    placeholder="Jr., Sr., III, etc."
                    :class="{
                      'border-destructive': touched.suffix && errors.suffix,
                      'border-green-500': touched.suffix && !errors.suffix && form.suffix
                    }"
                    @blur="handleBlur('suffix')"
                    @input="handleInput('suffix')"
                  />
                  <CheckCircle
                    v-if="touched.suffix && !errors.suffix && form.suffix"
                    class="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-green-500"
                  />
                  <AlertCircle
                    v-if="touched.suffix && errors.suffix"
                    class="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-destructive"
                  />
                </div>
                <p v-if="touched.suffix && errors.suffix" class="text-sm text-destructive">
                  {{ errors.suffix }}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Contact Information -->
        <ContactInfoSection
          :phoneNumber="form.phoneNumber"
          :email="form.email"
          :errors="{
            phoneNumber: errors.phoneNumber,
            email: errors.email
          }"
          :touched="{
            phoneNumber: touched.phoneNumber,
            email: touched.email
          }"
          @update:phoneNumber="(val) => form.phoneNumber = val"
          @update:email="(val) => form.email = val"
          @blur="handleBlur"
          @input="handleInput"
        />

        <!-- Account Details -->
        <AccountDetailsSection
          :loyaltyStatus="form.loyaltyStatus"
          :totalVehicles="form.totalVehicles"
          :errors="{
            loyaltyStatus: errors.loyaltyStatus,
            totalVehicles: errors.totalVehicles
          }"
          :touched="{
            loyaltyStatus: touched.loyaltyStatus,
            totalVehicles: touched.totalVehicles
          }"
          @update:loyaltyStatus="(val) => form.loyaltyStatus = val"
          @update:totalVehicles="(val) => form.totalVehicles = val"
          @blur="handleBlur"
          @input="handleInput"
        />

        <!-- Form Actions -->
        <Card>
          <CardFooter class="flex flex-col gap-2 pt-6 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              class="w-full sm:w-auto"
              :disabled="isSubmitting"
              @click="handleCancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              class="w-full sm:w-auto"
              :disabled="isSubmitting"
            >
              <Loader2 v-if="isSubmitting" class="mr-2 h-4 w-4 animate-spin" />
              <CheckCircle v-else class="mr-2 h-4 w-4" />
              {{ isSubmitting ? 'Saving...' : 'Save Customer' }}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </form>

    <!-- Discard Changes Dialog -->
    <Dialog v-model:open="showDiscardDialog">
      <DialogContent>
        <DialogHeader>
          <div class="flex items-center gap-2">
            <AlertTriangle class="h-5 w-5 text-orange-500" />
            <DialogTitle>Discard Changes?</DialogTitle>
          </div>
          <DialogDescription>
            You have unsaved changes. Are you sure you want to discard them? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter class="gap-4 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            @click="cancelDiscard"
          class="mr-2"
          >
            Keep Editing
          </Button>
          <Button
            type="button"
            variant="destructive"
            @click="confirmDiscard"
          >
            Discard Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Confirmation Dialog -->
    <CustomerReviewDialog
      v-model:open="showConfirmDialog"
      :is-submitting="isSubmitting"
      :customer-data="form"
      @confirm="confirmSubmit"
      @cancel="cancelSubmit"
    />
  </div>
</template>