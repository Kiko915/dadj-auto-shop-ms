<script setup>
import { ref, watch, computed } from 'vue'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'vue-sonner'
import { Loader2, Upload, X, Eye, EyeOff } from 'lucide-vue-next'
import { updateUser } from '@/api/users'
import api from '@/api/index'

const props = defineProps({
  open: {
    type: Boolean,
    default: false
  },
  user: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:open', 'updated'])

// Form state
const formData = ref({
  name: '',
  email: '',
  password: '',
  role: 'staff',
  isActive: true,
  profilePicture: null
})

const errors = ref({})
const isSubmitting = ref(false)
const showPassword = ref(false)
const isUploading = ref(false)
const profilePreview = ref(null)
const changePassword = ref(false)

// Initialize form when user changes
watch(() => props.user, (newUser) => {
  if (newUser) {
    formData.value = {
      name: newUser.name || '',
      email: newUser.email || '',
      password: '',
      role: newUser.role || 'staff',
      isActive: newUser.isActive ?? true,
      profilePicture: newUser.profilePicture || null
    }
    profilePreview.value = newUser.profilePicture || null
    changePassword.value = false
    errors.value = {}
  }
}, { immediate: true })

// Reset form when dialog closes
watch(() => props.open, (isOpen) => {
  if (!isOpen) {
    errors.value = {}
    showPassword.value = false
    changePassword.value = false
  }
})

const getInitials = computed(() => {
  const name = formData.value.name?.trim()
  if (!name) return '?'
  const names = name.split(' ')
  if (names.length >= 2) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
  }
  return names[0]?.[0]?.toUpperCase() || '?'
})

const validateForm = () => {
  const newErrors = {}
  
  if (!formData.value.name?.trim()) {
    newErrors.name = 'Name is required'
  }
  
  if (!formData.value.email?.trim()) {
    newErrors.email = 'Email is required'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.value.email)) {
    newErrors.email = 'Invalid email format'
  }
  
  if (changePassword.value && formData.value.password) {
    if (formData.value.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    } else {
      const hasLower = /[a-z]/.test(formData.value.password)
      const hasUpper = /[A-Z]/.test(formData.value.password)
      const hasNumber = /[0-9]/.test(formData.value.password)
      if (!hasLower || !hasUpper || !hasNumber) {
        newErrors.password = 'Password must contain uppercase, lowercase, and numbers'
      }
    }
  }
  
  if (!formData.value.role) {
    newErrors.role = 'Role is required'
  }
  
  errors.value = newErrors
  return Object.keys(newErrors).length === 0
}

const handleFileSelect = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  // Validate file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!validTypes.includes(file.type)) {
    toast.error('Invalid file type', {
      description: 'Please upload a JPG, PNG, or WebP image'
    })
    return
  }

  // Validate file size (5MB max)
  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
    toast.error('File too large', {
      description: 'Image size must be less than 5MB'
    })
    return
  }

  // Show preview
  const reader = new FileReader()
  reader.onload = (e) => {
    profilePreview.value = e.target?.result
  }
  reader.readAsDataURL(file)

  // Upload to ImageKit
  await uploadToImageKit(file)
}

const uploadToImageKit = async (file) => {
  try {
    isUploading.value = true

    // Get authentication parameters from backend
    const authResponse = await api.get('/imagekit-auth')
    const { token, expire, signature } = authResponse.data

    // Prepare form data
    const uploadFormData = new FormData()
    uploadFormData.append('file', file)
    uploadFormData.append('fileName', `user_${Date.now()}_${file.name}`)
    uploadFormData.append('folder', '/user-profiles')
    uploadFormData.append('token', token)
    uploadFormData.append('expire', expire)
    uploadFormData.append('signature', signature)
    uploadFormData.append('publicKey', import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY || '')

    // Upload to ImageKit
    const uploadResponse = await fetch(
      'https://upload.imagekit.io/api/v1/files/upload',
      {
        method: 'POST',
        body: uploadFormData,
      }
    )

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload image')
    }

    const uploadData = await uploadResponse.json()
    formData.value.profilePicture = uploadData.url
    profilePreview.value = uploadData.url

    toast.success('Image uploaded', {
      description: 'Profile picture uploaded successfully'
    })
  } catch (error) {
    console.error('Upload error:', error)
    toast.error('Upload failed', {
      description: 'Failed to upload image. Please try again.'
    })
  } finally {
    isUploading.value = false
  }
}

const removeProfilePicture = () => {
  profilePreview.value = null
  formData.value.profilePicture = null
}

const handleSubmit = async () => {
  if (!validateForm()) return
  if (!props.user?.id) return

  try {
    isSubmitting.value = true
    
    const updateData = {
      name: formData.value.name.trim(),
      email: formData.value.email.toLowerCase().trim(),
      role: formData.value.role,
      isActive: formData.value.isActive,
      profilePicture: formData.value.profilePicture
    }
    
    // Only include password if changing
    if (changePassword.value && formData.value.password) {
      updateData.password = formData.value.password
    }
    
    const result = await updateUser(props.user.id, updateData)

    toast.success('User Updated', {
      description: `${result.user.name} has been updated successfully.`
    })

    emit('updated', result.user)
    emit('update:open', false)
  } catch (error) {
    console.error('Update user error:', error)
    const errorMessage = error.response?.data?.error || 'Failed to update user'
    toast.error('Error', { description: errorMessage })
    
    if (error.response?.data?.error?.includes('email')) {
      errors.value.email = error.response.data.error
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Edit User</DialogTitle>
        <DialogDescription>
          Update user information. Leave password blank to keep current password.
        </DialogDescription>
      </DialogHeader>

      <form @submit.prevent="handleSubmit" class="space-y-6 py-4">
        <!-- Profile Picture Upload -->
        <div class="flex flex-col items-center gap-4">
          <Avatar class="h-20 w-20 border-2 border-border">
            <AvatarImage v-if="profilePreview" :src="profilePreview" alt="Profile preview" />
            <AvatarFallback class="text-xl">{{ getInitials }}</AvatarFallback>
          </Avatar>
          
          <div class="flex items-center gap-2">
            <Label 
              for="edit-profile-upload" 
              class="cursor-pointer inline-flex items-center gap-2 px-3 py-2 text-sm border rounded-md hover:bg-accent transition-colors"
              :class="{ 'pointer-events-none opacity-50': isUploading }"
            >
              <Loader2 v-if="isUploading" class="h-4 w-4 animate-spin" />
              <Upload v-else class="h-4 w-4" />
              {{ isUploading ? 'Uploading...' : 'Change Photo' }}
            </Label>
            <Input
              id="edit-profile-upload"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              class="hidden"
              :disabled="isUploading"
              @change="handleFileSelect"
            />
            <Button 
              v-if="profilePreview && !isUploading"
              type="button" 
              variant="ghost" 
              size="sm"
              @click="removeProfilePicture"
            >
              <X class="h-4 w-4" />
            </Button>
          </div>
        </div>

        <!-- Name Field -->
        <div class="space-y-2">
          <Label for="edit-name">Full Name *</Label>
          <Input
            id="edit-name"
            v-model="formData.name"
            placeholder="Enter full name"
            :class="{ 'border-destructive': errors.name }"
          />
          <p v-if="errors.name" class="text-sm text-destructive">{{ errors.name }}</p>
        </div>

        <!-- Email Field -->
        <div class="space-y-2">
          <Label for="edit-email">Email Address *</Label>
          <Input
            id="edit-email"
            type="email"
            v-model="formData.email"
            placeholder="Enter email address"
            :class="{ 'border-destructive': errors.email }"
          />
          <p v-if="errors.email" class="text-sm text-destructive">{{ errors.email }}</p>
        </div>

        <!-- Change Password Toggle -->
        <div class="flex items-center gap-3">
          <Checkbox 
            id="changePassword"
            :checked="changePassword" 
            @update:checked="changePassword = $event"
          />
          <div class="space-y-0.5">
            <Label for="changePassword" class="cursor-pointer">Change Password</Label>
            <p class="text-sm text-muted-foreground">Enable to set a new password</p>
          </div>
        </div>

        <!-- Password Field (conditional) -->
        <div v-if="changePassword" class="space-y-2">
          <Label for="edit-password">New Password</Label>
          <div class="relative">
            <Input
              id="edit-password"
              :type="showPassword ? 'text' : 'password'"
              v-model="formData.password"
              placeholder="Enter new password"
              :class="{ 'border-destructive': errors.password, 'pr-10': true }"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              class="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
              @click="showPassword = !showPassword"
            >
              <EyeOff v-if="showPassword" class="h-4 w-4 text-muted-foreground" />
              <Eye v-else class="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
          <p v-if="errors.password" class="text-sm text-destructive">{{ errors.password }}</p>
          <p v-else class="text-xs text-muted-foreground">
            Min 8 characters with uppercase, lowercase, and numbers
          </p>
        </div>

        <!-- Role Field -->
        <div class="space-y-2">
          <Label for="edit-role">Role *</Label>
          <Select v-model="formData.role">
            <SelectTrigger :class="{ 'border-destructive': errors.role }">
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="staff">Staff</SelectItem>
              <SelectItem value="mechanic">Mechanic</SelectItem>
            </SelectContent>
          </Select>
          <p v-if="errors.role" class="text-sm text-destructive">{{ errors.role }}</p>
        </div>

        <!-- Active Status -->
        <div class="flex items-center gap-3">
          <Checkbox 
            id="editIsActive"
            :checked="formData.isActive" 
            @update:checked="formData.isActive = $event"
          />
          <div class="space-y-0.5">
            <Label for="editIsActive" class="cursor-pointer">Active Status</Label>
            <p class="text-sm text-muted-foreground">User can login when active</p>
          </div>
        </div>

        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            @click="$emit('update:open', false)"
            :disabled="isSubmitting"
          >
            Cancel
          </Button>
          <Button type="submit" :disabled="isSubmitting || isUploading">
            <Loader2 v-if="isSubmitting" class="mr-2 h-4 w-4 animate-spin" />
            {{ isSubmitting ? 'Saving...' : 'Save Changes' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
