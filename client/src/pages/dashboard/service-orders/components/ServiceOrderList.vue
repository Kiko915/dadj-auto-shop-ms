<script setup lang="ts">
import { useRouter } from 'vue-router'
import { MoreHorizontal, Eye, Wrench, Calendar, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import type { ServiceOrder } from '../types'
import { formatDate, getInitials, getStatusVariant, isOverdue, isDueToday, formatStatus } from '../utils'

defineProps<{
    orders: ServiceOrder[],
    loading: boolean,
  currentPage: number,
  totalPages: number
}>()

const emit = defineEmits(['page-change', 'select-order'])
const router = useRouter()
</script>

<template>
  <div class="space-y-4">
    <div class="flex-1 rounded-md border bg-card overflow-hidden">
        <div class="h-full overflow-y-auto">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Mechanic</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead class="text-right">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                <TableRow v-if="loading && orders.length === 0">
                    <TableCell colspan="8" class="h-24 text-center">
                    <div class="flex justify-center">
                        <div class="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
                    </div>
                    </TableCell>
                </TableRow>
                
                <TableRow v-else-if="orders.length === 0">
                    <TableCell colspan="8" class="h-[400px] text-center">
                    <div class="flex flex-col items-center justify-center space-y-3">
                        <div class="flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
                        <Wrench class="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div class="space-y-1">
                        <h3 class="font-semibold text-lg tracking-tight">No service orders found</h3>
                        <p class="text-sm text-muted-foreground max-w-sm mx-auto">
                            Approved estimates will appear here as service orders.
                        </p>
                        </div>
                    </div>
                    </TableCell>
                </TableRow>

                <TableRow 
                    v-else 
                    v-for="order in orders" 
                    :key="order.id"
                    class="group hover:bg-muted/50 transition-colors"
                >
                    <TableCell class="font-medium font-mono text-xs text-muted-foreground">
                    {{ order.id }}
                    </TableCell>
                    <TableCell>
                        <div class="flex flex-col gap-1">
                             <div class="flex items-center gap-2 text-xs text-muted-foreground">
                                 <span class="w-12">Created:</span>
                                 <span>{{ formatDate(order.createdAt) }}</span>
                             </div>
                             <div v-if="order.estimatedCompletion" class="flex items-center gap-2 text-xs">
                                 <span class="w-12 text-muted-foreground">Due:</span>
                                 <span :class="{
                                     'text-amber-600 font-medium': isDueToday(order.estimatedCompletion),
                                     'text-red-600 font-medium': isOverdue(order.estimatedCompletion) && order.status !== 'COMPLETED' && order.status !== 'CANCELLED',
                                     'text-slate-700': !isDueToday(order.estimatedCompletion) && !isOverdue(order.estimatedCompletion)
                                 }">
                                    {{ formatDate(order.estimatedCompletion) }}
                                 </span>
                                 <Badge v-if="isDueToday(order.estimatedCompletion)" variant="outline" class="text-[10px] h-4 px-1 bg-amber-50 text-amber-600 border-amber-200">Today</Badge>
                                 <Badge v-else-if="isOverdue(order.estimatedCompletion) && order.status !== 'COMPLETED' && order.status !== 'CANCELLED'" variant="outline" class="text-[10px] h-4 px-1 bg-red-50 text-red-600 border-red-200">Overdue</Badge>
                             </div>
                        </div>
                    </TableCell>
                    <TableCell>
                        <div class="flex items-center gap-3">
                            <Avatar class="h-8 w-8 border border-slate-200">
                                <AvatarImage v-if="order.customer.profilePicture" :src="order.customer.profilePicture" />
                                <AvatarFallback class="bg-primary/10 text-primary text-xs font-medium">
                                    {{ getInitials(order.customer.firstName + ' ' + order.customer.lastName) }}
                                </AvatarFallback>
                            </Avatar>
                            <div class="flex flex-col">
                                <span class="font-medium text-sm">{{ order.customer.firstName }} {{ order.customer.lastName }}</span>
                            </div>
                        </div>
                    </TableCell>
                    <TableCell>
                        <div>
                            <div class="font-semibold text-slate-700">{{ order.vehicle.make }} {{ order.vehicle.model }}</div>
                            <div class="text-xs text-muted-foreground font-mono bg-slate-100 px-1.5 py-0.5 rounded w-fit mt-0.5">
                                {{ order.vehicle.licensePlate }}
                            </div>
                        </div>
                    </TableCell>
                    <TableCell>
                        <div v-if="order.mechanic" class="flex items-center gap-2">
                            <Avatar class="h-6 w-6 border border-slate-200">
                                <AvatarImage v-if="order.mechanic.profilePicture" :src="order.mechanic.profilePicture" />
                                <AvatarFallback class="bg-blue-100 text-blue-700 text-[10px]">
                                    {{ getInitials(order.mechanic.name) }}
                                </AvatarFallback>
                            </Avatar>
                            <span class="text-sm text-slate-700">{{ order.mechanic.name }}</span>
                        </div>
                        <Badge v-else variant="outline" class="text-xs text-muted-foreground font-normal border-dashed">
                            Unassigned
                        </Badge>
                    </TableCell>
                    <TableCell>
                        <Badge :variant="getStatusVariant(order.status)" class="rounded-full px-2.5 font-normal">
                            {{ formatStatus(order.status) }}
                        </Badge>
                    </TableCell>
                    <!-- Notes Column -->
                    <TableCell>
                        <TooltipProvider v-if="order.notes">
                            <Tooltip>
                                <TooltipTrigger>
                                     <div class="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2 py-1 rounded-md w-fit border border-amber-200 max-w-[150px]">
                                        <AlertTriangle class="h-3 w-3 shrink-0" />
                                        <span class="text-xs font-medium truncate">{{ order.notes }}</span>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{{ order.notes }}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <span v-else class="text-muted-foreground/30">-</span>
                    </TableCell>
                    <TableCell class="text-right">
                    <DropdownMenu>
                        <DropdownMenuTrigger as-child>
                        <Button variant="ghost" class="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 focus:opacity-100 focus-visible:opacity-100 transition-opacity">
                            <span class="sr-only">Open menu</span>
                            <MoreHorizontal class="h-4 w-4" />
                        </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem @click.stop="$emit('select-order', order.id)">
                            <Eye class="mr-2 h-4 w-4" />
                            View Details
                        </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    </TableCell>
                </TableRow>
                </TableBody>
            </Table>
        </div>
    </div>
    
    <!-- Pagination -->
    <div class="flex items-center justify-end gap-2">
      <Button
        variant="outline"
        size="sm"
        :disabled="currentPage <= 1 || loading"
        @click="$emit('page-change', currentPage - 1)"
      >
        <ChevronLeft class="h-4 w-4" />
        Previous
      </Button>
      <div class="text-sm font-medium">
        Page {{ currentPage }} of {{ totalPages || 1 }}
      </div>
      <Button
        variant="outline"
        size="sm"
        :disabled="currentPage >= totalPages || loading"
        @click="$emit('page-change', currentPage + 1)"
      >
        Next
        <ChevronRight class="h-4 w-4" />
      </Button>
    </div>
  </div>
</template>
