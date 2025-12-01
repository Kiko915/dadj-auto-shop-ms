<script setup>
import { ref, watch } from 'vue'
import { Upload, X, CheckCircle, Loader2, Image as ImageIcon } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'vue-sonner'
import api from '@/api/index'

const props = defineProps({
  modelValue: String,
  error: String,
  label: {
    type: String,
    default: 'Product Image'
  }
})

const emit = defineEmits(['update:modelValue', 'update:error'])

const imageFile = ref(null)
const imagePreview = ref(props.modelValue || null)
const isDragging = ref(false)
const isUploading = ref(false)

watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    imagePreview.value = newValue
  } else {
    imagePreview.value = null
    imageFile.value = null
  }
}, { immediate: true })

const handleFileSelect = (event) => {
  const target = event.target
  if (target.files && target.files[0]) {
    processFile(target.files[0])
  }
}

const handleDrop = (event) => {
  isDragging.value = false
  if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
    processFile(event.dataTransfer.files[0])
  }
}

const processFile = async (file) => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!validTypes.includes(file.type)) {
    emit('update:error', 'Please upload a valid image (JPG, PNG, or WebP)')
    return
  }

  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) {
    emit('update:error', 'Image size must be less than 5MB')
    return
  }

  imageFile.value = file
  emit('update:error', '')

  const reader = new FileReader()
  reader.onload = (e) => {
    imagePreview.value = e.target?.result
  }
  reader.readAsDataURL(file)

  await uploadToImageKit(file)
}

const uploadToImageKit = async (file) => {
  try {
    isUploading.value = true

    const authResponse = await api.get('/imagekit-auth')
    const { token, expire, signature } = authResponse.data

    const formData = new FormData()
    formData.append('file', file)
    formData.append('fileName', `product_${Date.now()}_${file.name}`)
    formData.append('folder', '/inventory')
    formData.append('token', token)
    formData.append('expire', expire)
    formData.append('signature', signature)
    // @ts-ignore
    formData.append('publicKey', import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY || '')

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

    imagePreview.value = uploadData.url
    emit('update:modelValue', uploadData.url)

    toast.success('Image Uploaded', {
      description: 'Product image uploaded successfully'
    })
  } catch (error) {
    console.error('Upload error:', error)
    imagePreview.value = null
    imageFile.value = null
    emit('update:error', 'Failed to upload image. Please try again.')
    toast.error('Upload Failed', {
      description: 'Failed to upload image. Please try again.'
    })
  } finally {
    isUploading.value = false
  }
}

const removeImage = () => {
  imageFile.value = null
  imagePreview.value = null
  emit('update:modelValue', null)
  emit('update:error', '')
}
</script>

<template>
  <div class="space-y-2">
    <Label>{{ label }}</Label>
    <div class="flex flex-col gap-4 sm:flex-row">
      <!-- Preview -->
      <div 
        v-if="imagePreview" 
        class="relative flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted"
      >
        <img :src="imagePreview" alt="Preview" class="h-full w-full object-cover" />
        <Button
          type="button"
          variant="destructive"
          size="icon"
          class="absolute right-1 top-1 h-6 w-6 rounded-full opacity-0 transition-opacity hover:opacity-100 group-hover:opacity-100"
          @click="removeImage"
        >
          <X class="h-3 w-3" />
        </Button>
      </div>
      
      <!-- Upload Area -->
      <div class="flex-1">
        <div
          v-if="!imagePreview"
          class="relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 p-6 transition-colors hover:bg-muted/50"
          :class="{ 
            'border-primary bg-primary/5': isDragging,
            'pointer-events-none opacity-50': isUploading
          }"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handleDrop"
        >
          <Loader2 v-if="isUploading" class="mb-2 h-8 w-8 animate-spin text-primary" />
          <ImageIcon v-else class="mb-2 h-8 w-8 text-muted-foreground" />
          
          <div class="text-center">
            <p v-if="isUploading" class="text-sm font-medium">Uploading...</p>
            <template v-else>
              <p class="text-sm font-medium">Drag & drop or click to upload</p>
              <p class="text-xs text-muted-foreground">JPG, PNG, WebP (Max 5MB)</p>
            </template>
            
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              :disabled="isUploading"
              @change="handleFileSelect"
            />
          </div>
        </div>

        <div v-else class="flex items-center gap-2 rounded-lg bg-muted p-3">
          <CheckCircle class="h-5 w-5 text-green-500" />
          <span class="flex-1 text-sm">Image uploaded successfully</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            @click="removeImage"
          >
            <X class="h-4 w-4 mr-2" />
            Remove
          </Button>
        </div>

        <p v-if="error" class="mt-2 text-sm text-destructive">{{ error }}</p>
      </div>
    </div>
  </div>
</template>
