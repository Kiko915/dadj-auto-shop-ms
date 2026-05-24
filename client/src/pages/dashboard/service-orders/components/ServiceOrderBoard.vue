<script setup lang="ts">
import { watch, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDragAndDrop } from '@formkit/drag-and-drop/vue'
import { animations } from '@formkit/drag-and-drop'
import { toast } from 'vue-sonner'
import { User, Calendar, Wrench, AlertCircle, ChevronDown } from 'lucide-vue-next'
import { updateServiceOrder } from '@/api/serviceOrders'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { ServiceOrder } from '../types'
import { COLUMNS, formatDate, formatCurrency, getInitials, isOverdue, isDueToday } from '../utils'
const props = defineProps<{
    orders: ServiceOrder[],
    totalItems: number
}>()

const emit = defineEmits(['refresh', 'load-more', 'select-order'])
const router = useRouter()

// Setup Drag and Drop
const [todoRef, todoItems] = useDragAndDrop<ServiceOrder>([], {
    group: 'service-orders',
    sortable: true,
    handleEnd: (data) => handleDragEnd(data, 'PENDING'),
    plugins: [animations()]
})

const [inProgressRef, inProgressItems] = useDragAndDrop<ServiceOrder>([], {
    group: 'service-orders',
    sortable: true,
    handleEnd: (data) => handleDragEnd(data, 'IN_PROGRESS'),
    plugins: [animations()]
})

const [doneRef, doneItems] = useDragAndDrop<ServiceOrder>([], {
    group: 'service-orders',
    sortable: true,
    handleEnd: (data) => handleDragEnd(data, 'COMPLETED'),
    plugins: [animations()]
})

const [cancelledRef, cancelledItems] = useDragAndDrop<ServiceOrder>([], {
    group: 'service-orders',
    sortable: true,
    handleEnd: (data) => handleDragEnd(data, 'CANCELLED'),
    plugins: [animations()]
})

const distributeOrders = (items: ServiceOrder[]) => {
    // We filter by status and assign to the reactive refs
    // Note: useDragAndDrop update method or just setting .value works?
    // The library documentation says returned values are refs.
    todoItems.value = items.filter(o => o.status === 'PENDING')
    inProgressItems.value = items.filter(o => o.status === 'IN_PROGRESS')
    doneItems.value = items.filter(o => o.status === 'COMPLETED')
    cancelledItems.value = items.filter(o => o.status === 'CANCELLED')
}

// Watch orders prop and redistribute
watch(() => props.orders, (newOrders) => {
    distributeOrders(newOrders)
}, { immediate: true, deep: true })

// Drag End Handler
const handleDragEnd = async (event: any, targetStatus: string) => {
    const listMap: Record<string, typeof inProgressItems> = {
        'PENDING': todoItems,
        'IN_PROGRESS': inProgressItems,
        'COMPLETED': doneItems,
        'CANCELLED': cancelledItems
    }

    const currentList = listMap[targetStatus]
    
    // Find item with wrong status
    const itemToUpdate = currentList.value.find(item => item.status !== targetStatus)
    
    if (itemToUpdate) {
        // Clone and replace in list to avoid prop mutation
        const index = currentList.value.indexOf(itemToUpdate)
        if (index !== -1) {
            const updatedItem = { ...itemToUpdate, status: targetStatus }
            currentList.value[index] = updatedItem
        }

        try {
            await updateServiceOrder(itemToUpdate.id, { status: targetStatus })
            toast.success(`Order updated to ${COLUMNS[targetStatus as keyof typeof COLUMNS]}`)
            emit('refresh') 
        } catch (error) {
            console.error('Failed to update status', error)
            toast.error('Failed to update status')
            emit('refresh') // Force reload to fix UI lists
        }
    }
}


const handleCardClick = (id: string) => {
    emit('select-order', id)
}

const isTouchDevice = ref(false)
onMounted(() => {
    isTouchDevice.value = window.matchMedia('(pointer: coarse)').matches
})
</script>

<template>
    <div class="overflow-x-auto h-full">
    <div class="flex h-full gap-4 px-1 min-w-max">
        
        <!-- Pending Column -->
        <div class="flex h-full w-72 shrink-0 md:w-auto md:flex-1 flex-col rounded-lg border bg-slate-50/50 shadow-sm" >
            <div class="flex items-center justify-between p-4 pb-2">
                <h3 class="font-semibold text-slate-700 flex items-center gap-2">
                    {{ COLUMNS.PENDING }}
                    <Badge variant="secondary" class="ml-1">{{ todoItems.length }}</Badge>
                </h3>
            </div>
            <div 
                ref="todoRef" 
                class="flex-1 flex flex-col gap-3 p-3 overflow-y-auto"
            >
                <div 
                    v-for="order in todoItems" 
                    :key="order.id"
                    class="cursor-move bg-white p-3 rounded-md border shadow-sm hover:shadow-md transition-all group"
                    @click="handleCardClick(order.id)"
                >
                        <div class="flex justify-between items-start mb-2">
                        <div>
                            <div class="font-bold text-sm">{{ order.vehicle.make }} {{ order.vehicle.model }}</div>
                            <div class="text-xs text-muted-foreground">{{ order.vehicle.licensePlate }}</div>
                        </div>
                        <!-- Price Tag -->
                            <Badge variant="outline" class="font-mono text-xs bg-slate-50">
                            {{ formatCurrency(order.totalAmount) }}
                        </Badge>
                    </div>
                    
                    <div class="flex items-center gap-2 mb-3">
                            <User class="h-3 w-3 text-muted-foreground" />
                            <span class="text-xs text-slate-600 truncate">{{ order.customer.firstName }} {{ order.customer.lastName }}</span>
                    </div>

                    <div class="flex items-center justify-between border-t pt-3 mt-1">
                        <div class="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Calendar class="h-3 w-3" :class="{
                                'text-amber-500': isDueToday(order.estimatedCompletion),
                                'text-red-500': isOverdue(order.estimatedCompletion) && order.status !== 'COMPLETED'
                            }" />
                            <span :class="{
                                'text-amber-600 font-medium': isDueToday(order.estimatedCompletion),
                                'text-red-600 font-medium': isOverdue(order.estimatedCompletion) && order.status !== 'COMPLETED'
                            }">
                                {{ order.estimatedCompletion ? 'Due: ' : 'Created: ' }}{{ formatDate(order.estimatedCompletion || order.createdAt) }}
                            </span>
                            <span v-if="isDueToday(order.estimatedCompletion)" class="flex h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                        </div>
                        
                        <TooltipProvider v-if="!isTouchDevice">
                            <Tooltip>
                                <TooltipTrigger>
                                    <Avatar class="h-6 w-6 border-2 border-white shadow-sm">
                                        <AvatarImage v-if="order.mechanic?.profilePicture || order.mechanic?.avatar" :src="order.mechanic?.profilePicture || order.mechanic?.avatar" />
                                        <AvatarFallback :class="order.mechanic ? 'bg-primary/10 text-primary' : 'bg-slate-100 border-dashed text-slate-400'">
                                            <span v-if="order.mechanic" class="text-[10px]">{{ getInitials(order.mechanic.name) }}</span>
                                            <Wrench v-else class="h-3 w-3" />
                                        </AvatarFallback>
                                    </Avatar>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{{ order.mechanic ? order.mechanic.name : 'Unassigned' }}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <Avatar v-else class="h-6 w-6 border-2 border-white shadow-sm">
                            <AvatarImage v-if="order.mechanic?.profilePicture || order.mechanic?.avatar" :src="order.mechanic?.profilePicture || order.mechanic?.avatar" />
                            <AvatarFallback :class="order.mechanic ? 'bg-primary/10 text-primary' : 'bg-slate-100 border-dashed text-slate-400'">
                                <span v-if="order.mechanic" class="text-[10px]">{{ getInitials(order.mechanic.name) }}</span>
                                <Wrench v-else class="h-3 w-3" />
                            </AvatarFallback>
                        </Avatar>
                    </div>
                </div>
            </div>
        </div>

        <!-- In Progress Column -->
        <div class="flex h-full w-72 shrink-0 md:w-auto md:flex-1 flex-col rounded-lg border bg-blue-50/30 shadow-sm">
            <div class="flex items-center justify-between p-4 pb-2">
                <h3 class="font-semibold text-blue-700 flex items-center gap-2">
                    {{ COLUMNS.IN_PROGRESS }}
                    <Badge variant="outline" class="ml-1 bg-blue-100 text-blue-700 border-blue-200">{{ inProgressItems.length }}</Badge>
                </h3>
            </div>
            <div 
                ref="inProgressRef" 
                class="flex-1 flex flex-col gap-3 p-3 overflow-y-auto"
            >
                <div 
                    v-for="order in inProgressItems" 
                    :key="order.id"
                    class="cursor-move bg-white p-3 rounded-md border border-blue-100 shadow-sm hover:shadow-md transition-all"
                        @click="handleCardClick(order.id)"
                >
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <div class="font-bold text-sm">{{ order.vehicle.make }} {{ order.vehicle.model }}</div>
                            <div class="text-xs text-muted-foreground">{{ order.vehicle.licensePlate }}</div>
                        </div>
                            <Badge variant="outline" class="font-mono text-xs bg-slate-50">
                            {{ formatCurrency(order.totalAmount) }}
                        </Badge>
                    </div>
                    
                        <div class="flex items-center gap-2 mb-3">
                            <User class="h-3 w-3 text-muted-foreground" />
                            <span class="text-xs text-slate-600 truncate">{{ order.customer.firstName }} {{ order.customer.lastName }}</span>
                    </div>

                    <div class="flex items-center justify-between border-t border-blue-50 pt-3 mt-1">
                        <div class="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Calendar class="h-3 w-3" :class="{
                                'text-amber-500': isDueToday(order.estimatedCompletion),
                                'text-red-500': isOverdue(order.estimatedCompletion)
                            }" />
                            <span :class="{
                                'text-amber-600 font-medium': isDueToday(order.estimatedCompletion),
                                'text-red-600 font-medium': isOverdue(order.estimatedCompletion)
                            }">
                                {{ order.estimatedCompletion ? 'Due: ' : 'Created: ' }}{{ formatDate(order.estimatedCompletion || order.createdAt) }}
                            </span>
                            <span v-if="isDueToday(order.estimatedCompletion)" class="flex h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                        </div>
                        <Avatar class="h-6 w-6 border-2 border-white shadow-sm">
                            <AvatarImage v-if="order.mechanic?.profilePicture || order.mechanic?.avatar" :src="order.mechanic?.profilePicture || order.mechanic?.avatar" />
                            <AvatarFallback class="bg-blue-100 text-blue-600 text-[10px]">
                                {{ order.mechanic ? getInitials(order.mechanic.name) : '?' }}
                            </AvatarFallback>
                        </Avatar>
                    </div>
                </div>
            </div>
        </div>

        <!-- Completed Column -->
            <div class="flex h-full w-72 shrink-0 md:w-auto md:flex-1 flex-col rounded-lg border bg-green-50/30 shadow-sm">
            <div class="flex items-center justify-between p-4 pb-2">
                <h3 class="font-semibold text-green-700 flex items-center gap-2">
                    {{ COLUMNS.COMPLETED }}
                    <Badge variant="outline" class="ml-1 bg-green-100 text-green-700 border-green-200">{{ doneItems.length }}</Badge>
                </h3>
            </div>
            <div 
                ref="doneRef" 
                class="flex-1 flex flex-col gap-3 p-3 overflow-y-auto"
            >
                    <div 
                    v-for="order in doneItems" 
                    :key="order.id"
                    class="cursor-move bg-white p-3 rounded-md border border-green-100 shadow-sm hover:shadow-md transition-all opacity-80 hover:opacity-100"
                        @click="handleCardClick(order.id)"
                >
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <div class="font-bold text-sm text-slate-700">{{ order.vehicle.make }} {{ order.vehicle.model }}</div>
                            <div class="text-xs text-muted-foreground">{{ order.vehicle.licensePlate }}</div>
                        </div>
                            <Badge variant="outline" class="font-mono text-xs" :class="{
                                'bg-green-50 text-green-700 border-green-200': order.paymentStatus === 'PAID',
                                'bg-amber-50 text-amber-700 border-amber-200': order.paymentStatus === 'PARTIAL',
                                'bg-slate-50 text-slate-700': order.paymentStatus === 'UNPAID'
                            }">
                            {{ order.paymentStatus === 'PAID' ? 'Paid' : (order.paymentStatus === 'PARTIAL' ? 'Partial' : formatCurrency(order.totalAmount)) }}
                        </Badge>
                    </div>
                    
                        <div class="flex items-center gap-2 mb-3">
                            <User class="h-3 w-3 text-muted-foreground" />
                            <span class="text-xs text-slate-600 truncate">{{ order.customer.firstName }} {{ order.customer.lastName }}</span>
                    </div>

                        <div class="flex items-center justify-end border-t border-green-50 pt-3 mt-1">
                        <Avatar class="h-6 w-6 border-2 border-white shadow-sm grayscale opacity-70">
                            <AvatarImage v-if="order.mechanic?.profilePicture || order.mechanic?.avatar" :src="order.mechanic?.profilePicture || order.mechanic?.avatar" />
                            <AvatarFallback class="text-[10px]">
                                {{ order.mechanic ? getInitials(order.mechanic.name) : '?' }}
                            </AvatarFallback>
                        </Avatar>
                    </div>
                </div>
            </div>
        </div>

            <!-- Cancelled Column -->
            <div class="flex h-full w-72 shrink-0 md:w-auto md:flex-1 flex-col rounded-lg border bg-red-50/30 shadow-sm">
            <div class="flex items-center justify-between p-4 pb-2">
                <h3 class="font-semibold text-red-700 flex items-center gap-2">
                    {{ COLUMNS.CANCELLED }}
                    <Badge variant="outline" class="ml-1 bg-red-100 text-red-700 border-red-200">{{ cancelledItems.length }}</Badge>
                </h3>
            </div>
            <div 
                ref="cancelledRef" 
                class="flex-1 flex flex-col gap-3 p-3 overflow-y-auto"
            >
                    <div 
                    v-for="order in cancelledItems" 
                    :key="order.id"
                    class="cursor-move bg-white/50 p-3 rounded-md border border-red-100 shadow-sm hover:shadow-md transition-all"
                        @click="handleCardClick(order.id)"
                >
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <div class="font-bold text-sm text-slate-500 line-through">{{ order.vehicle.make }} {{ order.vehicle.model }}</div>
                            <div class="text-xs text-muted-foreground">{{ order.vehicle.licensePlate }}</div>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                            <AlertCircle class="h-3 w-3 text-red-400" />
                            <span class="text-xs text-red-500">Cancelled</span>
                    </div>
                </div>
            </div>
        </div>

    </div>
    </div>
</template>
