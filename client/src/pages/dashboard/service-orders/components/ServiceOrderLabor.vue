<script setup lang="ts">
import { ref } from 'vue'
import { Wrench, Plus, CheckCircle, X, Trash2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { addServiceOrderItem, updateServiceOrderItem, deleteServiceOrderItem } from '@/api/serviceOrders'
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
const isAddingLabor = ref(false)
const addItemForm = ref({
    name: '',
    description: '',
    quantity: 1,
    price: 0
})

const itemToDelete = ref<any>(null)
const isDeleting = ref(false)

const startEdit = (item: any) => {
    editingItemId.value = item.id
    editForm.value = {
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        price: Number(item.price)
    }
}

const cancelEdit = () => {
    editingItemId.value = null
}

const saveEdit = async (itemId: string) => {
    try {
        await updateServiceOrderItem(props.orderId, itemId, editForm.value)
        editingItemId.value = null
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

const startAddLabor = () => {
    isAddingLabor.value = true
    addItemForm.value = { name: '', description: '', quantity: 1, price: 0 }
}

const cancelAdd = () => {
    isAddingLabor.value = false
}

const saveAddItem = async () => {
    try {
        const payload = {
            type: 'LABOR',
            ...addItemForm.value,
            inventoryItemId: null 
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
        <div v-else-if="items.length === 0 && !isAddingLabor" class="flex flex-col items-center justify-center h-40 text-muted-foreground border-2 border-dashed rounded-lg bg-slate-50/50">
            <Wrench class="h-10 w-10 mb-2 opacity-20" />
            <p class="font-medium">No labor items</p>
            <p class="text-xs">No labor has been added to this order.</p>
        </div>
        <div v-else class="rounded-md border bg-white mb-4">
            <Table>
                <TableHeader>
                    <TableRow class="bg-slate-50 hover:bg-slate-50">
                        <TableHead class="w-[30%]">Service</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead class="text-right w-20">Hrs</TableHead>
                        <TableHead class="text-right w-28">Rate</TableHead>
                        <TableHead class="text-right w-28">Total</TableHead>
                        <TableHead class="w-[70px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow v-for="item in items" :key="item.id" class="group">
                        <!-- Edit Mode -->
                        <template v-if="editingItemId === item.id">
                            <TableCell><input v-model="editForm.name" class="w-full border rounded px-2 py-1 text-sm" /></TableCell>
                            <TableCell><input v-model="editForm.description" class="w-full border rounded px-2 py-1 text-sm" /></TableCell>
                            <TableCell><input v-model.number="editForm.quantity" type="number" class="w-full border rounded px-2 py-1 text-sm text-right" /></TableCell>
                            <TableCell><input v-model.number="editForm.price" type="number" class="w-full border rounded px-2 py-1 text-sm text-right" /></TableCell>
                            <TableCell class="text-right font-mono">{{ formatCurrency(editForm.price * editForm.quantity) }}</TableCell>
                            <TableCell>
                                <div class="flex items-center gap-1 justify-end">
                                    <Button size="icon" variant="ghost" class="h-6 w-6 text-green-600" @click="saveEdit(item.id)"><CheckCircle class="h-4 w-4" /></Button>
                                    <Button size="icon" variant="ghost" class="h-6 w-6 text-red-600" @click="cancelEdit"><X class="h-4 w-4" /></Button>
                                </div>
                            </TableCell>
                        </template>
                        <!-- View Mode -->
                        <template v-else>
                            <TableCell class="font-medium max-w-[150px] truncate" :title="item.name">{{ item.name }}</TableCell>
                            <TableCell class="text-muted-foreground text-xs max-w-[200px] truncate" :title="item.description || ''">{{ item.description || '-' }}</TableCell>
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
                    <TableRow v-if="isAddingLabor" class="bg-blue-50/50">
                        <TableCell><input v-model="addItemForm.name" placeholder="Service Name" class="w-full border rounded px-2 py-1 text-sm" /></TableCell>
                        <TableCell><input v-model="addItemForm.description" placeholder="Desc" class="w-full border rounded px-2 py-1 text-sm" /></TableCell>
                        <TableCell><input v-model.number="addItemForm.quantity" type="number" class="w-full border rounded px-2 py-1 text-sm text-right" /></TableCell>
                        <TableCell><input v-model.number="addItemForm.price" type="number" class="w-full border rounded px-2 py-1 text-sm text-right" /></TableCell>
                        <TableCell class="text-right font-mono text-muted-foreground">-</TableCell>
                        <TableCell>
                            <div class="flex items-center gap-1">
                                <Button size="icon" variant="ghost" class="h-6 w-6 text-green-600" @click="saveAddItem"><CheckCircle class="h-4 w-4" /></Button>
                                <Button size="icon" variant="ghost" class="h-6 w-6 text-red-600" @click="cancelAdd"><X class="h-4 w-4" /></Button>
                            </div>
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </div>
        <Button v-if="!isAddingLabor" variant="outline" size="sm" class="w-full border-dashed" @click="startAddLabor">
            <Plus class="h-4 w-4 mr-2" /> Add Labor Item
        </Button>

        <Dialog :open="!!itemToDelete" @update:open="val => !val && (itemToDelete = null)">
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete Labor Item</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to remove <span class="font-medium text-foreground">{{ itemToDelete?.name }}</span> from this service order? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" @click="itemToDelete = null">Cancel</Button>
                    <Button variant="destructive" @click="deleteItem" :disabled="isDeleting">
                        {{ isDeleting ? 'Deleting...' : 'Delete Item' }}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
</template>
