<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, RefreshCw, Plus, X } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { addInventoryItem, updateInventoryItem, getCategories, getBrands } from '@/api/inventory'
import ImageUpload from '@/components/common/ImageUpload.vue'
import { Separator } from '@/components/ui/separator'

const props = defineProps({
  open: Boolean,
  item: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:open', 'success'])

const isSubmitting = ref(false)
const isImageUploading = ref(false)
const existingCategories = ref([])
const existingBrands = ref([])
const isCustomCategory = ref(false)
const isCustomBrand = ref(false)

const form = reactive({
  name: '',
  brand: '',
  customBrand: '',
  category: '',
  customCategory: '',
  quantity: 0,
  buyingPrice: '',
  sellingPrice: '',
  lowStockThreshold: 5,
  sku: '',
  description: '',
  imageUrl: '',
  imageFileId: ''
})

const errors = reactive({
  name: '',
  brand: '',
  buyingPrice: '',
  sellingPrice: '',
  imageUrl: ''
})

const fetchData = async () => {
  try {
    const [categories, brands] = await Promise.all([
      getCategories(),
      getBrands()
    ])
    existingCategories.value = categories
    existingBrands.value = brands
  } catch (error) {
    console.error('Failed to fetch form data', error)
  }
}

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    fetchData()
    if (props.item) {
      populateForm(props.item)
    } else {
      resetForm()
    }
  }
})

const populateForm = (item) => {
  form.name = item.name
  form.brand = item.brand
  form.category = item.category
  form.quantity = item.quantity
  form.buyingPrice = item.buyingPrice
  form.sellingPrice = item.sellingPrice
  form.lowStockThreshold = item.lowStockThreshold
  form.sku = item.sku
  form.description = item.description
  form.imageUrl = item.imageUrl
  form.imageFileId = item.imageFileId || ''
  
  // Handle custom values if needed, though for now we assume they exist in lists or are just set
  isCustomBrand.value = false
  isCustomCategory.value = false
}

const resetForm = () => {
  form.name = ''
  form.brand = ''
  form.customBrand = ''
  form.category = ''
  form.customCategory = ''
  form.quantity = 0
  form.buyingPrice = ''
  form.sellingPrice = ''
  form.lowStockThreshold = 5
  form.sku = ''
  form.description = ''
  form.imageUrl = ''
  form.imageFileId = ''
  isCustomCategory.value = false
  isCustomBrand.value = false
  
  // Reset errors
  Object.keys(errors).forEach(key => errors[key] = '')
}

const generateSKU = () => {
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.random().toString(36).substring(2, 5).toUpperCase()
  const brandToUse = isCustomBrand.value ? form.customBrand : form.brand
  const prefix = brandToUse ? brandToUse.substring(0, 3).toUpperCase() : 'INV'
  form.sku = `${prefix}-${timestamp}-${random}`
}

const handleCategoryChange = (value) => {
  if (value === 'custom') {
    isCustomCategory.value = true
    form.category = ''
  } else {
    isCustomCategory.value = false
    form.category = value
  }
}

const handleBrandChange = (value) => {
  if (value === 'custom') {
    isCustomBrand.value = true
    form.brand = ''
  } else {
    isCustomBrand.value = false
    form.brand = value
  }
}

const handleSubmit = async () => {
  // Validation
  let isValid = true
  const brandValue = isCustomBrand.value ? form.customBrand : form.brand
  
  errors.name = !form.name ? 'Item name is required' : ''
  errors.brand = !brandValue ? 'Brand is required' : ''
  errors.buyingPrice = !form.buyingPrice ? 'Buying price is required' : ''
  errors.sellingPrice = !form.sellingPrice ? 'Selling price is required' : ''

  if (Object.values(errors).some(e => e)) isValid = false

  if (!isValid) {
    toast.error('Validation Error', {
      description: 'Please check the form for errors.'
    })
    return
  }

  isSubmitting.value = true
  try {
    const payload = {
      ...form,
      brand: brandValue,
      category: isCustomCategory.value ? form.customCategory : form.category
    }
    
    console.log('AddItemModal: Submitting payload:', payload)
    
    // Remove temporary fields
    delete payload.customBrand
    delete payload.customCategory

    if (props.item) {
      await updateInventoryItem(props.item.id, payload)
      toast.success('Item Updated', {
        description: `${form.name} has been updated.`
      })
    } else {
      await addInventoryItem(payload)
      toast.success('Item Added', {
        description: `${form.name} has been added to inventory.`
      })
    }
    
    emit('success')
    emit('update:open', false)
    resetForm()
  } catch (error) {
    toast.error(props.item ? 'Failed to Update Item' : 'Failed to Add Item', {
      description: 'An error occurred while saving.'
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="(val) => $emit('update:open', val)">
    <DialogContent class="max-w-3xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle class="text-xl">{{ item ? 'Edit Product' : 'Add New Product' }}</DialogTitle>
        <DialogDescription>
          {{ item ? 'Update the details of your inventory item.' : 'Add a new item to your inventory. Fill in the details below.' }}
        </DialogDescription>
      </DialogHeader>

      <div class="grid gap-6 py-4">
        <!-- Section 1: Basic Information -->
        <div class="space-y-4">
          <h3 class="text-sm font-medium text-muted-foreground uppercase tracking-wider">Basic Information</h3>
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-2">
              <Label for="name">Item Name <span class="text-destructive">*</span></Label>
              <Input 
                id="name" 
                v-model="form.name" 
                placeholder="e.g. Fully Synthetic Oil 5W-30" 
                :class="{ 'border-destructive': errors.name }"
              />
              <p v-if="errors.name" class="text-xs text-destructive">{{ errors.name }}</p>
            </div>

            <!-- Brand Selection -->
            <div class="space-y-2">
              <Label>Brand <span class="text-destructive">*</span></Label>
              <div v-if="!isCustomBrand" class="flex gap-2">
                <Select :model-value="form.brand" @update:model-value="handleBrandChange">
                  <SelectTrigger class="w-full" :class="{ 'border-destructive': errors.brand }">
                    <SelectValue placeholder="Select brand" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="brand in existingBrands" :key="brand" :value="brand">
                      {{ brand }}
                    </SelectItem>
                    <Separator class="my-2" />
                    <SelectItem value="custom" class="text-primary font-medium">
                      <div class="flex items-center gap-2">
                        <Plus class="h-4 w-4" /> Add New Brand
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div v-else class="flex gap-2">
                <Input 
                  v-model="form.customBrand" 
                  placeholder="Enter new brand name" 
                  :class="{ 'border-destructive': errors.brand }"
                />
                <Button variant="ghost" size="icon" @click="isCustomBrand = false">
                  <X class="h-4 w-4" />
                </Button>
              </div>
              <p v-if="errors.brand" class="text-xs text-destructive">{{ errors.brand }}</p>
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <!-- Category Selection -->
            <div class="space-y-2">
              <Label>Category</Label>
              <div v-if="!isCustomCategory" class="flex gap-2">
                <Select :model-value="form.category" @update:model-value="handleCategoryChange">
                  <SelectTrigger class="w-full">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="cat in existingCategories" :key="cat" :value="cat">
                      {{ cat }}
                    </SelectItem>
                    <Separator class="my-2" />
                    <SelectItem value="custom" class="text-primary font-medium">
                      <div class="flex items-center gap-2">
                        <Plus class="h-4 w-4" /> Add New Category
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div v-else class="flex gap-2">
                <Input v-model="form.customCategory" placeholder="Enter new category name" />
                <Button variant="ghost" size="icon" @click="isCustomCategory = false">
                  <X class="h-4 w-4" />
                </Button>
              </div>
            </div>

            <!-- SKU Generation -->
            <div class="space-y-2">
              <Label for="sku">SKU / Part Number</Label>
              <div class="flex gap-2">
                <Input id="sku" v-model="form.sku" placeholder="Optional" />
                <Button variant="outline" size="icon" @click="generateSKU" title="Generate SKU">
                  <RefreshCw class="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          <div class="space-y-2">
            <Label for="description">Description</Label>
            <Textarea 
              id="description" 
              v-model="form.description" 
              placeholder="Additional details, compatible models, etc." 
              class="h-20"
            />
          </div>
        </div>

        <Separator />

        <!-- Section 2: Stock & Pricing -->
        <div class="space-y-4">
          <h3 class="text-sm font-medium text-muted-foreground uppercase tracking-wider">Stock & Pricing</h3>
          <div class="grid gap-4 sm:grid-cols-4">
            <div class="space-y-2">
              <Label for="quantity">Initial Stock</Label>
              <Input id="quantity" type="number" v-model="form.quantity" min="0" />
            </div>

            <div class="space-y-2">
              <Label for="threshold">Low Stock Alert</Label>
              <Input id="threshold" type="number" v-model="form.lowStockThreshold" min="1" />
            </div>

            <div class="space-y-2">
              <Label for="buyingPrice">Buying Price (₱) <span class="text-destructive">*</span></Label>
              <Input 
                id="buyingPrice" 
                type="number" 
                v-model="form.buyingPrice" 
                min="0" 
                step="0.01" 
                placeholder="0.00"
                :class="{ 'border-destructive': errors.buyingPrice }"
              />
            </div>

            <div class="space-y-2">
              <Label for="sellingPrice">Selling Price (₱) <span class="text-destructive">*</span></Label>
              <Input 
                id="sellingPrice" 
                type="number" 
                v-model="form.sellingPrice" 
                min="0" 
                step="0.01" 
                placeholder="0.00"
                :class="{ 'border-destructive': errors.sellingPrice }"
              />
            </div>
          </div>
        </div>

        <Separator />

        <!-- Section 3: Media -->
        <div class="space-y-4">
          <h3 class="text-sm font-medium text-muted-foreground uppercase tracking-wider">Media</h3>
          <ImageUpload 
            v-model="form.imageUrl" 
            :error="errors.imageUrl"
            @update:error="(val) => errors.imageUrl = val"
            @update:fileId="(val) => form.imageFileId = val"
            @upload-start="isImageUploading = true"
            @upload-end="isImageUploading = false"
          />
        </div>
      </div>

      <DialogFooter class="gap-2 sm:gap-0">
        <Button variant="outline" @click="$emit('update:open', false)">Cancel</Button>
        <Button @click="handleSubmit" :disabled="isSubmitting || isImageUploading" class="ml-2">
          <Loader2 v-if="isSubmitting || isImageUploading" class="mr-2 h-4 w-4 animate-spin" />
          {{ isImageUploading ? 'Uploading Image...' : (item ? 'Update Product' : 'Save Product') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
