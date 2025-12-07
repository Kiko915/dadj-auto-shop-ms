<script setup>
import { ref, watch } from 'vue'
import { searchCustomers } from '@/api/customers'
import { getCustomerVehicles } from '@/api/vehicles'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Trash2, 
  Search, 
  User, 
  Car, 
  AlertCircle, 
  Loader2, 
} from 'lucide-vue-next'

const props = defineProps({
  customer: {
    type: Object,
    default: null
  },
  vehicleId: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:customer', 'update:vehicleId'])

// --- State ---

const customerSearch = ref('')
const customers = ref([])
const isCustomerDropdownOpen = ref(false)
const isSearchingCustomers = ref(false)
let customerSearchTimeout

const vehicles = ref([])
const isLoadingVehicles = ref(false)

// --- Watchers ---

// If customer is cleared externally (e.g. from parent), reset local state
watch(() => props.customer, (newVal) => {
    if (!newVal) {
        customerSearch.value = ''
        vehicles.value = []
    }
})

// --- Helpers ---

const getInitials = (firstName, lastName) => {
  return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase()
}

// --- Actions ---

const handleCustomerSearch = (e) => {
  const query = e.target.value
  customerSearch.value = query
  
  if (customerSearchTimeout) clearTimeout(customerSearchTimeout)
  
  if (!query) {
    customers.value = []
    isCustomerDropdownOpen.value = false
    return
  }

  isSearchingCustomers.value = true
  isCustomerDropdownOpen.value = true
  
  customerSearchTimeout = setTimeout(async () => {
    try {
      customers.value = await searchCustomers(query)
    } catch (error) {
      console.error('Customer search failed', error)
      customers.value = []
    } finally {
      isSearchingCustomers.value = false
    }
  }, 300)
}

const selectCustomer = async (selectedCustomer) => {
    // 1. Update Parent
    emit('update:customer', selectedCustomer)
    
    // 2. UI Updates
    customerSearch.value = '' 
    isCustomerDropdownOpen.value = false
    
    // 3. Reset Vehicle
    emit('update:vehicleId', '')
    vehicles.value = []
    isLoadingVehicles.value = true
  
  // 4. Fetch Vehicles
  try {
    const response = await getCustomerVehicles(selectedCustomer.id)
    
    if (Array.isArray(response)) {
        vehicles.value = response
    } else if (response.vehicles) {
         vehicles.value = response.vehicles
    } else if (response.items) {
          vehicles.value = response.items
    } else {
        vehicles.value = []
    }
    
    // Auto-select if only one vehicle
    if (vehicles.value.length === 1) {
      emit('update:vehicleId', vehicles.value[0].id)
    }
  } catch (error) {
    console.error('Failed to fetch vehicles', error)
  } finally {
    isLoadingVehicles.value = false
  }
}

const clearCustomer = () => {
  emit('update:customer', null)
  emit('update:vehicleId', '')
  customerSearch.value = ''
  vehicles.value = []
}

// Handle vehicle selection change
const handleVehicleChange = (newId) => {
    emit('update:vehicleId', newId)
}

// Get selected vehicle object for display
const getSelectedVehicle = () => {
    if (!props.vehicleId) return null
    return vehicles.value.find(v => v.id === props.vehicleId)
}
</script>

<template>
    <Card class="shadow-sm">
        <CardHeader class="pb-4 bg-muted/20 border-b">
            <CardTitle class="text-base font-semibold flex items-center justify-between">
                Customer Details
                <User class="w-4 h-4 text-muted-foreground" />
            </CardTitle>
        </CardHeader>
        <CardContent class="pt-6 space-y-6">
            
            <!-- Customer Search / Display -->
            <div v-if="!customer" class="space-y-3 relative">
                    <Label class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select Customer</Label>
                    <div class="relative">
                    <Search class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        v-model="customerSearch" 
                        @input="handleCustomerSearch"
                        placeholder="Find by name, email, phone..." 
                        class="pl-9"
                    />
                        <!-- Customer Dropdown -->
                    <div v-if="isCustomerDropdownOpen" class="absolute z-20 w-full mt-1 bg-popover text-popover-foreground border rounded-lg shadow-xl max-h-80 overflow-y-auto">
                            <div v-if="isSearchingCustomers" class="p-4 flex justify-center text-sm text-muted-foreground gap-2 items-center"><Loader2 class="w-4 h-4 animate-spin"/></div>
                            <div v-else-if="customers.length === 0" class="p-4 text-sm text-center text-muted-foreground">No customers found.</div>
                            <button 
                            v-else 
                            v-for="c in customers" 
                            :key="c.id" 
                            @click="selectCustomer(c)"
                            class="w-full text-left p-3 hover:bg-accent text-sm border-b last:border-0 flex items-center gap-3 transition-colors"
                            >
                            <Avatar class="h-9 w-9 border border-border">
                                <AvatarImage :src="c.profilePicture" />
                                <AvatarFallback>{{ getInitials(c.firstName, c.lastName) }}</AvatarFallback>
                            </Avatar>
                            <div>
                                <div class="font-medium">{{ c.firstName }} {{ c.lastName }}</div>
                                <div class="text-xs text-muted-foreground">{{ c.email }}</div>
                            </div>
                            </button>
                    </div>
                    </div>
            </div>

            <!-- Selected Customer Display -->
            <div v-else class="relative bg-primary/5 rounded-xl p-4 border border-primary/10">
                <button @click="clearCustomer" class="absolute top-2 right-2 text-muted-foreground hover:text-destructive p-1 rounded-md hover:bg-white/50 transition-colors">
                    <Trash2 class="w-4 h-4" />
                </button>
                
                <div class="flex items-center gap-4 mb-3">
                    <Avatar class="h-14 w-14 border-2 border-white shadow-sm">
                        <AvatarImage :src="customer.profilePicture" />
                        <AvatarFallback class="bg-primary text-primary-foreground text-lg">{{ getInitials(customer.firstName, customer.lastName) }}</AvatarFallback>
                    </Avatar>
                    <div>
                        <div class="font-bold text-lg text-foreground tracking-tight">{{ customer.firstName }} {{ customer.lastName }}</div>
                        <div class="text-xs text-muted-foreground font-medium bg-background px-2 py-0.5 rounded-full inline-block border shadow-sm">{{ customer.loyaltyStatus || 'Regular' }}</div>
                    </div>
                </div>
                
                <div class="space-y-1 text-sm text-muted-foreground pl-1">
                    <div class="flex items-center gap-2"><div class="w-1 h-1 rounded-full bg-primary"></div> {{ customer.email }}</div>
                    <div class="flex items-center gap-2"><div class="w-1 h-1 rounded-full bg-primary"></div> {{ customer.phoneNumber }}</div>
                </div>
            </div>

                <!-- Vehicle Select -->
                <div class="space-y-3 pt-2">
                <Label class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Vehicle</Label>
                
                <div v-if="!customer" class="p-4 bg-muted/40 rounded-lg border border-dashed text-center">
                    <div class="flex justify-center mb-2"><Car class="w-8 h-8 text-muted-foreground/30"/></div>
                    <span class="text-xs text-muted-foreground">Select a customer first</span>
                    </div>

                    <div v-else class="space-y-2">
                        <div v-if="isLoadingVehicles" class="flex items-center gap-2 text-sm text-muted-foreground p-2">
                        <Loader2 class="w-4 h-4 animate-spin"/> Loading vehicles...
                        </div>
                        
                        <Select v-else :model-value="vehicleId" @update:model-value="handleVehicleChange">
                        <SelectTrigger class="h-auto py-3">
                            <SelectValue placeholder="Select vehicle" />
                        </SelectTrigger>
                        <SelectContent class="max-h-[300px]">
                            <SelectItem v-for="v in vehicles" :key="v.id" :value="v.id">
                                <div class="flex items-center gap-2">
                                    {{ v.make }} {{ v.model }} <span class="text-muted-foreground">({{ v.licensePlate }})</span>
                                </div>
                            </SelectItem>
                        </SelectContent>
                        </Select>

                        <!-- Selected Vehicle Info Preview -->
                        <div v-if="getSelectedVehicle()" class="mt-3 p-3 bg-muted/30 rounded-lg border flex gap-3 items-start">
                            <div class="h-16 w-16 bg-background rounded-md border flex items-center justify-center overflow-hidden flex-shrink-0">
                                <img v-if="getSelectedVehicle().imageUrl" :src="getSelectedVehicle().imageUrl" class="h-full w-full object-cover"/>
                                <Car v-else class="w-8 h-8 text-muted-foreground/30"/>
                            </div>
                            <div>
                                <div class="font-semibold text-sm">{{ getSelectedVehicle().year }} {{ getSelectedVehicle().make }} {{ getSelectedVehicle().model }}</div>
                                <div class="text-xs text-muted-foreground">{{ getSelectedVehicle().licensePlate }}</div>
                                <Badge variant="secondary" class="mt-1 text-[10px] h-5">{{ getSelectedVehicle().vehicleType }}</Badge>
                            </div>
                        </div>

                    <div v-if="!isLoadingVehicles && vehicles.length === 0" class="text-xs text-amber-600 flex gap-1.5 items-center p-2 bg-amber-50 rounded border border-amber-100">
                        <AlertCircle class="w-4 h-4"/> This customer has no vehicles registered.
                    </div>
                    </div>
                </div>

        </CardContent>
    </Card>
</template>
