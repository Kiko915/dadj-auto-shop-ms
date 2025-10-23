<script setup>
import { ref, computed, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Mail,
  MapPin,
  User,
  Loader2,
} from 'lucide-vue-next'

// Import Philippine address data
import regionsData from '@/lib/ph-json/region.json'
import provincesData from '@/lib/ph-json/province.json'
import citiesData from '@/lib/ph-json/city.json'
import barangaysData from '@/lib/ph-json/barangay.json'

const props = defineProps({
  open: {
    type: Boolean,
    required: true
  },
  user: {
    type: Object,
    required: true
  },
  isSaving: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:open', 'save', 'cancel'])

// Form state
const editForm = ref({
  name: '',
  email: '',
  street: '',
})

// Form errors
const formErrors = ref({
  name: '',
})

// Address selection state
const selectedRegion = ref('')
const selectedProvince = ref('')
const selectedCity = ref('')
const selectedBarangay = ref('')
const isLoadingAddress = ref(false)

// Filtered address data
const filteredProvinces = computed(() => {
  if (!selectedRegion.value) return []
  return provincesData.filter(p => p.region_code === selectedRegion.value)
})

const filteredCities = computed(() => {
  if (!selectedProvince.value) return []
  return citiesData.filter(c => c.province_code === selectedProvince.value)
})

const filteredBarangays = computed(() => {
  if (!selectedCity.value) return []
  return barangaysData.filter(b => b.city_code === selectedCity.value)
})

// Watchers with loading guard
watch(selectedRegion, () => {
  if (isLoadingAddress.value) return
  selectedProvince.value = ''
  selectedCity.value = ''
  selectedBarangay.value = ''
})

watch(selectedProvince, () => {
  if (isLoadingAddress.value) return
  selectedCity.value = ''
  selectedBarangay.value = ''
})

watch(selectedCity, () => {
  if (isLoadingAddress.value) return
  selectedBarangay.value = ''
})

// Watch for dialog open to populate form
watch(() => props.open, (isOpen) => {
  if (isOpen) {
    populateForm()
  }
})

// Helper to find address codes from names
const findAddressCodes = () => {
  let regionCode = ''
  let provinceCode = ''
  let cityCode = ''
  let barangayCode = ''

  if (props.user.region) {
    const region = regionsData.find(r => r.region_name === props.user.region)
    if (region) regionCode = region.region_code
  }

  if (props.user.province && regionCode) {
    const province = provincesData.find(p => 
      p.province_name === props.user.province && p.region_code === regionCode
    )
    if (province) provinceCode = province.province_code
  }

  if (props.user.city && provinceCode) {
    const city = citiesData.find(c => 
      c.city_name === props.user.city && c.province_code === provinceCode
    )
    if (city) cityCode = city.city_code
  }

  if (props.user.barangay && cityCode) {
    const barangay = barangaysData.find(b => 
      b.brgy_name === props.user.barangay && b.city_code === cityCode
    )
    if (barangay) barangayCode = barangay.brgy_code
  }

  return { regionCode, provinceCode, cityCode, barangayCode }
}

// Populate form with user data
const populateForm = () => {
  editForm.value = {
    name: props.user.name || '',
    email: props.user.email || '',
    street: props.user.street || '',
  }
  
  formErrors.value = { name: '' }
  
  // Load address with guard
  isLoadingAddress.value = true
  const { regionCode, provinceCode, cityCode, barangayCode } = findAddressCodes()
  selectedRegion.value = regionCode
  selectedProvince.value = provinceCode
  selectedCity.value = cityCode
  selectedBarangay.value = barangayCode
  
  setTimeout(() => {
    isLoadingAddress.value = false
  }, 0)
}

// Validation
const validateForm = () => {
  formErrors.value = { name: '' }
  
  if (!editForm.value.name || editForm.value.name.trim().length === 0) {
    formErrors.value.name = 'Name is required'
    return false
  }
  
  if (editForm.value.name.trim().length < 2) {
    formErrors.value.name = 'Name must be at least 2 characters long'
    return false
  }
  
  return true
}

// Check address completion
const checkAddressCompletion = () => {
  const hasAny = selectedRegion.value || selectedProvince.value || selectedCity.value || selectedBarangay.value
  const hasComplete = selectedRegion.value && selectedProvince.value && selectedCity.value && selectedBarangay.value
  return { hasAny, hasComplete }
}

// Handle save
const handleSave = () => {
  if (!validateForm()) {
    emit('save', { 
      isValid: false, 
      error: formErrors.value.name 
    })
    return
  }

  const { hasAny, hasComplete } = checkAddressCompletion()
  
  if (hasAny && !hasComplete) {
    emit('save', { 
      isValid: false, 
      error: 'Please complete all address fields (Region, Province, City, and Barangay) or leave them all empty',
      type: 'address'
    })
    return
  }

  // Build profile data
  let profileData = {
    name: editForm.value.name.trim(),
    street: editForm.value.street?.trim() || null,
  }

  if (hasComplete) {
    const region = regionsData.find(r => r.region_code === selectedRegion.value)
    const province = provincesData.find(p => p.province_code === selectedProvince.value)
    const city = citiesData.find(c => c.city_code === selectedCity.value)
    const barangay = barangaysData.find(b => b.brgy_code === selectedBarangay.value)

    profileData = {
      ...profileData,
      region: region?.region_name || null,
      province: province?.province_name || null,
      city: city?.city_name || null,
      barangay: barangay?.brgy_name || null,
    }
  } else {
    profileData = {
      ...profileData,
      region: null,
      province: null,
      city: null,
      barangay: null,
    }
  }

  emit('save', { isValid: true, data: profileData })
}

const handleCancel = () => {
  emit('cancel')
}

const handleOpenChange = (value) => {
  emit('update:open', value)
}
</script>

<template>
  <Dialog :open="open" @update:open="handleOpenChange">
    <DialogContent class="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogDescription>
          Update your personal information and address details
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4 py-4">
        <!-- Name Field -->
        <div class="space-y-2">
          <Label for="edit-name">Full Name <span class="text-red-500">*</span></Label>
          <div class="relative">
            <User class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="edit-name"
              v-model="editForm.name"
              placeholder="Enter your full name"
              class="pl-10"
              :class="{ 'border-red-500': formErrors.name }"
            />
          </div>
          <p v-if="formErrors.name" class="text-xs text-red-500">
            {{ formErrors.name }}
          </p>
        </div>

        <!-- Email Field (Read-only) -->
        <div class="space-y-2">
          <Label for="edit-email">Email Address</Label>
          <div class="relative">
            <Mail class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="edit-email"
              v-model="editForm.email"
              type="email"
              disabled
              class="pl-10 bg-muted"
            />
          </div>
          <p class="text-xs text-muted-foreground">Email cannot be changed</p>
        </div>

        <Separator />

        <!-- Address Fields -->
        <div class="space-y-4">
          <div class="flex items-center gap-2">
            <MapPin class="h-4 w-4 text-muted-foreground" />
            <h4 class="text-sm font-medium">Address Information</h4>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <!-- Region Selection -->
            <div class="space-y-2">
              <Label for="edit-region">Region</Label>
              <Select v-model="selectedRegion">
                <SelectTrigger id="edit-region">
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Philippine Regions</SelectLabel>
                    <SelectItem 
                      v-for="region in regionsData" 
                      :key="region.region_code"
                      :value="region.region_code"
                    >
                      {{ region.region_name }}
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <!-- Province Selection -->
            <div class="space-y-2">
              <Label for="edit-province">Province</Label>
              <Select v-model="selectedProvince" :disabled="!selectedRegion">
                <SelectTrigger id="edit-province">
                  <SelectValue placeholder="Select province" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Provinces</SelectLabel>
                    <SelectItem 
                      v-for="province in filteredProvinces" 
                      :key="province.province_code"
                      :value="province.province_code"
                    >
                      {{ province.province_name }}
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <p v-if="!selectedRegion" class="text-xs text-muted-foreground">
                Select a region first
              </p>
            </div>

            <!-- City/Municipality Selection -->
            <div class="space-y-2">
              <Label for="edit-city">City/Municipality</Label>
              <Select v-model="selectedCity" :disabled="!selectedProvince">
                <SelectTrigger id="edit-city">
                  <SelectValue placeholder="Select city/municipality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Cities/Municipalities</SelectLabel>
                    <SelectItem 
                      v-for="city in filteredCities" 
                      :key="city.city_code"
                      :value="city.city_code"
                    >
                      {{ city.city_name }}
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <p v-if="!selectedProvince" class="text-xs text-muted-foreground">
                Select a province first
              </p>
            </div>

            <!-- Barangay Selection -->
            <div class="space-y-2">
              <Label for="edit-barangay">Barangay</Label>
              <Select v-model="selectedBarangay" :disabled="!selectedCity">
                <SelectTrigger id="edit-barangay">
                  <SelectValue placeholder="Select barangay" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Barangays</SelectLabel>
                    <SelectItem 
                      v-for="barangay in filteredBarangays" 
                      :key="barangay.brgy_code"
                      :value="barangay.brgy_code"
                    >
                      {{ barangay.brgy_name }}
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <p v-if="!selectedCity" class="text-xs text-muted-foreground">
                Select a city/municipality first
              </p>
            </div>

            <!-- Street Address -->
            <div class="space-y-2 sm:col-span-2">
              <Label for="edit-street">Street Address</Label>
              <Input
                id="edit-street"
                v-model="editForm.street"
                placeholder="Enter house/building number and street name"
              />
            </div>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="handleCancel" :disabled="isSaving">
          Cancel
        </Button>
        <Button @click="handleSave" :disabled="isSaving">
          <Loader2 v-if="isSaving" class="mr-2 h-4 w-4 animate-spin" />
          {{ isSaving ? 'Saving...' : 'Save Changes' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
