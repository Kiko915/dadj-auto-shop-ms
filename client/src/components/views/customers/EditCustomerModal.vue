<script setup lang="ts">
import { ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Loader2 } from 'lucide-vue-next'
import { getCustomer, updateCustomer } from '@/api/customers'
import api from '@/api'
import ImageUpload from '@/components/common/ImageUpload.vue'

type Customer = {
  id: string
  firstName: string
  lastName: string
  middleName?: string | null
  suffix?: string | null
  phoneNumber: string
  email: string
  birthday?: string | null
  loyaltyStatus: string
  notes?: string | null
  profilePicture?: string | null
  imageFileId?: string | null
}

const props = defineProps<{
  open: boolean
  customer: Customer | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  customerUpdated: []
}>()

const isSubmitting = ref(false)
const isUploadingImage = ref(false)
const editForm = ref({
  firstName: '',
  lastName: '',
  middleName: '',
  suffix: '',
  phoneNumber: '',
  email: '',
  birthday: null as Date | null,
  loyaltyStatus: 'Regular' as 'Loyal' | 'Regular' | 'VIP',
  notes: '',
  profilePicture: '' as string | null,
  imageFileId: '' as string | null,
})

// Helper function to capitalize first letter
const capitalizeFirst = (str: string | null | undefined) => {
  if (!str) return 'Regular'
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

// Watch for changes to customer prop and populate form
watch(() => props.customer, (newCustomer) => {
  if (newCustomer) {
    editForm.value = {
      firstName: newCustomer.firstName,
      lastName: newCustomer.lastName,
      middleName: newCustomer.middleName || '',
      suffix: newCustomer.suffix || '',
      phoneNumber: newCustomer.phoneNumber,
      email: newCustomer.email,
      birthday: newCustomer.birthday ? new Date(newCustomer.birthday) : null,
      loyaltyStatus: capitalizeFirst(newCustomer.loyaltyStatus) as 'Loyal' | 'Regular' | 'VIP',
      notes: newCustomer.notes || '',
      profilePicture: newCustomer.profilePicture || '',
      imageFileId: newCustomer.imageFileId || '',
    }
  }
}, { immediate: true })

// Watch for image changes to cleanup orphaned files
watch(() => editForm.value.imageFileId, async (newVal, oldVal) => {
  // If we have an old temporary file that is DIFFERENT from the original customer image
  // AND different from the new one, it means it was an intermediate upload we should delete.
  if (oldVal && newVal !== oldVal && props.customer && oldVal !== props.customer.imageFileId) {
    try {
      console.log('Cleaning up orphaned file:', oldVal)
      await api.delete(`/files/${oldVal}`)
    } catch (error) {
      console.error('Failed to cleanup orphaned file:', error)
    }
  }
})

const handleUpdateCustomer = async () => {
  if (!props.customer) return
  if (isUploadingImage.value) {
    toast.error('Please wait for the image upload to complete')
    return
  }
  
  try {
    isSubmitting.value = true
    
    // Helper function to format date as YYYY-MM-DD in local timezone
    const formatDateLocal = (date: Date): string => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    
    // Prepare data for update
    const updateData = {
      firstName: editForm.value.firstName,
      lastName: editForm.value.lastName,
      middleName: editForm.value.middleName || '',
      suffix: editForm.value.suffix || '',
      phoneNumber: editForm.value.phoneNumber,
      email: editForm.value.email,
      birthday: editForm.value.birthday ? formatDateLocal(editForm.value.birthday) : null,
      loyaltyStatus: editForm.value.loyaltyStatus,
      notes: editForm.value.notes || '',
      profilePicture: editForm.value.profilePicture || null,
      imageFileId: editForm.value.imageFileId || null,
    }
    
    await updateCustomer(props.customer.id, updateData)
    
    toast.success('Customer updated successfully')
    emit('update:open', false)
    emit('customerUpdated')
  } catch (error: any) {
    console.error('Error updating customer:', error)
    toast.error(error.response?.data?.message || 'Failed to update customer')
  } finally {
    isSubmitting.value = false
  }
}

const handleCancel = () => {
  emit('update:open', false)
}
</script>

<template>
  <Dialog :open="open" @update:open="(value) => !isSubmitting && emit('update:open', value)">
    <DialogContent class="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Edit Customer Profile</DialogTitle>
        <DialogDescription>
          Update customer information. All fields marked with * are required.
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-6 py-4">
        <!-- Personal Information Section -->
        <div class="space-y-4">
          <h3 class="text-sm font-semibold">Personal Information</h3>
          
          <div class="flex justify-center mb-6">
            <ImageUpload
              v-model="editForm.profilePicture"
              :label="'Profile Picture'"
              folder="/customer-profiles"
              fileNamePrefix="customer"
              @update:fileId="(val) => editForm.imageFileId = val"
              @upload-start="isUploadingImage = true"
              @upload-end="isUploadingImage = false"
            />
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="edit-firstName">
                First Name <span class="text-destructive">*</span>
              </Label>
              <Input
                id="edit-firstName"
                v-model="editForm.firstName"
                placeholder="John"
                required
              />
            </div>

            <div class="space-y-2">
              <Label for="edit-lastName">
                Last Name <span class="text-destructive">*</span>
              </Label>
              <Input
                id="edit-lastName"
                v-model="editForm.lastName"
                placeholder="Doe"
                required
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="edit-middleName">Middle Name</Label>
              <Input
                id="edit-middleName"
                v-model="editForm.middleName"
                placeholder="Smith"
              />
            </div>

            <div class="space-y-2">
              <Label for="edit-suffix">Suffix</Label>
              <Input
                id="edit-suffix"
                v-model="editForm.suffix"
                placeholder="Jr., Sr., III"
              />
            </div>
          </div>
        </div>

        <Separator />

        <!-- Contact Information Section -->
        <div class="space-y-4">
          <h3 class="text-sm font-semibold">Contact Information</h3>
          
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="edit-phoneNumber">
                Phone Number <span class="text-destructive">*</span>
              </Label>
              <Input
                id="edit-phoneNumber"
                v-model="editForm.phoneNumber"
                type="tel"
                placeholder="+63 912 345 6789"
                required
              />
            </div>

            <div class="space-y-2">
              <Label for="edit-email">
                Email <span class="text-destructive">*</span>
              </Label>
              <Input
                id="edit-email"
                v-model="editForm.email"
                type="email"
                placeholder="john.doe@example.com"
                required
              />
            </div>
          </div>
        </div>

        <Separator />

        <!-- Additional Information Section -->
        <div class="space-y-4">
          <h3 class="text-sm font-semibold">Additional Information</h3>
          
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="edit-birthday">Birthday</Label>
              <DatePicker
                id="edit-birthday"
                v-model="editForm.birthday"
                placeholder="Select birthday"
              />
            </div>

            <div class="space-y-2">
              <Label for="edit-loyaltyStatus">Loyalty Status</Label>
              <Select v-model="editForm.loyaltyStatus">
                <SelectTrigger id="edit-loyaltyStatus">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Regular">Regular</SelectItem>
                  <SelectItem value="Loyal">Loyal</SelectItem>
                  <SelectItem value="VIP">VIP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div class="space-y-2">
            <Label for="edit-notes">Notes</Label>
            <Textarea
              id="edit-notes"
              v-model="editForm.notes"
              placeholder="Add any additional notes about this customer..."
              rows="3"
            />
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          @click="handleCancel"
          :disabled="isSubmitting"
        >
          Cancel
        </Button>
        <Button
          @click="handleUpdateCustomer"
          :disabled="isSubmitting || isUploadingImage"
        >
          <Loader2 v-if="isSubmitting || isUploadingImage" class="h-4 w-4 mr-2 animate-spin" />
          {{ isSubmitting ? 'Updating...' : (isUploadingImage ? 'Uploading Image...' : 'Update Customer') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
