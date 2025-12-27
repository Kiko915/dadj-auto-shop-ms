<script setup>
import { ref, watch } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, Download, FileText, AlertCircle, CheckCircle2 } from 'lucide-vue-next'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { toast } from 'vue-sonner'
import api from '@/api/index'

const props = defineProps({
  open: Boolean
})

const emit = defineEmits(['update:open', 'success'])

const file = ref(null)
const uploading = ref(false)
const error = ref(null)
const successCount = ref(0)
const skippedItems = ref([])

watch(() => props.open, (newVal) => {
  if (newVal) {
    file.value = null
    error.value = null
    successCount.value = 0
    skippedItems.value = []
  }
})

const handleFileChange = (e) => {
  const selectedFile = e.target.files[0]
  if (selectedFile && selectedFile.type === 'text/csv') {
    file.value = selectedFile
    error.value = null
    skippedItems.value = []
  } else {
    file.value = null
    error.value = 'Please select a valid CSV file.'
  }
}

const downloadTemplate = () => {
  const headers = ['Name', 'Brand', 'Category', 'Quantity', 'Buying Price', 'Selling Price', 'Low Stock Threshold', 'Description', 'SKU']
  const sampleRow = ['Sample Item', 'Generic Brand', 'General', '10', '50.00', '75.00', '5', 'Sample description', 'SKU-123']
  
  const csvContent = [
    headers.join(','),
    sampleRow.join(',')
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'inventory_template.csv'
  a.click()
  window.URL.revokeObjectURL(url)
}

const handleUpload = async () => {
  if (!file.value) return

  uploading.value = true
  error.value = null
  successCount.value = 0
  skippedItems.value = []

  const formData = new FormData()
  formData.append('file', file.value)

  try {
    const res = await api.post('/inventory/bulk-upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    successCount.value = res.data.message
    if (res.data.skipped && res.data.skipped.length > 0) {
      skippedItems.value = res.data.skipped
      toast.warning('Upload Completed with Issues', {
        description: `Uploaded items, but skipped ${res.data.skipped.length} rows.`
      })
    } else {
      toast.success('Upload Successful', {
        description: res.data.message
      })
      setTimeout(() => {
        emit('update:open', false)
        file.value = null
      }, 1500)
    }
    
    emit('success')

  } catch (err) {
    console.error('Upload failed', err)
    // Check if it's a 400 error with skipped items (e.g. no valid items found)
    if (err.response?.data?.skipped) {
        skippedItems.value = err.response.data.skipped
        error.value = err.response.data.message
    } else {
        error.value = err.response?.data?.message || 'Failed to upload file.'
    }
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Bulk Upload Inventory</DialogTitle>
        <DialogDescription>
          Upload a CSV file to add multiple items at once.
        </DialogDescription>
      </DialogHeader>

      <div class="grid gap-4 py-4">
        <div class="flex items-center justify-between">
            <Label>Template</Label>
            <Button variant="outline" size="sm" @click="downloadTemplate">
                <Download class="mr-2 h-4 w-4" />
                Download CSV Template
            </Button>
        </div>

        <div class="rounded-md bg-muted p-4 text-sm text-muted-foreground">
          <p class="font-medium text-foreground mb-2">Formatting Guide:</p>
          <ul class="list-disc pl-4 space-y-1">
            <li><strong>Required:</strong> Name, Brand, Buying Price, Selling Price</li>
            <li><strong>Optional:</strong> Category, Quantity (default 0), Low Stock Threshold (default 5), Description, SKU</li>
            <li><strong>Note:</strong> Prices must be numbers. Quantity must be a whole number.</li>
          </ul>
        </div>

        <div class="grid w-full max-w-sm items-center gap-1.5">
          <Label for="csv-file">Upload CSV</Label>
          <Input id="csv-file" type="file" accept=".csv" @change="handleFileChange" />
        </div>

        <Alert v-if="error" variant="destructive">
          <AlertCircle class="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {{ error }}
          </AlertDescription>
        </Alert>

        <Alert v-if="successCount" class="border-green-500 text-green-600">
            <CheckCircle2 class="h-4 w-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>
                {{ successCount }}
            </AlertDescription>
        </Alert>

        <div v-if="skippedItems.length > 0" class="rounded-md bg-yellow-50 p-4 border border-yellow-200">
          <div class="flex items-center gap-2 text-yellow-800 mb-2">
            <AlertCircle class="h-4 w-4" />
            <h4 class="font-medium text-sm">Skipped Items ({{ skippedItems.length }})</h4>
          </div>
          <div class="max-h-40 overflow-y-auto text-xs text-yellow-700 space-y-1">
            <div v-for="(item, index) in skippedItems" :key="index" class="flex gap-2">
              <span class="font-mono font-semibold">Row {{ item.row }}:</span>
              <span>{{ item.reason }}</span>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="$emit('update:open', false)">Cancel</Button>
        <Button @click="handleUpload" :disabled="!file || uploading">
          <Upload v-if="!uploading" class="mr-2 h-4 w-4" />
          <span v-else class="mr-2 h-4 w-4 animate-spin">⏳</span>
          {{ uploading ? 'Uploading...' : 'Upload' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
