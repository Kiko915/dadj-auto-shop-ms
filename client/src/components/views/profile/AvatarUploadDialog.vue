<script setup>
import { ref, computed } from 'vue'
import { Cropper } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'vue-sonner'
import { Upload, X, Loader2, ImageIcon } from 'lucide-vue-next'
import api from '@/api'
import imagekit from '@/lib/imagekit'

const props = defineProps({
  open: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['update:open', 'uploaded'])

// State
const selectedFile = ref(null)
const imagePreview = ref(null)
const cropper = ref(null)
const isUploading = ref(false)
const uploadProgress = ref(0)

// Computed
const hasImage = computed(() => !!imagePreview.value)

// Handle file selection
const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (!file) return

  // Validate file type
  if (!file.type.startsWith('image/')) {
    toast.error('Invalid File', {
      description: 'Please select an image file'
    })
    return
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    toast.error('File Too Large', {
      description: 'Please select an image smaller than 5MB'
    })
    return
  }

  selectedFile.value = file

  // Create preview
  const reader = new FileReader()
  reader.onload = (e) => {
    imagePreview.value = e.target.result
  }
  reader.readAsDataURL(file)
}

// Trigger file input
const fileInput = ref(null)
const triggerFileInput = () => {
  fileInput.value?.click()
}

// Remove selected image
const removeImage = () => {
  selectedFile.value = null
  imagePreview.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// Get cropped image as blob
const getCroppedImage = () => {
  return new Promise((resolve) => {
    if (!cropper.value) {
      resolve(null)
      return
    }

    const { canvas } = cropper.value.getResult()
    if (!canvas) {
      resolve(null)
      return
    }

    canvas.toBlob((blob) => {
      resolve(blob)
    }, 'image/jpeg', 0.9)
  })
}

// Upload to ImageKit
const handleUpload = async () => {
  if (!hasImage.value) {
    toast.error('No Image', {
      description: 'Please select an image first'
    })
    return
  }

  try {
    isUploading.value = true
    uploadProgress.value = 0

    // Get cropped image
    const croppedBlob = await getCroppedImage()
    if (!croppedBlob) {
      throw new Error('Failed to crop image')
    }

    // Get authentication parameters from backend
    const authResponse = await api.get('/imagekit-auth')
    const { token, expire, signature } = authResponse.data

    // Prepare form data
    const formData = new FormData()
    formData.append('file', croppedBlob, 'profile-picture.jpg')
    formData.append('fileName', `profile_${Date.now()}.jpg`)
    formData.append('folder', '/profile-pictures')
    formData.append('token', token)
    formData.append('expire', expire)
    formData.append('signature', signature)
    formData.append('publicKey', import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY)

    uploadProgress.value = 30

    // Upload to ImageKit (use dedicated upload endpoint)
    const uploadResponse = await fetch(
      'https://upload.imagekit.io/api/v1/files/upload',
      {
        method: 'POST',
        body: formData,
      }
    )

    uploadProgress.value = 60

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload image to ImageKit')
    }

    const uploadData = await uploadResponse.json()
    
    uploadProgress.value = 80

    // Save profile picture URL to database
    const updateResponse = await api.patch('/user/profile-picture', {
      profilePicture: uploadData.url
    })

    uploadProgress.value = 100

    toast.success('Profile Picture Updated', {
      description: 'Your profile picture has been updated successfully'
    })

    // Emit success event with updated user data
    emit('uploaded', updateResponse.data.user)

    // Close dialog and reset
    handleClose()
  } catch (error) {
    console.error('Upload error:', error)
    toast.error('Upload Failed', {
      description: error.message || 'Failed to upload profile picture. Please try again.'
    })
  } finally {
    isUploading.value = false
    uploadProgress.value = 0
  }
}

// Handle dialog close
const handleClose = () => {
  if (isUploading.value) return
  removeImage()
  emit('update:open', false)
}

// Handle cancel
const handleCancel = () => {
  if (isUploading.value) return
  handleClose()
}
</script>

<template>
  <Dialog :open="open" @update:open="handleClose">
    <DialogContent class="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Update Profile Picture</DialogTitle>
        <DialogDescription>
          Upload a new profile picture. You can crop and adjust it before uploading.
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4 py-4">
        <!-- File Input (Hidden) -->
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          class="hidden"
          @change="handleFileSelect"
        />

        <!-- Upload Area or Cropper -->
        <div v-if="!hasImage" class="space-y-4">
          <div
            class="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
            @click="triggerFileInput"
          >
            <div class="flex flex-col items-center gap-3">
              <div class="p-3 bg-primary/10 rounded-full">
                <ImageIcon class="h-8 w-8 text-primary" />
              </div>
              <div>
                <p class="text-sm font-medium">Click to upload an image</p>
                <p class="text-xs text-muted-foreground mt-1">
                  PNG, JPG or JPEG (max. 5MB)
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Image Cropper -->
        <div v-else class="space-y-4">
          <div class="relative border rounded-lg overflow-hidden bg-muted w-full" style="height: 350px;">
            <Cropper
              ref="cropper"
              class="cropper"
              :src="imagePreview"
              :stencil-props="{
                aspectRatio: 1,
              }"
            />
            
            <!-- Remove button -->
            <Button
              variant="destructive"
              size="icon"
              class="absolute top-2 right-2"
              @click="removeImage"
              :disabled="isUploading"
            >
              <X class="h-4 w-4" />
            </Button>
          </div>

          <div class="flex gap-2">
            <Button
              variant="outline"
              class="flex-1"
              @click="triggerFileInput"
              :disabled="isUploading"
            >
              Choose Different Image
            </Button>
          </div>
        </div>

        <!-- Upload Progress -->
        <div v-if="isUploading" class="space-y-2">
          <div class="flex items-center justify-between text-sm">
            <span class="text-muted-foreground">Uploading...</span>
            <span class="font-medium">{{ uploadProgress }}%</span>
          </div>
          <div class="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div
              class="bg-primary h-full transition-all duration-300"
              :style="{ width: `${uploadProgress}%` }"
            ></div>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          @click="handleCancel"
          :disabled="isUploading"
        >
          Cancel
        </Button>
        <Button
          @click="handleUpload"
          :disabled="!hasImage || isUploading"
        >
          <Loader2 v-if="isUploading" class="mr-2 h-4 w-4 animate-spin" />
          <Upload v-else class="mr-2 h-4 w-4" />
          {{ isUploading ? 'Uploading...' : 'Upload' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
.cropper {
  width: 100%;
  height: 100%;
  background: #f5f5f5;
  max-height: 350px;
  max-width: 100%;
}

:deep(.vue-advanced-cropper) {
  max-height: 350px !important;
  height: 350px !important;
  max-width: 100% !important;
  width: 350px !important;
  margin: 0 auto !important;
}

:deep(.vue-advanced-cropper__image-wrapper),
:deep(.vue-advanced-cropper__background),
:deep(.vue-advanced-cropper__foreground) {
  max-height: 350px !important;
  height: 350px !important;
  max-width: 100% !important;
}

:deep(.vue-advanced-cropper__stretcher) {
  max-height: 350px !important;
  max-width: 100% !important;
}

:deep(.vue-advanced-cropper__boundaries) {
  max-width: 100% !important;
}
</style>
