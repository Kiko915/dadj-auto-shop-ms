<script setup>
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
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
import UserAvatar from '@/components/views/UserAvatar.vue'
import {
  Mail,
  Shield,
  Calendar,
  Edit,
  CheckCircle,
  MapPin,
  User,
} from 'lucide-vue-next'

// Import Philippine address data
import regionsData from '@/lib/ph-json/region.json'
import provincesData from '@/lib/ph-json/province.json'
import citiesData from '@/lib/ph-json/city.json'
import barangaysData from '@/lib/ph-json/barangay.json'

const authStore = useAuthStore()

// Dialog state
const isEditDialogOpen = ref(false)

// Address selection state
const selectedRegion = ref('')
const selectedProvince = ref('')
const selectedCity = ref('')
const selectedBarangay = ref('')

// Filtered address data based on selections
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

// Watch for address changes and reset dependent selections
watch(selectedRegion, () => {
  selectedProvince.value = ''
  selectedCity.value = ''
  selectedBarangay.value = ''
})

watch(selectedProvince, () => {
  selectedCity.value = ''
  selectedBarangay.value = ''
})

watch(selectedCity, () => {
  selectedBarangay.value = ''
})

// Form state for editing
const editForm = ref({
  name: authStore.userName || '',
  email: authStore.userEmail || '',
  street: authStore.street || '',
  city: authStore.city || '',
  province: authStore.province || '',
  country: authStore.country || 'Philippines',
})

// Format role for display
const displayRole = computed(() => {
  const role = authStore.userRole || 'user'
  return role.charAt(0).toUpperCase() + role.slice(1)
})

// Format joined date
const joinedDate = computed(() => {
  const date = authStore.createdAt ? new Date(authStore.createdAt) : new Date()
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
})

// Actions
const handleEditProfile = () => {
  // Populate form with current data
  editForm.value = {
    name: authStore.userName || '',
    email: authStore.userEmail || '',
    street: authStore.street || '',
    city: authStore.city || '',
    province: authStore.province || '',
    country: authStore.country || 'Philippines',
  }
  
  // Reset address selections when opening dialog
  selectedRegion.value = ''
  selectedProvince.value = ''
  selectedCity.value = ''
  selectedBarangay.value = ''
  
  isEditDialogOpen.value = true
}

const handleSaveProfile = () => {
  // Update form with selected address data
  const region = regionsData.find(r => r.region_code === selectedRegion.value)
  const province = provincesData.find(p => p.province_code === selectedProvince.value)
  const city = citiesData.find(c => c.city_code === selectedCity.value)
  const barangay = barangaysData.find(b => b.brgy_code === selectedBarangay.value)
  
  // Construct the full address
  const addressParts = [
    barangay?.brgy_name,
    city?.city_name,
    province?.province_name,
    region?.region_name
  ].filter(Boolean)
  
  // Update editForm with new address values
  editForm.value.province = province?.province_name || ''
  editForm.value.city = city?.city_name || ''
  
  // To be implemented - will call API to update profile
  console.log('Saving profile:', {
    ...editForm.value,
    region: region?.region_name,
    barangay: barangay?.brgy_name,
    fullAddress: addressParts.join(', ')
  })
  
  isEditDialogOpen.value = false
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
      <CardContent class="space-y-6">
        <!-- Avatar Section -->
        <div class="flex items-center gap-6">
          <UserAvatar 
            :email="authStore.userEmail" 
            :profile-picture="authStore.profilePicture"
            size="lg"
            class="h-20 w-20"
          />
          <div class="space-y-1">
            <h3 class="text-lg font-semibold">
              {{ authStore.userName || authStore.userEmail?.split('@')[0] }}
            </h3>
            <p class="text-sm text-muted-foreground">
              {{ authStore.userEmail }}
            </p>
            <Badge variant="outline" class="bg-primary/10 text-primary border-primary/20">
              {{ displayRole }}
            </Badge>
          </div>
        </div>

        <Separator />

        <!-- User Details -->
        <div class="grid gap-6 sm:grid-cols-2">
          <div class="space-y-2">
            <div class="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Mail class="h-4 w-4" />
              Email Address
            </div>
            <p class="text-sm font-medium">{{ authStore.userEmail }}</p>
          </div>

          <div class="space-y-2">
            <div class="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Shield class="h-4 w-4" />
              Role
            </div>
            <p class="text-sm font-medium">{{ displayRole }}</p>
          </div>

          <div class="space-y-2">
            <div class="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Calendar class="h-4 w-4" />
              Member Since
            </div>
            <p class="text-sm font-medium">{{ joinedDate }}</p>
          </div>

          <div class="space-y-2">
            <div class="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CheckCircle class="h-4 w-4" />
              Account Status
            </div>
            <Badge variant="outline" class="bg-green-50 text-green-700 border-green-200">
              <div class="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></div>
              Active
            </Badge>
          </div>
        </div>

        <Separator />

        <!-- Address Section -->
        <div>
          <div class="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-4">
            <MapPin class="h-4 w-4" />
            Address
          </div>
          
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-1">
              <p class="text-xs font-medium text-muted-foreground">Street</p>
              <p class="text-sm font-medium">
                {{ authStore.street || 'Not provided' }}
              </p>
            </div>

            <div class="space-y-1">
              <p class="text-xs font-medium text-muted-foreground">City</p>
              <p class="text-sm font-medium">
                {{ authStore.city || 'Not provided' }}
              </p>
            </div>

            <div class="space-y-1">
              <p class="text-xs font-medium text-muted-foreground">Province</p>
              <p class="text-sm font-medium">
                {{ authStore.province || 'Not provided' }}
              </p>
            </div>

            <div class="space-y-1">
              <p class="text-xs font-medium text-muted-foreground">Country</p>
              <p class="text-sm font-medium">
                {{ authStore.country || 'Philippines' }}
              </p>
            </div>
          </div>
        </div>

        <Separator />

        <!-- Actions -->
        <div class="flex justify-end">
          <Button @click="handleEditProfile" class="gap-2">
            <Edit class="h-4 w-4" />
            Edit Profile
          </Button>
        </div>
      </CardContent>
    </Card>

    <!-- Edit Profile Dialog -->
    <Dialog v-model:open="isEditDialogOpen">
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
            <Label for="edit-name">Full Name</Label>
            <div class="relative">
              <User class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="edit-name"
                v-model="editForm.name"
                placeholder="Enter your full name"
                class="pl-10"
              />
            </div>
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
          <Button variant="outline" @click="handleCancelEdit">
            Cancel
          </Button>
          <Button @click="handleSaveProfile">
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
