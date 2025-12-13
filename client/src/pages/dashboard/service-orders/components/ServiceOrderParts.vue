<script setup lang="ts">
import { ref, watch } from 'vue'
import { Car, Plus, CheckCircle, X, Wrench, Search, AlertTriangle, Package, Trash2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { addServiceOrderItem, updateServiceOrderItem, deleteServiceOrderItem } from '@/api/serviceOrders'
import { getInventory } from '@/api/inventory'
import { formatCurrency } from '../utils'

const props = defineProps<{
    items: any[],
    orderId: string,
    loading: boolean
}>()

const emit = defineEmits(['order-updated'])

const editingItemId = ref<string | null>(null)
const editForm = ref({
    name: '',
    description: '',
    quantity: 1,
    price: 0
})

const isAddingPart = ref(false)
const addItemForm = ref({
    name: '',
    description: '',
    quantity: 1,
    price: 0,
    inventoryItemId: null as number | null
})

// Inventory Search State
const partSearchQuery = ref('')
const partSearchResults = ref<any[]>([])
const isSearchingParts = ref(false)
const isPopoverOpen = ref(false)
const selectedInventoryItem = ref<any>(null)

// Deletion State
const itemToDelete = ref<any>(null)
const isDeleting = ref(false)

// Debounce search
let searchTimeout: NodeJS.Timeout
const handlePartSearch = (event: Event) => {
    const query = (event.target as HTMLInputElement).value
    partSearchQuery.value = query
    isPopoverOpen.value = true // Keep open while typing
    
    clearTimeout(searchTimeout)
    if (!query) {
        partSearchResults.value = []
        return
    }

    searchTimeout = setTimeout(async () => {
        isSearchingParts.value = true
        try {
            const res = await getInventory({ search: query, limit: 5 })
            partSearchResults.value = res.items || []
        } catch (error) {
            console.error('Failed to search parts', error)
        } finally {
            isSearchingParts.value = false
        }
    }, 300)
}

// Watch for quantity changes to alert
const stockAlert = ref<string | null>(null)

const validateStock = () => {
    if (selectedInventoryItem.value) {
        if (addItemForm.value.quantity > selectedInventoryItem.value.quantity) {
             stockAlert.value = `Only ${selectedInventoryItem.value.quantity} in stock`
        } else {
             stockAlert.value = null
        }
    } else {
        stockAlert.value = null
    }
}

watch(() => addItemForm.value.quantity, validateStock)

const selectInventoryItem = (item: any) => {
    selectedInventoryItem.value = item
    addItemForm.value.name = item.name
    addItemForm.value.description = `${item.brand} - ${item.sku || 'No SKU'}`
    addItemForm.value.price = Number(item.sellingPrice)
    addItemForm.value.inventoryItemId = item.id
    
    partSearchQuery.value = item.name
    isPopoverOpen.value = false
    
    // Validate immediately
    validateStock()
}

const startEdit = (item: any) => {
    editingItemId.value = item.id
    console.log('Editing Item:', item)
    editForm.value = {
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        price: Number(item.price)
    }
    
    // Calculate Max Stock for Edit
    // Max = Current Usage + Remaining Inventory
    if (item.inventoryItem) {
        maxEditStock.value = item.quantity + item.inventoryItem.quantity
    } else {
        maxEditStock.value = Infinity
    }
    
    // Validate immediately
    validateEditStock()
}

// Edit Stock Validation
const editStockAlert = ref<string | null>(null)
const maxEditStock = ref(Infinity)

const validateEditStock = () => {
    if (editForm.value.quantity > maxEditStock.value) {
        editStockAlert.value = `Max available: ${maxEditStock.value}`
    } else {
        editStockAlert.value = null
    }
}

watch(() => editForm.value.quantity, validateEditStock)

const cancelEdit = () => {
    editingItemId.value = null
    editStockAlert.value = null
}

const saveEdit = async (itemId: string) => {
    if (editStockAlert.value) return // Prevent save if invalid

    try {
        await updateServiceOrderItem(props.orderId, itemId, editForm.value)
        editingItemId.value = null
        editStockAlert.value = null
        emit('order-updated')
    } catch (error) {
        console.error('Failed to update item', error)
    }
}

const confirmDelete = (item: any) => {
    itemToDelete.value = item
}

const deleteItem = async () => {
    if (!itemToDelete.value) return
    isDeleting.value = true
    try {
        await deleteServiceOrderItem(props.orderId, itemToDelete.value.id)
        emit('order-updated')
        itemToDelete.value = null
    } catch (error) {
        console.error('Failed to delete item', error)
    } finally {
        isDeleting.value = false
    }
}

const startAddPart = () => {
    isAddingPart.value = true
    addItemForm.value = { name: '', description: '', quantity: 1, price: 0, inventoryItemId: null }
    partSearchQuery.value = ''
    selectedInventoryItem.value = null
    stockAlert.value = null
    isPopoverOpen.value = false
}

const cancelAdd = () => {
    isAddingPart.value = false
    isPopoverOpen.value = false
}

const saveAddItem = async () => {
    try {
        const payload = {
            type: 'PART',
            ...addItemForm.value,
        }
        await addServiceOrderItem(props.orderId, payload)
        cancelAdd()
        emit('order-updated')
    } catch (error) {
        console.error('Failed to add item', error)
    }
}
</script>

<template>
    <div class="h-full pr-4 overflow-y-auto">
        <div v-if="loading" class="space-y-3">
            <Skeleton class="h-12 w-full" v-for="i in 5" :key="i" />
        </div>
        <div v-else-if="items.length === 0" class="flex flex-col items-center justify-center h-40 text-muted-foreground border-2 border-dashed rounded-lg bg-slate-50/50">
            <Car class="h-10 w-10 mb-2 opacity-20" />
            <p class="font-medium">No parts used</p>
            <p class="text-xs">No parts have been charged to this order yet.</p>
        </div>
        <div v-else class="rounded-md border bg-white mb-4">
            <Table>
                <TableHeader>
                    <TableRow class="bg-slate-50 hover:bg-slate-50">
                        <TableHead class="w-[30%]">Part Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead class="text-right w-20">Qty</TableHead>
                        <TableHead class="text-right w-28">Unit Price</TableHead>
                        <TableHead class="text-right w-28">Total</TableHead>
                        <TableHead class="w-[70px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow v-for="item in items" :key="item.id" class="group">
                        <!-- Edit Mode -->
                        <template v-if="editingItemId === item.id">
                            <TableCell><input v-model="editForm.name" class="w-full border rounded px-2 py-1 text-sm" /></TableCell>
                            <TableCell><span class="text-xs text-muted-foreground">In Stock</span></TableCell>
                            <TableCell>
                                <input v-model.number="editForm.quantity" type="number" class="w-full border rounded px-2 py-1 text-sm text-right" :class="{'border-red-500 text-red-600': editStockAlert}" />
                                <div v-if="editStockAlert" class="text-[10px] text-red-600 mt-1 flex items-center justify-end gap-1 font-medium whitespace-nowrap">
                                    <AlertTriangle class="h-3 w-3" />
                                    {{ editStockAlert }}
                                </div>
                            </TableCell>
                            <TableCell><input v-model.number="editForm.price" type="number" class="w-full border rounded px-2 py-1 text-sm text-right" /></TableCell>
                            <TableCell class="text-right font-mono">{{ formatCurrency(editForm.price * editForm.quantity) }}</TableCell>
                            <TableCell>
                                <div class="flex items-center gap-1 justify-end">
                                    <Button size="icon" variant="ghost" class="h-6 w-6 text-green-600" @click="saveEdit(item.id)" :disabled="!!editStockAlert"><CheckCircle class="h-4 w-4" /></Button>
                                    <Button size="icon" variant="ghost" class="h-6 w-6 text-red-600" @click="cancelEdit"><X class="h-4 w-4" /></Button>
                                </div>
                            </TableCell>
                        </template>
                        <!-- View Mode -->
                        <template v-else>
                            <TableCell>
                                <div class="font-medium max-w-[150px] truncate" :title="item.name">{{ item.name }}</div>
                                <div class="text-[11px] text-muted-foreground max-w-[200px] truncate" v-if="item.description" :title="item.description">{{ item.description }}</div>
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline" class="text-[10px] font-normal" v-if="item.inventoryItem">In Stock</Badge>
                                <Badge variant="secondary" class="text-[10px] font-normal" v-else>Non-Inventory</Badge>
                            </TableCell>
                            <TableCell class="text-right font-mono">{{ item.quantity }}</TableCell>
                            <TableCell class="text-right font-mono">{{ formatCurrency(item.price) }}</TableCell>
                            <TableCell class="text-right font-bold font-mono text-slate-700">{{ formatCurrency(item.total) }}</TableCell>
                            <TableCell>
                                <div class="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button size="icon" variant="ghost" class="h-6 w-6" @click="startEdit(item)"><Wrench class="h-3 w-3" /></Button>
                                    <Button size="icon" variant="ghost" class="h-6 w-6 text-red-500 hover:text-red-700" @click="confirmDelete(item)"><Trash2 class="h-3 w-3" /></Button>
                                </div>
                            </TableCell>
                        </template>
                    </TableRow>
                    
                    <!-- Add Row -->
                    <TableRow v-if="isAddingPart" class="bg-blue-50/50">
                        <TableCell class="align-top pt-3">
                            <Popover v-model:open="isPopoverOpen">
                                <PopoverTrigger as-child>
                                     <div class="relative">
                                        <input 
                                            :value="partSearchQuery"
                                            @input="handlePartSearch"
                                            placeholder="Search Inventory..." 
                                            class="w-full border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                            @focus="isPopoverOpen = true"
                                        />
                                     </div>
                                </PopoverTrigger>
                                <PopoverContent class="w-[300px] p-0" align="start">
                                    <div v-if="isSearchingParts" class="p-3 text-xs text-muted-foreground text-center">Searching...</div>
                                    <div v-else-if="partSearchResults.length === 0 && partSearchQuery" class="p-3 text-xs text-muted-foreground text-center">No parts found</div>
                                    <div v-else-if="!partSearchQuery" class="p-3 text-xs text-muted-foreground text-center">Type to search inventory...</div>
                                    <div v-else class="max-h-60 overflow-y-auto">
                                        <div 
                                            v-for="part in partSearchResults" 
                                            :key="part.id"
                                            class="p-2 hover:bg-slate-50 cursor-pointer border-b last:border-0"
                                            @click="selectInventoryItem(part)"
                                        >
                                            <div class="font-medium text-sm text-slate-900">{{ part.name }}</div>
                                            <div class="flex items-center justify-between mt-1">
                                                <span class="text-xs text-muted-foreground">{{ part.brand }}</span>
                                                <Badge :variant="part.quantity > 5 ? 'outline' : 'destructive'" class="text-[10px] h-5">
                                                    Stock: {{ part.quantity }}
                                                </Badge>
                                            </div>
                                            <div class="text-xs font-mono text-slate-600 mt-1">{{ formatCurrency(part.sellingPrice) }}</div>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                           
                            <div v-if="selectedInventoryItem" class="text-[10px] text-green-600 mt-1 flex items-center gap-1">
                                <Package class="h-3 w-3" />
                                Linked: Stock {{ selectedInventoryItem.quantity }}
                            </div>
                        </TableCell>
                        <TableCell class="align-top pt-3">
                            <span class="text-xs text-muted-foreground">-</span>
                        </TableCell>
                        <TableCell class="align-top pt-3">
                            <input v-model.number="addItemForm.quantity" type="number" class="w-full border rounded px-2 py-1 text-sm text-right" :class="{'border-red-500 text-red-600': stockAlert}" />
                            <div v-if="stockAlert" class="text-[10px] text-red-600 mt-1 flex items-center justify-end gap-1 font-medium whitespace-nowrap">
                                <AlertTriangle class="h-3 w-3" />
                                {{ stockAlert }}
                            </div>
                        </TableCell>
                        <TableCell class="align-top pt-3"><input v-model.number="addItemForm.price" type="number" class="w-full border rounded px-2 py-1 text-sm text-right bg-slate-50" readonly /></TableCell>
                        <TableCell class="text-right font-mono text-muted-foreground align-top pt-4">-</TableCell>
                        <TableCell class="align-top pt-3">
                            <div class="flex items-center gap-1 justify-end">
                                <Button size="icon" variant="ghost" class="h-6 w-6 text-green-600" @click="saveAddItem" :disabled="!!stockAlert"><CheckCircle class="h-4 w-4" /></Button>
                                <Button size="icon" variant="ghost" class="h-6 w-6 text-red-600" @click="cancelAdd"><X class="h-4 w-4" /></Button>
                            </div>
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </div>
        <Button v-if="!isAddingPart" variant="outline" size="sm" class="w-full border-dashed" @click="startAddPart">
            <Plus class="h-4 w-4 mr-2" /> Add Part
        </Button>

        <Dialog :open="!!itemToDelete" @update:open="val => !val && (itemToDelete = null)">
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete Part</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to remove <span class="font-medium text-foreground">{{ itemToDelete?.name }}</span>? 
                        <span v-if="itemToDelete?.inventoryItem" class="mt-2 text-amber-600 flex items-center gap-2">
                            <Package class="h-4 w-4" />
                            This will return {{ itemToDelete.quantity }} items to inventory.
                        </span>
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" @click="itemToDelete = null">Cancel</Button>
                    <Button variant="destructive" @click="deleteItem" :disabled="isDeleting">
                        {{ isDeleting ? 'Deleting...' : 'Delete Part' }}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
</template>
