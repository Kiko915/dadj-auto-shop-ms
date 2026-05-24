<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { 
    Calendar, 
    User, 
    Wrench, 
    Car, 
    CreditCard, 
    FileText, 
    Paperclip,
    Hash,
    Archive,
    CheckCircle,
    Plus,
    X,
    AlertTriangle // Used in Attachments tab
} from 'lucide-vue-next'
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter, DialogHeader } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  SelectSeparator
} from '@/components/ui/select'
import DatePicker from '@/components/ui/date-picker/DatePicker.vue'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { getServiceOrder, updateServiceOrder, deleteServiceOrder } from '@/api/serviceOrders'
import { getMechanics } from '@/api/users'
import { formatDate, formatCurrency, getInitials, getStatusVariant, COLUMNS } from '../utils'
import ServiceOrderLabor from './ServiceOrderLabor.vue'
import ServiceOrderParts from './ServiceOrderParts.vue'
import ServiceOrderAdvisory from './ServiceOrderAdvisory.vue'
import ServiceOrderNotes from './ServiceOrderNotes.vue'

const props = defineProps<{
    open: boolean,
    orderId: string | null
}>()


const emit = defineEmits(['update:open', 'order-updated'])


const loading = ref(false)
const order = ref(null) // Using any for now to handle expanded relations not in list type
const mechanics = ref([])
const router = useRouter()

const isArchiving = ref(false)
const showArchiveConfirm = ref(false)

const handleArchive = () => {
    if (!order.value?.id) return
    showArchiveConfirm.value = true
}

const executeArchive = async () => {
    isArchiving.value = true
    try {
        await deleteServiceOrder(order.value.id)
        toast.success('Order archived successfully')
        emit('order-updated')
        emit('update:open', false)
        showArchiveConfirm.value = false
    } catch (error) {
        console.error('Failed to archive order', error)
        toast.error('Failed to archive order')
    } finally {
        isArchiving.value = false
    }
}

watch(() => props.orderId, async (newId) => {
    if (newId && props.open) {
        await fetchOrderDetails(newId)
        await fetchMechanics()
    }
}, { immediate: true })

watch(() => props.open, async (isOpen) => {
    if (isOpen && props.orderId) {
        await fetchOrderDetails(props.orderId)
        await fetchMechanics()
    } else {
        order.value = null
    }
})

// Initial load check
onMounted(async () => {
    if (props.open && props.orderId) {
        await fetchOrderDetails(props.orderId)
        await fetchMechanics()
    }
})

const fetchMechanics = async () => {
    try {
        const response = await getMechanics()
        mechanics.value = response
    } catch (error) {
        console.error('Failed to fetch mechanics', error)
    }
}

const handleMechanicUpdate = async (mechanicId: string) => {
    if (!order.value) return
    
    // Optimistic update
    const previousMechanic = order.value.mechanic
    const selectedMechanic = mechanics.value.find(m => m.id === mechanicId) || null
    
    // Setup JSON for update (handle "unassigned" as simpler case if needed, but assuming API takes null/id)
    // If mechanicId is "unassigned", we send null
    const payload = { 
        mechanicId: mechanicId === 'unassigned' ? null : mechanicId 
    }

    try {
        // Update local state immediately for UI responsiveness
        order.value.mechanic = mechanicId === 'unassigned' ? null : selectedMechanic
        
        await updateServiceOrder(order.value.id, payload)
        emit('order-updated') // Notify parent
        
        // Refresh full details to ensure relations are correct (optional but safer)
        await fetchOrderDetails(order.value.id)
        
    } catch (error) {
        console.error('Failed to update mechanic', error)
        // Revert on failure
        order.value.mechanic = previousMechanic
    }
}

const handleStatusUpdate = async (status: string) => {
    if (!order.value) return
    
    const previousStatus = order.value.status
    
    try {
        // Optimistic update
        order.value.status = status
        
        await updateServiceOrder(order.value.id, { status })
        emit('order-updated') // Notify parent
        
        // Refresh full details
        await fetchOrderDetails(order.value.id)
        
    } catch (error) {
        console.error('Failed to update status', error)
        order.value.status = previousStatus
    }
}

const handleDueDateUpdate = async (date: Date | null) => {
    if (!order.value) return

    const previousDate = order.value.estimatedCompletion

    try {
        // Optimistic update
        order.value.estimatedCompletion = date ? date.toISOString() : null
        
        await updateServiceOrder(order.value.id, { estimatedCompletion: order.value.estimatedCompletion })
        emit('order-updated')
        
        // Refresh details
        await fetchOrderDetails(order.value.id)

    } catch (error) {
        console.error('Failed to update due date', error)
        order.value.estimatedCompletion = previousDate
    }
}

const fetchOrderDetails = async (id: string) => {
    loading.value = true
    try {
        order.value = await getServiceOrder(id)
    } catch (error) {
        console.error('Failed to fetch order details', error)
    } finally {
        loading.value = false
    }
}

const laborItems = computed(() => order.value?.items?.filter((i: any) => i.type === 'LABOR') || [])
const partItems = computed(() => order.value?.items?.filter((i: any) => i.type === 'PART') || [])

const handleOrderUpdate = async () => {
    if (order.value) {
        await fetchOrderDetails(order.value.id)
        emit('order-updated')
    }
}

const isOverdue = (dateString: string | Date | null) => {
  if (!dateString) return false
  const date = new Date(dateString)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date < today
}

const isDueSoon = (dateString: string | Date | null) => {
    if (!dateString) return false
    const date = new Date(dateString)
    const today = new Date()
    const threeDaysFromNow = new Date()
    threeDaysFromNow.setDate(today.getDate() + 3)
    return date > today && date <= threeDaysFromNow
}

const handlePayNow = () => {
    if (order.value?.id) {
        emit('update:open', false) // Close modal
        router.push(`/dashboard/billing/checkout/${order.value.id}`)
    }
}

</script>

<template>
    <Dialog :open="open" @update:open="$emit('update:open', $event)">
        <DialogContent class="!max-w-full !w-full h-[100dvh] sm:!max-w-[80vw] sm:!w-[90vw] sm:h-[90vh] p-0 gap-0 overflow-hidden flex flex-col shadow-2xl border-0 sm:ring-1 ring-slate-900/5 rounded-none sm:rounded-lg">
            
            <!-- Loading Overlay -->
            <transition
                enter-active-class="transition ease-out duration-200"
                enter-from-class="opacity-0"
                enter-to-class="opacity-100"
                leave-active-class="transition ease-in duration-150"
                leave-from-class="opacity-100"
                leave-to-class="opacity-0"
            >
                <div v-if="loading && !order" class="absolute inset-0 z-50 bg-white flex flex-col items-center justify-center">
                    <div class="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center animate-pulse mb-4">
                        <Wrench class="h-6 w-6 text-primary animate-spin-slow" />
                    </div>
                    <p class="text-sm text-slate-500 font-medium animate-pulse">Loading Order Details...</p>
                </div>
            </transition>

            <!-- Header (Sticky) -->
            <div class="px-4 sm:px-6 py-3 sm:py-4 border-b flex items-center justify-between bg-white shrink-0 z-10 relative">
                <div class="flex items-center gap-3 min-w-0">
                    <div class="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl flex items-center justify-center text-primary shadow-sm ring-1 ring-primary/10 shrink-0">
                        <Wrench class="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div class="min-w-0">
                        <div class="flex items-center gap-2 flex-wrap">
                            <DialogTitle class="text-base sm:text-xl font-bold text-slate-900 tracking-tight">
                                <span class="sm:hidden">#{{ order?.id?.slice(0, 8) }}</span>
                                <span class="hidden sm:inline">Order #{{ order?.id }}</span>
                            </DialogTitle>
                            <Badge v-if="order" :variant="getStatusVariant(order.status)" class="uppercase text-[10px] font-bold px-2 py-0.5 tracking-wider shadow-sm shrink-0">
                                {{ order.status.replace('_', ' ') }}
                            </Badge>
                        </div>
                        <p class="text-xs text-slate-500 mt-0.5 font-medium flex items-center gap-2">
                            <span class="hidden sm:inline">Created {{ formatDate(order?.createdAt) }}</span>
                            <span class="hidden sm:inline w-1 h-1 rounded-full bg-slate-300"></span>
                            <span>{{ order?.vehicle?.make }} {{ order?.vehicle?.model }}</span>
                        </p>
                    </div>
                </div>

                <Button variant="ghost" size="icon" class="text-slate-400 hover:text-slate-600 shrink-0" @click="$emit('update:open', false)">
                    <span class="sr-only">Close</span>
                    <X class="h-5 w-5" />
                </Button>
            </div>

            <!-- Content Body -->
            <div class="flex-1 flex flex-col sm:flex-row overflow-hidden relative isolate">

                <!-- Left Sidebar: Info (desktop only) -->
                <div class="hidden sm:flex w-[320px] border-r bg-slate-50/60 flex-col overflow-hidden shrink-0 backdrop-blur-sm">
                    <div class="h-full overflow-y-auto custom-scrollbar">
                        <div class="p-6 space-y-8" v-if="loading && !order">
                             <!-- Vehicle Skeleton -->
                             <div class="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-3">
                                <div class="flex justify-between">
                                    <Skeleton class="h-3 w-12" />
                                    <Skeleton class="h-8 w-8 rounded-full" />
                                </div>
                                <Skeleton class="h-6 w-3/4" />
                                <Skeleton class="h-5 w-1/2" />
                             </div>
                             
                             <!-- Customer Skeleton -->
                             <div class="flex items-center gap-3">
                                <Skeleton class="h-10 w-10 rounded-full" />
                                <div class="space-y-2 flex-1">
                                    <Skeleton class="h-4 w-24" />
                                    <Skeleton class="h-3 w-16" />
                                </div>
                             </div>

                             <!-- Mechanic Skeleton -->
                             <div class="space-y-2">
                                <Skeleton class="h-10 w-full rounded-lg" />
                             </div>
                        </div>

                        <div class="p-6 space-y-8" v-else-if="order">
                            
                            <!-- Vehicle Card -->
                            <div class="group relative overflow-hidden rounded-2xl bg-slate-900 text-white shadow-lg ring-1 ring-white/10 transition-all hover:shadow-xl hover:scale-[1.01] duration-300">
                                <div class="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/5 blur-2xl transition-all group-hover:bg-white/10"></div>
                                <div class="absolute -left-6 -bottom-6 h-24 w-24 rounded-full bg-primary/20 blur-2xl transition-all group-hover:bg-primary/30"></div>
                                
                                <div class="relative p-5">
                                    <div class="flex items-start justify-between">
                                        <div>
                                            <div class="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Vehicle</div>
                                            <h3 class="text-xl font-bold tracking-tight text-white">{{ order.vehicle?.make }} {{ order.vehicle?.model }}</h3>
                                            <div class="mt-2 inline-flex items-center rounded-md bg-white/10 px-2 py-1 text-xs font-medium text-white ring-1 ring-inset ring-white/20">
                                                {{ order.vehicle?.licensePlate }}
                                            </div>
                                        </div>
                                        <div class="rounded-full bg-white/10 p-2 text-white ring-1 ring-white/20 backdrop-blur-sm">
                                            <Car class="h-5 w-5" />
                                        </div>
                                    </div>
                                    
                                    <div class="mt-4 flex items-center gap-3 text-xs text-slate-300 pt-4 border-t border-white/10">
                                        <div class="flex items-center gap-1.5" title="Odometer">
                                            <Hash class="h-3.5 w-3.5 opacity-70" />
                                            <span class="font-mono">{{ order.odometer ? order.odometer.toLocaleString() + ' km' : '--' }}</span>
                                        </div>
                                        <span class="w-1 h-1 rounded-full bg-slate-500"></span>
                                        <div class="flex items-center gap-1.5" title="Year">
                                            <Calendar class="h-3.5 w-3.5 opacity-70" />
                                            <span>{{ order.vehicle?.year || 'N/A' }}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- People Section -->
                            <div class="space-y-6">
                                <!-- Customer -->
                                <div class="flex items-center gap-4 group/customer cursor-pointer p-3 -mx-3 rounded-xl hover:bg-white hover:shadow-sm hover:ring-1 hover:ring-slate-200 transition-all">
                                    <Avatar class="h-11 w-11 border-2 border-white shadow-sm">
                                        <AvatarImage :src="order.customer?.profilePicture" />
                                        <AvatarFallback class="bg-blue-50 text-blue-700 font-bold">{{ getInitials(order.customer?.firstName + ' ' + order.customer?.lastName) }}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div class="font-bold text-sm text-slate-900 group-hover/customer:text-primary transition-colors">
                                            {{ order.customer?.firstName }} {{ order.customer?.lastName }}
                                        </div>
                                        <div class="text-xs text-muted-foreground flex items-center gap-1">
                                            Customer
                                        </div>
                                    </div>
                                </div>

                                <!-- Mechanic Selector -->
                                <div class="space-y-2">
                                    <label class="text-[10px] font-bold uppercase tracking-wider text-slate-400 pl-1">Assigned Technician</label>
                                    <Select :model-value="order.mechanic ? order.mechanic.id : 'unassigned'" @update:model-value="handleMechanicUpdate">
                                        <SelectTrigger class="w-full h-auto p-6 border shadow-sm hover:border-slate-300 bg-white transition-all rounded-xl hover:shadow-md [&>span]:w-full relative overflow-hidden group/select">
                                            <div class="flex items-center gap-3 w-full text-left relative z-10">
                                                <template v-if="order.mechanic">
                                                    <Avatar class="h-9 w-9 border shrink-0">
                                                        <AvatarImage :src="order.mechanic?.profilePicture" />
                                                        <AvatarFallback class="bg-slate-100 text-slate-700 font-bold text-xs">{{ getInitials(order.mechanic?.name) }}</AvatarFallback>
                                                    </Avatar>
                                                    <div class="flex-1 min-w-0">
                                                        <div class="font-bold text-sm text-slate-900 truncate">{{ order.mechanic.name }}</div>
                                                        <div class="text-[10px] text-muted-foreground">
                                                            {{ order.mechanic.role || 'Technician' }}
                                                        </div>
                                                    </div>
                                                </template>
                                                <template v-else>
                                                     <div class="h-9 w-9 border-2 border-dashed border-slate-200 rounded-full flex items-center justify-center text-slate-300 shrink-0 group-hover/select:border-primary/50 group-hover/select:text-primary/50 transition-colors">
                                                        <User class="h-4 w-4" />
                                                    </div>
                                                    <div class="flex-1 min-w-0">
                                                        <span class="text-sm font-medium text-slate-600 group-hover/select:text-slate-900">Assign Technician</span>
                                                    </div>
                                                </template>
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="unassigned" class="text-slate-500 italic">
                                                Unassigned
                                            </SelectItem>
                                            <SelectSeparator />
                                            <SelectItem v-for="mechanic in mechanics" :key="mechanic.id" :value="mechanic.id">
                                                <div class="flex items-center gap-2">
                                                    <Avatar class="h-6 w-6 border">
                                                        <AvatarImage :src="mechanic.profilePicture" />
                                                        <AvatarFallback class="text-[10px]">{{ getInitials(mechanic.name) }}</AvatarFallback>
                                                    </Avatar>
                                                    <span>{{ mechanic.name }}</span>
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <Separator />

                            <!-- Schedule & Info -->
                            <div class="space-y-5">
                                <div class="space-y-4">
                                     <!-- Dates Card -->
                                    <div class="bg-white rounded-xl border border-slate-100 p-3 shadow-sm space-y-3">
                                        <div class="space-y-2">
                                            <label class="text-[10px] font-bold uppercase tracking-wider text-slate-400 pl-1">Due Date</label>
                                            <DatePicker
                                                :model-value="order.estimatedCompletion ? new Date(order.estimatedCompletion) : null"
                                                @update:model-value="handleDueDateUpdate"
                                                placeholder="Set due date"
                                                class="w-full"
                                            />
                                            <div v-if="order.estimatedCompletion && isOverdue(order.estimatedCompletion)" class="flex justify-end">
                                                <span class="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-bold border border-red-100 flex items-center gap-1">
                                                    <AlertTriangle class="h-3 w-3" />
                                                    OVERDUE
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Notes -->
                                <ServiceOrderNotes :orderId="order.id" />
                            </div>

                        </div>
                    </div>
                    
                    <!-- Sidebar Footer: Status -->
                    <div class="p-4 border-t bg-white sticky bottom-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]" v-if="order">
                        <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block pl-1">Current Status</label>
                        <Select :model-value="order.status" @update:model-value="handleStatusUpdate">
                            <SelectTrigger class="w-full bg-slate-50 border-slate-200">
                                <SelectValue>
                                    <div class="flex items-center gap-2">
                                        <Badge :variant="getStatusVariant(order.status)" class="rounded-md px-2 py-0.5 font-bold shadow-none border-transparent">
                                            {{ COLUMNS[order.status] || order.status }}
                                        </Badge>
                                    </div>
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>Update Status</SelectLabel>
                                    <SelectItem v-for="(label, key) in COLUMNS" :key="key" :value="key">
                                        <div class="flex items-center gap-2">
                                            <div class="h-2 w-2 rounded-full" 
                                                :class="{
                                                    'bg-slate-400': key === 'PENDING',
                                                    'bg-blue-500': key === 'IN_PROGRESS',
                                                    'bg-green-500': key === 'COMPLETED',
                                                    'bg-red-500': key === 'CANCELLED'
                                                }">
                                            </div>
                                            <span>{{ label }}</span>
                                        </div>
                                    </SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>

                        <!-- Action Buttons -->
                        <div class="mt-4 pt-4 border-t space-y-2">
                             <!-- Archive (Cancelled) -->
                            <Button 
                                v-if="order.status === 'CANCELLED'" 
                                variant="outline" 
                                class="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 shadow-sm border-dashed"
                                @click="handleArchive"
                                :disabled="isArchiving"
                            >
                                <Archive class="h-4 w-4 mr-2" />
                                {{ isArchiving ? 'Archiving...' : 'Archive Order' }}
                            </Button>

                            <!-- Payment Actions -->
                            <template v-if="order.status === 'COMPLETED'">
                                <div v-if="order.paymentStatus === 'PAID'" class="bg-green-50 text-green-700 p-3 rounded-lg border border-green-200 flex items-center justify-center gap-2 font-medium shadow-sm">
                                    <CheckCircle class="h-4 w-4" />
                                    Paid in Full
                                </div>
                                <Button v-else class="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg transition-all" @click="handlePayNow">
                                    <CreditCard class="h-4 w-4 mr-2" />
                                    {{ order.paymentStatus === 'PARTIAL' ? 'Pay Balance' : 'Pay Now' }}
                                </Button>
                            </template>
                        </div>
                    </div>
                </div>

                <!-- Right Content: Tabs -->
                <div class="flex-1 bg-white flex flex-col overflow-hidden relative">
                    <Tabs default-value="labor" class="h-full flex flex-col">
                        <div class="border-b bg-white px-2 sm:px-6">
                            <TabsList class="w-full justify-start bg-transparent p-0 h-12 sm:h-14 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                <!-- Mobile-only Info tab -->
                                <TabsTrigger
                                    value="info"
                                    class="sm:hidden relative h-full px-4 text-sm font-medium text-slate-500 data-[state=active]:text-primary transition-colors flex items-center gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary hover:text-slate-700 whitespace-nowrap shrink-0"
                                >
                                    <User class="h-4 w-4" />
                                    Info
                                </TabsTrigger>

                                <TabsTrigger
                                    v-for="tab in [
                                        { value: 'labor', label: 'Labor', icon: Wrench, count: laborItems.length },
                                        { value: 'parts', label: 'Parts', icon: Car, count: partItems.length },
                                        { value: 'advisory', label: 'Advisories', icon: FileText, count: order?.advisories?.length || 0 },
                                        { value: 'financials', label: 'Financials', icon: CreditCard }
                                    ]"
                                    :key="tab.value"
                                    :value="tab.value"
                                    class="relative h-full px-3 sm:px-6 text-sm font-medium text-slate-500 data-[state=active]:text-primary transition-colors flex items-center gap-1.5 sm:gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary hover:text-slate-700 whitespace-nowrap shrink-0"
                                >
                                    <component :is="tab.icon" class="h-4 w-4" />
                                    <span class="hidden xs:inline">{{ tab.label }}</span>
                                    <Badge v-if="tab.count !== undefined" variant="secondary" class="h-5 min-w-[1.25rem] px-1 rounded-full text-[10px] bg-slate-100 text-slate-600 justify-center">
                                        {{ tab.count }}
                                    </Badge>
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <div class="flex-1 overflow-y-auto bg-slate-50/50 relative">
                            <!-- Inner Loading Overlay -->
                            <div v-if="loading && order" class="absolute inset-0 z-10 bg-white/50 backdrop-blur-[1px] flex items-center justify-center">
                                <div class="h-8 w-8 bg-white rounded-full shadow-lg flex items-center justify-center animate-pulse ring-1 ring-slate-100">
                                    <Wrench class="h-4 w-4 text-primary animate-spin-slow" />
                                </div>
                            </div>

                            <!-- Mobile Info Tab -->
                            <TabsContent value="info" class="sm:hidden mt-0 p-4 space-y-4 data-[state=active]:block">
                                <div v-if="order" class="space-y-4">
                                    <!-- Vehicle Card -->
                                    <div class="relative overflow-hidden rounded-2xl bg-slate-900 text-white shadow-lg ring-1 ring-white/10">
                                        <div class="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/5 blur-2xl"></div>
                                        <div class="absolute -left-6 -bottom-6 h-24 w-24 rounded-full bg-primary/20 blur-2xl"></div>
                                        <div class="relative p-5">
                                            <div class="flex items-start justify-between">
                                                <div>
                                                    <div class="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Vehicle</div>
                                                    <h3 class="text-xl font-bold tracking-tight">{{ order.vehicle?.make }} {{ order.vehicle?.model }}</h3>
                                                    <div class="mt-2 inline-flex items-center rounded-md bg-white/10 px-2 py-1 text-xs font-medium ring-1 ring-inset ring-white/20">
                                                        {{ order.vehicle?.licensePlate }}
                                                    </div>
                                                </div>
                                                <div class="rounded-full bg-white/10 p-2 ring-1 ring-white/20">
                                                    <Car class="h-5 w-5" />
                                                </div>
                                            </div>
                                            <div class="mt-4 flex items-center gap-3 text-xs text-slate-300 pt-4 border-t border-white/10">
                                                <div class="flex items-center gap-1.5">
                                                    <Hash class="h-3.5 w-3.5 opacity-70" />
                                                    <span class="font-mono">{{ order.odometer ? order.odometer.toLocaleString() + ' km' : '--' }}</span>
                                                </div>
                                                <span class="w-1 h-1 rounded-full bg-slate-500"></span>
                                                <div class="flex items-center gap-1.5">
                                                    <Calendar class="h-3.5 w-3.5 opacity-70" />
                                                    <span>{{ order.vehicle?.year || 'N/A' }}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Customer -->
                                    <div class="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                                        <Avatar class="h-10 w-10 border-2 border-white shadow-sm shrink-0">
                                            <AvatarImage :src="order.customer?.profilePicture" />
                                            <AvatarFallback class="bg-blue-50 text-blue-700 font-bold text-sm">{{ getInitials(order.customer?.firstName + ' ' + order.customer?.lastName) }}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div class="font-bold text-sm text-slate-900">{{ order.customer?.firstName }} {{ order.customer?.lastName }}</div>
                                            <div class="text-xs text-muted-foreground">Customer</div>
                                        </div>
                                    </div>

                                    <!-- Mechanic Selector -->
                                    <div class="space-y-2">
                                        <label class="text-[10px] font-bold uppercase tracking-wider text-slate-400 pl-1">Assigned Technician</label>
                                        <Select :model-value="order.mechanic ? order.mechanic.id : 'unassigned'" @update:model-value="handleMechanicUpdate">
                                            <SelectTrigger class="w-full h-auto px-4 py-3 border shadow-sm bg-white rounded-xl [&>span]:w-full">
                                                <div class="flex items-center gap-3 w-full text-left">
                                                    <template v-if="order.mechanic">
                                                        <Avatar class="h-8 w-8 border shrink-0">
                                                            <AvatarImage :src="order.mechanic?.profilePicture" />
                                                            <AvatarFallback class="bg-slate-100 text-slate-700 font-bold text-xs">{{ getInitials(order.mechanic?.name) }}</AvatarFallback>
                                                        </Avatar>
                                                        <div class="flex-1 min-w-0">
                                                            <div class="font-bold text-sm text-slate-900 truncate">{{ order.mechanic.name }}</div>
                                                            <div class="text-[10px] text-muted-foreground">{{ order.mechanic.role || 'Technician' }}</div>
                                                        </div>
                                                    </template>
                                                    <template v-else>
                                                        <div class="h-8 w-8 border-2 border-dashed border-slate-200 rounded-full flex items-center justify-center text-slate-300 shrink-0">
                                                            <User class="h-4 w-4" />
                                                        </div>
                                                        <span class="text-sm font-medium text-slate-600">Assign Technician</span>
                                                    </template>
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="unassigned" class="text-slate-500 italic">Unassigned</SelectItem>
                                                <SelectSeparator />
                                                <SelectItem v-for="mechanic in mechanics" :key="mechanic.id" :value="mechanic.id">
                                                    <div class="flex items-center gap-2">
                                                        <Avatar class="h-6 w-6 border">
                                                            <AvatarImage :src="mechanic.profilePicture" />
                                                            <AvatarFallback class="text-[10px]">{{ getInitials(mechanic.name) }}</AvatarFallback>
                                                        </Avatar>
                                                        <span>{{ mechanic.name }}</span>
                                                    </div>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <Separator />

                                    <!-- Status -->
                                    <div class="space-y-2">
                                        <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block pl-1">Current Status</label>
                                        <Select :model-value="order.status" @update:model-value="handleStatusUpdate">
                                            <SelectTrigger class="w-full bg-slate-50 border-slate-200">
                                                <SelectValue>
                                                    <div class="flex items-center gap-2">
                                                        <Badge :variant="getStatusVariant(order.status)" class="rounded-md px-2 py-0.5 font-bold shadow-none border-transparent">
                                                            {{ COLUMNS[order.status] || order.status }}
                                                        </Badge>
                                                    </div>
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    <SelectLabel>Update Status</SelectLabel>
                                                    <SelectItem v-for="(label, key) in COLUMNS" :key="key" :value="key">
                                                        <div class="flex items-center gap-2">
                                                            <div class="h-2 w-2 rounded-full" :class="{
                                                                'bg-slate-400': key === 'PENDING',
                                                                'bg-blue-500': key === 'IN_PROGRESS',
                                                                'bg-green-500': key === 'COMPLETED',
                                                                'bg-red-500': key === 'CANCELLED'
                                                            }"></div>
                                                            <span>{{ label }}</span>
                                                        </div>
                                                    </SelectItem>
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <!-- Due Date -->
                                    <div class="bg-white rounded-xl border border-slate-100 p-3 shadow-sm space-y-2">
                                        <label class="text-[10px] font-bold uppercase tracking-wider text-slate-400 pl-1">Due Date</label>
                                        <DatePicker
                                            :model-value="order.estimatedCompletion ? new Date(order.estimatedCompletion) : null"
                                            @update:model-value="handleDueDateUpdate"
                                            placeholder="Set due date"
                                            class="w-full"
                                        />
                                        <div v-if="order.estimatedCompletion && isOverdue(order.estimatedCompletion)" class="flex justify-end">
                                            <span class="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-bold border border-red-100 flex items-center gap-1">
                                                <AlertTriangle class="h-3 w-3" /> OVERDUE
                                            </span>
                                        </div>
                                    </div>

                                    <!-- Notes -->
                                    <ServiceOrderNotes :orderId="order.id" />

                                    <!-- Actions -->
                                    <div class="space-y-2 pt-1 pb-4">
                                        <Button v-if="order.status === 'CANCELLED'" variant="outline" class="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 border-dashed" @click="handleArchive" :disabled="isArchiving">
                                            <Archive class="h-4 w-4 mr-2" />
                                            {{ isArchiving ? 'Archiving...' : 'Archive Order' }}
                                        </Button>
                                        <template v-if="order.status === 'COMPLETED'">
                                            <div v-if="order.paymentStatus === 'PAID'" class="bg-green-50 text-green-700 p-3 rounded-lg border border-green-200 flex items-center justify-center gap-2 font-medium">
                                                <CheckCircle class="h-4 w-4" /> Paid in Full
                                            </div>
                                            <Button v-else class="w-full bg-emerald-600 hover:bg-emerald-700 text-white" @click="handlePayNow">
                                                <CreditCard class="h-4 w-4 mr-2" />
                                                {{ order.paymentStatus === 'PARTIAL' ? 'Pay Balance' : 'Pay Now' }}
                                            </Button>
                                        </template>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="labor" class="mt-0 p-4 sm:p-6 data-[state=active]:animate-in data-[state=active]:fade-in data-[state=active]:slide-in-from-bottom-2 duration-300">
                                <ServiceOrderLabor
                                    v-if="order"
                                    :items="laborItems"
                                    :orderId="order.id"
                                    :loading="loading"
                                    @order-updated="handleOrderUpdate"
                                />
                            </TabsContent>

                            <TabsContent value="parts" class="mt-0 p-4 sm:p-6 data-[state=active]:animate-in data-[state=active]:fade-in data-[state=active]:slide-in-from-bottom-2 duration-300">
                                <ServiceOrderParts
                                    v-if="order"
                                    :items="partItems"
                                    :orderId="order.id"
                                    :loading="loading"
                                    @order-updated="handleOrderUpdate"
                                />
                            </TabsContent>

                            <TabsContent value="advisory" class="mt-0 p-4 sm:p-6 data-[state=active]:animate-in data-[state=active]:fade-in data-[state=active]:slide-in-from-bottom-2 duration-300">
                                <ServiceOrderAdvisory
                                    v-if="order"
                                    :orderId="order.id"
                                    :advisories="order.advisories || []"
                                    :loading="loading"
                                    @order-updated="handleOrderUpdate"
                                />
                            </TabsContent>

                            <TabsContent value="financials" class="mt-0 p-4 sm:p-6 data-[state=active]:animate-in data-[state=active]:fade-in data-[state=active]:slide-in-from-bottom-2 duration-300">
                                <div class="flex items-start justify-center">
                                    <Card class="w-full max-w-lg shadow-xl shadow-slate-200/50 border-slate-200">
                                        <CardHeader class="pb-4 border-b bg-slate-50/50">
                                            <div class="flex items-center gap-3">
                                                <div class="h-10 w-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                                                    <CreditCard class="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <CardTitle class="text-lg">Payment Summary</CardTitle>
                                                    <CardDescription>Breakdown of costs for this service order</CardDescription>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent class="pt-6 space-y-6">
                                            <div v-if="order" class="space-y-4">
                                                <div class="space-y-3">
                                                    <div class="flex justify-between items-center text-sm p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                                        <span class="text-slate-600 flex items-center gap-2">
                                                            <Wrench class="h-4 w-4 text-slate-400" />
                                                            Labor Charges
                                                        </span>
                                                        <span class="font-medium font-mono">{{ formatCurrency(order.laborTotal) }}</span>
                                                    </div>
                                                    <div class="flex justify-between items-center text-sm p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                                        <span class="text-slate-600 flex items-center gap-2">
                                                            <Car class="h-4 w-4 text-slate-400" />
                                                            Parts & Materials
                                                        </span>
                                                        <span class="font-medium font-mono">{{ formatCurrency(order.partsTotal) }}</span>
                                                    </div>
                                                    <div v-if="order.discount > 0" class="flex justify-between items-center text-sm p-2 rounded-lg hover:bg-slate-50 transition-colors text-red-600">
                                                        <span class="flex items-center gap-2 font-medium">
                                                            <div class="w-4 h-4 flex items-center justify-center">
                                                                <span class="text-xs font-bold">%</span>
                                                            </div>
                                                            Discount {{ order.discountReason ? `(${order.discountReason})` : '' }}
                                                        </span>
                                                        <span class="font-medium font-mono">- {{ formatCurrency(order.discount) }}</span>
                                                    </div>
                                                </div>
                                                <Separator class="bg-slate-200" />
                                                <div class="rounded-xl bg-slate-900 p-5 text-white shadow-lg space-y-4">
                                                    <div class="flex justify-between items-center">
                                                        <span class="font-medium text-slate-300">Total Due</span>
                                                        <span class="font-bold text-3xl tracking-tight">{{ formatCurrency(order.totalAmount) }}</span>
                                                    </div>
                                                    <div class="bg-white/10 rounded-lg p-3 flex items-center justify-between border border-white/10">
                                                        <div class="flex items-center gap-3">
                                                            <div class="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                                                <CheckCircle class="h-4 w-4" v-if="order.paymentStatus === 'PAID'" />
                                                                <CreditCard class="h-4 w-4" v-else />
                                                            </div>
                                                            <div class="flex flex-col">
                                                                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment Status</span>
                                                                <span class="text-xs font-bold text-emerald-400 capitalize">{{ order.paymentStatus || 'UNPAID' }}</span>
                                                            </div>
                                                        </div>
                                                        <div class="text-right">
                                                            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Paid to Date</span>
                                                            <span class="text-sm font-bold text-white">{{ formatCurrency(order.amountPaid || 0) }}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div v-else class="space-y-4">
                                                <Skeleton class="h-4 w-full" />
                                                <Skeleton class="h-4 w-full" />
                                                <Separator />
                                                <Skeleton class="h-32 w-full rounded-xl" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>
            </div>

        </DialogContent>
    </Dialog>

    <!-- Confirmation Dialog -->
    <Dialog v-model:open="showArchiveConfirm">
        <DialogContent class="sm:max-w-md">
            <DialogHeader>
                <DialogTitle class="flex items-center gap-2 text-destructive">
                    <AlertTriangle class="h-5 w-5" />
                    Archive Order
                </DialogTitle>
                <DialogDescription>
                    Are you sure you want to archive this service order? This action will remove it from the active views. This cannot be undone.
                </DialogDescription>
            </DialogHeader>
            <DialogFooter class="gap-2 sm:gap-0">
                <Button variant="outline" @click="showArchiveConfirm = false" :disabled="isArchiving">Cancel</Button>
                <Button variant="destructive" @click="executeArchive" :disabled="isArchiving" class="ml-2">
                    {{ isArchiving ? 'Archiving...' : 'Yes, Archive Order' }}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>
