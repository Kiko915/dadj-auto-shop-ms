<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Upload, X, CheckCircle, User, Loader2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'vue-sonner'
import api from '@/api/index'

interface Props {
  name: string
  error?: string
  modelValue?: string | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
  'update:error': [error: string]
}>()

const profileImageFile = ref<File | null>(null)
const profileImagePreview = ref<string | null>(props.modelValue || null)
const isDragging = ref(false)
const isUploading = ref(false)

// Watch for external changes to modelValue (e.g., from localStorage)
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    profileImagePreview.value = newValue
  } else {
    profileImagePreview.value = null
    profileImageFile.value = null
  }
}, { immediate: true })

const getInitials = computed(() => {
  const names = props.name.trim().split(' ')
  if (names.length >= 2) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
  }
  return names[0]?.[0]?.toUpperCase() || '?'
})

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    processFile(target.files[0])
  }
}

const handleDrop = (event: DragEvent) => {
  isDragging.value = false
  if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
    processFile(event.dataTransfer.files[0])
  }
}

const processFile = async (file: File) => {
  // Validate file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!validTypes.includes(file.type)) {
    emit('update:error', 'Please upload a valid image (JPG, PNG, or WebP)')
    return
  }

  // Validate file size (5MB max)
  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) {
    emit('update:error', 'Image size must be less than 5MB')
    return
  }

  profileImageFile.value = file
  emit('update:error', '')

  // Create temporary preview while uploading
  const reader = new FileReader()
  reader.onload = (e) => {
    profileImagePreview.value = e.target?.result as string
  }
  reader.readAsDataURL(file)

  // Upload to ImageKit
  await uploadToImageKit(file)
}

const uploadToImageKit = async (file: File) => {
  try {
    isUploading.value = true

    // Get authentication parameters from backend
    const authResponse = await api.get('/imagekit-auth')
    const { token, expire, signature } = authResponse.data

    // Prepare form data
    const formData = new FormData()
    formData.append('file', file)
    formData.append('fileName', `customer_${Date.now()}_${file.name}`)
    formData.append('folder', '/customer-profiles')
    formData.append('token', token)
    formData.append('expire', expire)
    formData.append('signature', signature)
    // @ts-ignore - Vite environment variable
    formData.append('publicKey', import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY || '')

    // Upload to ImageKit
    const uploadResponse = await fetch(
      'https://upload.imagekit.io/api/v1/files/upload',
      {
        method: 'POST',
        body: formData,
      }
    )

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload image to ImageKit')
    }

    const uploadData = await uploadResponse.json()

    // Update preview with ImageKit URL
    profileImagePreview.value = uploadData.url
    emit('update:modelValue', uploadData.url)

    toast.success('Image Uploaded', {
      description: 'Profile picture uploaded successfully'
    })
  } catch (error) {
    console.error('Upload error:', error)
    
    // Clear the preview on error
    profileImagePreview.value = null
    profileImageFile.value = null
    
    emit('update:error', 'Failed to upload image. Please try again.')
    toast.error('Upload Failed', {
      description: 'Failed to upload image. Please try again.'
    })
  } finally {
    isUploading.value = false
  }
}

const removeProfilePicture = () => {
  profileImageFile.value = null
  profileImagePreview.value = null
  emit('update:modelValue', null)
  emit('update:error', '')
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Profile Picture</CardTitle>
      <CardDescription>Upload a profile picture for the customer (optional)</CardDescription>
    </CardHeader>
    <CardContent class="space-y-4">
      <div class="flex flex-col items-center gap-6 sm:flex-row">
        <!-- Avatar Preview -->
        <Avatar class="h-32 w-32 border-2 border-border">
          <AvatarImage v-if="profileImagePreview" :src="profileImagePreview" alt="Profile preview" />
          <AvatarFallback class="text-2xl">{{ getInitials }}</AvatarFallback>
        </Avatar>

        <!-- Upload Area -->
        <div class="flex-1">
          <div
            v-if="!profileImagePreview"
            class="relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 p-8 transition-colors hover:bg-muted/50"
            :class="{ 
              'border-primary bg-primary/5': isDragging,
              'pointer-events-none opacity-50': isUploading
            }"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
          >
            <Loader2 v-if="isUploading" class="mb-4 h-10 w-10 animate-spin text-primary" />
            <Upload v-else class="mb-4 h-10 w-10 text-muted-foreground" />
            <div class="text-center">
              <p v-if="isUploading" class="mb-2 text-sm font-medium">
                Uploading to ImageKit...
              </p>
              <p v-else class="mb-2 text-sm font-medium">
                Drag and drop your image here, or
              </p>
              <Label
                v-if="!isUploading"
                for="profile-picture"
                class="cursor-pointer text-sm text-primary hover:underline"
              >
                browse files
              </Label>
              <Input
                id="profile-picture"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                class="hidden"
                :disabled="isUploading"
                @change="handleFileSelect"
              />
            </div>
            <p v-if="!isUploading" class="mt-2 text-xs text-muted-foreground">
              JPG, PNG or WebP (Max 5MB)
            </p>
          </div>

          <!-- Image Controls -->
          <div v-else class="flex flex-col gap-2">
            <div class="flex items-center gap-2 rounded-lg bg-muted p-3">
              <CheckCircle class="h-5 w-5 text-green-500" />
              <span class="flex-1 text-sm">Profile picture uploaded</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                :disabled="isUploading"
                @click="removeProfilePicture"
              >
                <X class="h-4 w-4" />
                Remove
              </Button>
            </div>
            <p class="text-xs text-muted-foreground">
              {{ profileImageFile?.name || 'Image from ImageKit' }}
            </p>
          </div>

          <p v-if="error" class="mt-2 text-sm text-destructive">
            {{ error }}
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
