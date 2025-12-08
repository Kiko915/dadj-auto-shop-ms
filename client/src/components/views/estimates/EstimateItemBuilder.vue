<script setup>
import { ref } from 'vue'
import { getInventory } from '@/api/inventory'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
  Plus, 
  Search, 
  FileText, 
  AlertCircle, 
  Loader2, 
  Wrench
} from 'lucide-vue-next'

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:items'])

// --- State ---

const newItem = ref({
  type: 'PART', // PART | LABOR
  name: '',
  description: '',
  quantity: 1,
  price: 0,
  inventoryItemId: null,
  stock: null, // For validation
  imageUrl: null // For display
})

// Item Search (Parts)
const partSearch = ref('')
const parts = ref([])
const isPartDropdownOpen = ref(false)
const isSearchingParts = ref(false)
let partSearchTimeout

// --- Actions ---

const handlePartSearch = (e) => {
  const query = e.target.value
  partSearch.value = query
  newItem.value.name = query // Bind text input too if manual entry (LABOR) or free text PART
  
  if (newItem.value.type === 'LABOR') return // No search for labor

  if (partSearchTimeout) clearTimeout(partSearchTimeout)
  
  if (!query) {
    parts.value = []
    isPartDropdownOpen.value = false
    return
  }

  isSearchingParts.value = true
  isPartDropdownOpen.value = true
  
  partSearchTimeout = setTimeout(async () => {
    try {
      const response = await getInventory({ search: query, limit: 10 })
      parts.value = response.items || []
    } catch (error) {
      console.error('Part search failed', error)
      parts.value = []
    } finally {
      isSearchingParts.value = false
    }
  }, 300)
}

const selectPart = (part) => {
  newItem.value.name = `${part.brand ? part.brand + ' ' : ''}${part.name}`
  partSearch.value = newItem.value.name
  newItem.value.description = part.description || ''
  newItem.value.price = part.sellingPrice
  newItem.value.inventoryItemId = part.id
  newItem.value.stock = part.quantity // For validation
  newItem.value.imageUrl = part.imageUrl // Store image for potential display logic
  
  isPartDropdownOpen.value = false
}

const addItem = () => {
  // Validation Checks
  if (!newItem.value.name) {
    toast.error('Item name is required.')
    return
  }

  const qty = Number(newItem.value.quantity)
  const price = Number(newItem.value.price)

  if (isNaN(qty) || qty <= 0) {
    const label = newItem.value.type === 'LABOR' ? 'Hours' : 'Quantity'
    toast.error(`${label} must be greater than 0.`)
    return
  }

  // Price validation: must be > 0 for parts, non-negative for others
  if (newItem.value.type === 'PART' && (isNaN(price) || price <= 0)) {
    toast.error('Price must be greater than 0 for parts.')
    return
  }
  
  if (isNaN(price) || price < 0) {
    toast.error('Price cannot be negative.')
    return
  }

  // Stock validation for parts
  if (newItem.value.type === 'PART' && newItem.value.stock !== null) {
      if (qty > newItem.value.stock) {
          toast.error(`Insufficient stock. Only ${newItem.value.stock} available.`)
          return
      }
  }

  const updatedItems = [...props.items, {
    ...newItem.value,
    quantity: qty, // Ensure we store number
    price: price, // Ensure we store number
    total: qty * price
  }]
  
  emit('update:items', updatedItems)

  // Reset new item input
  newItem.value = {
    type: newItem.value.type, // Keep last selected type
    name: '',
    description: '',
    quantity: 1,
    price: 0,
    inventoryItemId: null,
    stock: null,
    imageUrl: null
  }
  partSearch.value = ''
}

const removeItem = (index) => {
  const updatedItems = [...props.items]
  updatedItems.splice(index, 1)
  emit('update:items', updatedItems)
}
</script>

<template>
    <!-- Add Item Card -->
    <Card class="border-t-4 border-t-primary shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardHeader class="pb-4">
        <CardTitle class="text-lg flex items-center gap-2">
            <Wrench class="w-5 h-5 text-muted-foreground"/>
            Estimate Items Builder
        </CardTitle>
        <CardDescription>Add parts from inventory or custom labor charges.</CardDescription>
        </CardHeader>
        <CardContent class="space-y-6">
        
        <!-- Builder Interactions -->
        <div class="p-5 bg-muted/30 rounded-xl border border-dashed border-primary/20 space-y-4">
            <div class="grid grid-cols-12 gap-4 items-end">
                <!-- Type -->
                <div class="col-span-3 sm:col-span-2">
                    <Label class="text-xs font-semibold mb-2 block text-muted-foreground uppercase tracking-wider">Type</Label>
                    <Select v-model="newItem.type">
                        <SelectTrigger class="bg-background">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="PART">Part</SelectItem>
                            <SelectItem value="LABOR">Labor</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <!-- Name / Search -->
                <div class="col-span-9 sm:col-span-6 relative">
                    <Label class="text-xs font-semibold mb-2 block text-muted-foreground uppercase tracking-wider">Item / Service</Label>
                    <div class="relative">
                        <Search v-if="newItem.type === 'PART'" class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <FileText v-else class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        
                        <Input 
                            v-model="partSearch"
                            @input="handlePartSearch"
                            :placeholder="newItem.type === 'PART' ? 'Search inventory by name, brand, SKU...' : 'Description of labor service'"
                            class="pl-9 bg-background"
                        />

                        <!-- Parts Autocomplete Dropdown -->
                        <div v-if="isPartDropdownOpen && newItem.type === 'PART'" 
                            class="absolute z-50 w-full mt-1.5 bg-popover text-popover-foreground border rounded-lg shadow-xl max-h-[300px] overflow-y-auto overflow-x-hidden">
                            <div v-if="isSearchingParts" class="p-4 flex justify-center items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 class="w-4 h-4 animate-spin" /> Searching inventory...
                            </div>
                            <div v-else-if="parts.length === 0" class="p-4 text-sm text-muted-foreground text-center">No parts found matching query.</div>
                            <div v-else class="py-1">
                                <button
                                    v-for="part in parts" 
                                    :key="part.id"
                                    class="w-full text-left px-3 py-2.5 text-sm hover:bg-accent hover:text-accent-foreground flex gap-3 items-center group transition-colors"
                                    @click="selectPart(part)"
                                >
                                    <!-- Part Image Thumbnail -->
                                    <div class="h-10 w-10 flex-shrink-0 rounded bg-muted flex items-center justify-center overflow-hidden border border-border">
                                        <img v-if="part.imageUrl" :src="part.imageUrl" class="h-full w-full object-cover" />
                                        <Wrench v-else class="h-5 w-5 text-muted-foreground/50" /> 
                                    </div>

                                    <div class="flex-grow min-w-0">
                                        <div class="font-medium truncate group-hover:text-primary transition-colors">
                                            <span class="mr-1.5 font-bold text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded" v-if="part.brand">{{ part.brand }}</span>
                                            {{ part.name }}
                                        </div>
                                        <div class="text-xs text-muted-foreground truncate">{{ part.sku }}</div>
                                    </div>
                                    <div class="text-right flex-shrink-0">
                                        <div class="font-semibold text-foreground">₱{{ part.sellingPrice.toLocaleString() }}</div>
                                        <div class="text-[10px]" :class="part.quantity > 0 ? 'text-green-600' : 'text-destructive'">
                                            {{ part.quantity }} in stock
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Quantity -->
                <div class="col-span-6 sm:col-span-2">
                        <Label class="text-xs font-semibold mb-2 block text-muted-foreground uppercase tracking-wider">
                        {{ newItem.type === 'LABOR' ? 'Hours' : 'Qty' }}
                        </Label>
                    <Input type="number" v-model="newItem.quantity" min="1" class="bg-background text-center font-medium"/>
                </div>

                <!-- Price -->
                <div class="col-span-6 sm:col-span-2">
                    <Label class="text-xs font-semibold mb-2 block text-muted-foreground uppercase tracking-wider">Price</Label>
                    <div class="relative">
                        <span class="absolute left-3 top-2.5 text-xs text-muted-foreground">₱</span>
                        <Input type="number" v-model="newItem.price" min="0" step="0.01" class="bg-background pl-6 text-right font-medium" />
                    </div>
                </div>
            </div>
            
                <!-- Validation Warning -->
                <div v-if="newItem.type === 'PART' && newItem.stock !== null && newItem.quantity > newItem.stock" 
                    class="flex items-center gap-2 p-2 bg-destructive/10 text-destructive text-xs rounded-md border border-destructive/20 mt-2">
                <AlertCircle class="w-4 h-4" /> 
                <span class="font-medium">Insufficient Stock:</span> You requested <span class="font-bold">{{ newItem.quantity }}</span> but only <span class="font-bold">{{ newItem.stock }}</span> are available.
                </div>

                <div class="flex justify-end pt-2">
                <Button @click="addItem" :disabled="!newItem.name" size="sm" class="w-full sm:w-auto">
                    <Plus class="w-4 h-4 mr-2" /> Add Item
                </Button>
                </div>
        </div>

        <!-- Items Table -->
        <div class="border rounded-lg overflow-hidden bg-white shadow-sm">
            <table class="w-full text-sm text-left">
                <thead class="bg-muted/50 text-muted-foreground font-semibold border-b">
                    <tr>
                        <th class="px-6 py-3 w-[120px]">Type</th>
                        <th class="px-6 py-3">Description</th>
                        <th class="px-6 py-3 text-center w-[100px]">Qty/Hrs</th>
                        <th class="px-6 py-3 text-right w-[140px]">Unit Price</th>
                        <th class="px-6 py-3 text-right w-[140px]">Total</th>
                        <th class="px-4 py-3 w-[60px]"></th>
                    </tr>
                </thead>
                <tbody class="divide-y">
                    <tr v-if="items.length === 0">
                        <td colspan="6" class="px-6 py-12 text-center text-muted-foreground bg-muted/5">
                            <div class="flex flex-col items-center justify-center gap-2">
                                <div class="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-2">
                                    <FileText class="w-6 h-6 text-muted-foreground/50" />
                                </div>
                                <p class="font-medium">No items added</p>
                                <p class="text-xs">Use the builder above to add parts or labor.</p>
                            </div>
                        </td>
                    </tr>
                    <tr v-for="(item, index) in items" :key="index" class="hover:bg-muted/30 transition-colors">
                        <td class="px-6 py-4">
                            <Badge variant="outline" :class="item.type === 'PART' ? 'border-blue-200 text-blue-700 bg-blue-50' : 'border-amber-200 text-amber-700 bg-amber-50'">
                                {{ item.type }}
                            </Badge>
                        </td>
                        <td class="px-6 py-4">
                            <div class="font-medium flex items-center gap-2">
                                {{ item.name }}
                            </div>
                            <div v-if="item.description" class="text-xs text-muted-foreground mt-0.5 max-w-[250px] truncate">{{ item.description }}</div>
                        </td>
                        <td class="px-6 py-4 text-center font-medium">{{ item.quantity }}</td>
                        <td class="px-6 py-4 text-right text-muted-foreground">₱{{ item.price.toLocaleString(undefined, { minimumFractionDigits: 2 }) }}</td>
                        <td class="px-6 py-4 text-right font-bold text-foreground">₱{{ (item.price * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 }) }}</td>
                        <td class="px-4 py-4 text-center">
                            <button @click="removeItem(index)" class="group p-2 rounded-full hover:bg-destructive/10 transition-colors">
                                <Trash2 class="w-4 h-4 text-muted-foreground group-hover:text-destructive transition-colors" />
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        </CardContent>
    </Card>
</template>
