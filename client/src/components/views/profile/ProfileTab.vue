<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { authAPI } from '@/api/auth'
import { toast } from 'vue-sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import ProfileDisplay from './ProfileDisplay.vue'
import EditProfileDialog from './EditProfileDialog.vue'
import AvatarUploadDialog from './AvatarUploadDialog.vue'

const authStore = useAuthStore()

// Dialog state
const isEditDialogOpen = ref(false)
const isAvatarDialogOpen = ref(false)
const isSaving = ref(false)

// User data computed
const user = computed(() => ({
  name: authStore.userName,
  email: authStore.userEmail,
  role: authStore.userRole,
  createdAt: authStore.createdAt,
  profilePicture: authStore.profilePicture,
  region: authStore.region,
  province: authStore.province,
  city: authStore.city,
  barangay: authStore.barangay,
  street: authStore.street,
}))

// Handlers
const handleEditClick = () => {
  isEditDialogOpen.value = true
}

const handleChangeAvatar = () => {
  isAvatarDialogOpen.value = true
}

const handleAvatarUploaded = (updatedUser) => {
  // Update auth store with new profile picture
  authStore.updateProfile(updatedUser)
  isAvatarDialogOpen.value = false
}

const handleSaveProfile = async ({ isValid, data, error, type }) => {
  if (!isValid) {
    if (type === 'address') {
      toast.error('Incomplete Address', {
        description: error
      })
    } else {
      toast.error('Validation Error', {
        description: error
      })
    }
    return
  }

  try {
    isSaving.value = true

    // Call API to update profile
    const response = await authAPI.updateProfile(data)

    // Update auth store with new data
    authStore.updateProfile(response.user)

    // Show success toast
    toast.success('Profile Updated', {
      description: 'Your profile has been updated successfully'
    })

    // Close dialog
    isEditDialogOpen.value = false
  } catch (error) {
    console.error('Failed to update profile:', error)
    
    // Show error toast
    const errorMessage = error.response?.data?.error || 'Failed to update profile. Please try again.'
    toast.error('Update Failed', {
      description: errorMessage
    })
  } finally {
    isSaving.value = false
  }
}

const handleCancelEdit = () => {
  isEditDialogOpen.value = false
}
</script>

<template>
  <div class="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>
          Your personal information and account details
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ProfileDisplay 
          :user="user" 
          @edit="handleEditClick" 
          @change-avatar="handleChangeAvatar"
        />
      </CardContent>
    </Card>

    <!-- Edit Profile Dialog -->
    <EditProfileDialog
      v-model:open="isEditDialogOpen"
      :user="user"
      :is-saving="isSaving"
      @save="handleSaveProfile"
      @cancel="handleCancelEdit"
    />

    <!-- Avatar Upload Dialog -->
    <AvatarUploadDialog
      v-model:open="isAvatarDialogOpen"
      @uploaded="handleAvatarUploaded"
    />
  </div>
</template>
