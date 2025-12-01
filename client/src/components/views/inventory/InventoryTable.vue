<script setup>
import { computed } from 'vue'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Edit, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  PackageOpen, 
  MoreHorizontal,
  Eye
} from 'lucide-vue-next'
import QuickRestockPopover from './QuickRestockPopover.vue'

const props = defineProps({
  items: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  currentPage: {
    type: Number,
    default: 1
  },
  totalPages: {
    type: Number,
    default: 1
  }
})

const emit = defineEmits(['page-change', 'edit-item', 'delete-item', 'restock-success', 'view-item'])

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP'
  }).format(value)
}

const getInitials = (name) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}
</script>

<template>
  <div class="space-y-4">
    <div class="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead class="w-[80px]">Image</TableHead>
            <TableHead>Item Name</TableHead>
            <TableHead>Brand</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Stock Level</TableHead>
            <TableHead>Price</TableHead>
            <TableHead class="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="loading">
            <TableCell colspan="7" class="h-24 text-center">
              Loading inventory...
            </TableCell>
          </TableRow>
          
          <TableRow v-else-if="items.length === 0">
            <TableCell colspan="7" class="h-32 text-center">
              <div class="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <PackageOpen class="h-8 w-8" />
                <p>No parts found. Specific brand parts like Ford might need to be added.</p>
              </div>
            </TableCell>
          </TableRow>

          <TableRow v-else v-for="item in items" :key="item.id">
            <!-- Image -->
            <TableCell>
              <Avatar class="h-10 w-10 rounded-lg border">
                <AvatarImage :src="item.imageUrl" :alt="item.name" />
                <AvatarFallback>{{ getInitials(item.name) }}</AvatarFallback>
              </Avatar>
            </TableCell>

            <!-- Item Name -->
            <TableCell class="font-medium">
              {{ item.name }}
              <div v-if="item.sku" class="text-xs text-muted-foreground">SKU: {{ item.sku }}</div>
            </TableCell>

            <!-- Brand -->
            <TableCell>
              <Badge variant="secondary" class="font-normal">
                {{ item.brand }}
              </Badge>
            </TableCell>

            <!-- Category -->
            <TableCell>{{ item.category }}</TableCell>

            <!-- Stock Level -->
            <TableCell>
              <div class="flex items-center gap-3">
                <div class="flex-1 space-y-1">
                  <div class="flex items-center justify-between text-xs">
                    <span 
                      class="font-medium"
                      :class="{ 'text-destructive': item.quantity <= (item.lowStockThreshold || 5) }"
                    >
                      {{ item.quantity }} units
                    </span>
                    <span class="text-muted-foreground text-[10px]">
                      {{ item.quantity <= (item.lowStockThreshold || 5) ? 'Low Stock' : 'In Stock' }}
                    </span>
                  </div>
                  <div class="h-1.5 w-24 bg-secondary rounded-full overflow-hidden">
                    <div 
                      class="h-full rounded-full transition-all duration-500"
                      :class="item.quantity <= (item.lowStockThreshold || 5) ? 'bg-destructive' : 'bg-primary'"
                      :style="{ width: `${Math.min((item.quantity / ((item.lowStockThreshold || 5) * 3)) * 100, 100)}%` }"
                    />
                  </div>
                </div>
                <QuickRestockPopover 
                  :item="item" 
                  @restock-success="(updatedItem) => $emit('restock-success', updatedItem)" 
                />
              </div>
            </TableCell>

            <!-- Price -->
            <TableCell>{{ formatCurrency(item.sellingPrice) }}</TableCell>

            <!-- Actions -->
            <TableCell class="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button variant="ghost" class="h-8 w-8 p-0">
                    <span class="sr-only">Open menu</span>
                    <MoreHorizontal class="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem @click="$emit('view-item', item)">
                    <Eye class="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem @click="$emit('edit-item', item)">
                    <Edit class="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem @click="$emit('delete-item', item)" class="text-destructive">
                    <Trash2 class="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
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
