<script setup>
import { ref, watch } from 'vue'
import { Search, Plus, Filter, ArrowUpDown } from 'lucide-vue-next'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const props = defineProps({
  search: String,
  category: String,
  brand: String,
  sortBy: String,
  sortOrder: String,
  stockStatus: String,
  categories: {
    type: Array,
    default: () => []
  },
  brands: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:search', 'update:category', 'update:brand', 'update:sortBy', 'update:sortOrder', 'update:stockStatus', 'add-item'])

const localSearch = ref(props.search)
const localCategory = ref(props.category || 'All')
const localBrand = ref(props.brand || 'All')
const localSortBy = ref(props.sortBy || 'updatedAt')
const localSortOrder = ref(props.sortOrder || 'desc')
const localStockStatus = ref(props.stockStatus || 'all')

// Debounce search input
let timeout
watch(localSearch, (newVal) => {
  clearTimeout(timeout)
  timeout = setTimeout(() => {
    emit('update:search', newVal)
  }, 300)
})

watch(localCategory, (newVal) => {
  emit('update:category', newVal)
})

watch(localBrand, (newVal) => {
    emit('update:brand', newVal)
})

watch(localSortBy, (newVal) => {
  console.log('InventoryControls: sortBy changed', newVal)
  emit('update:sortBy', newVal)
})

watch(localSortOrder, (newVal) => {
  console.log('InventoryControls: sortOrder changed', newVal)
  emit('update:sortOrder', newVal)
})

watch(localStockStatus, (newVal) => {
  console.log('InventoryControls: stockStatus changed', newVal)
  emit('update:stockStatus', newVal)
})

const toggleSortOrder = () => {
  localSortOrder.value = localSortOrder.value === 'asc' ? 'desc' : 'asc'
}
</script>

<template>
  <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div class="flex flex-1 items-center gap-2">
      <!-- Search Bar -->
      <div class="relative w-full max-w-sm">
        <Search class="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          v-model="localSearch"
          placeholder="Search by Brand or Part Name..."
          class="pl-8"
        />
      </div>

      <!-- Filter Dropdown -->
      <Select v-model="localCategory">
        <SelectTrigger class="w-[180px]">
          <div class="flex items-center gap-2">
            <Filter class="h-4 w-4" />
            <SelectValue placeholder="Category" />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All">All Categories</SelectItem>
          <SelectItem v-for="cat in categories" :key="cat" :value="cat">
            {{ cat }}
          </SelectItem>
        </SelectContent>
      </Select>

      <!-- Brand Filter -->
      <Select v-model="localBrand">
        <SelectTrigger class="w-[180px]">
          <div class="flex items-center gap-2">
            <Filter class="h-4 w-4" />
            <SelectValue placeholder="Brand" />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All">All Brands</SelectItem>
          <SelectItem v-for="b in brands" :key="b" :value="b">
            {{ b }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div class="flex flex-1 items-center gap-2">
       <!-- Stock Status Filter -->
       <Select v-model="localStockStatus">
        <SelectTrigger class="w-[140px]">
          <SelectValue placeholder="Stock Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Stock</SelectItem>
          <SelectItem value="low">Low Stock</SelectItem>
          <SelectItem value="out">Out of Stock</SelectItem>
        </SelectContent>
      </Select>

      <!-- Sort Dropdown -->
      <Select v-model="localSortBy">
        <SelectTrigger class="w-[140px]">
          <div class="flex items-center gap-2">
            <ArrowUpDown class="h-4 w-4" />
            <SelectValue placeholder="Sort By" />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="updatedAt">Latest</SelectItem>
          <SelectItem value="name">Name</SelectItem>
          <SelectItem value="quantity">Stock Level</SelectItem>
          <SelectItem value="sellingPrice">Price</SelectItem>
        </SelectContent>
      </Select>

      <!-- Sort Order Button -->
      <Button variant="outline" size="icon" @click="toggleSortOrder" :title="localSortOrder === 'asc' ? 'Ascending' : 'Descending'">
        <ArrowUpDown class="h-4 w-4 transition-transform" :class="{ 'rotate-180': localSortOrder === 'asc' }" />
      </Button>
    </div>

    <!-- Add New Item Button -->
    <Button class="bg-[#000080] hover:bg-[#000060]" @click="$emit('add-item')">
      <Plus class="mr-2 h-4 w-4" />
      Add New Item
    </Button>
  </div>
</template>
