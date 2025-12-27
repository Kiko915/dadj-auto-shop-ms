<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { Search, Plus } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

interface Props {
  searchQuery: string
  loyaltyFilter: 'all' | 'Loyal' | 'Regular' | 'VIP'
  sortOrder: 'asc' | 'desc'
  itemsPerPage: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:search-query': [value: string]
  'update:loyalty-filter': [value: 'all' | 'Loyal' | 'Regular' | 'VIP']
  'update:sort-order': [value: 'asc' | 'desc']
  'update:items-per-page': [value: number]
}>()

const handleSearchQueryUpdate = (value: string) => {
  emit('update:search-query', value)
}

const handleLoyaltyFilterUpdate = (value: string) => {
  emit('update:loyalty-filter', value as 'all' | 'Loyal' | 'Regular' | 'VIP')
}

const handleSortOrderUpdate = (value: string) => {
  emit('update:sort-order', value as 'asc' | 'desc')
}

const handleItemsPerPageUpdate = (value: string | number) => {
  emit('update:items-per-page', Number(value))
}
</script>

<template>
  <section class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
    <div class="relative w-full md:max-w-2xl">
      <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        :model-value="searchQuery"
        @update:model-value="handleSearchQueryUpdate"
        placeholder="Search name, phone, email, loyalty, vehicles"
        class="pl-10"
      />
    </div>
    <div class="flex flex-col items-stretch gap-2 sm:flex-row md:w-auto">
      <Button asChild class="sm:w-[180px]">
        <RouterLink :to="{ name: 'add-customer' }">
          <Plus class="mr-2 h-4 w-4" />
          Add Customer
        </RouterLink>
      </Button>
      <Select 
        :model-value="loyaltyFilter" 
        @update:model-value="handleLoyaltyFilterUpdate"
      >
        <SelectTrigger class="sm:w-[160px]">
          <SelectValue placeholder="Loyalty Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="Loyal">Loyal</SelectItem>
          <SelectItem value="Regular">Regular</SelectItem>
          <SelectItem value="VIP">VIP</SelectItem>
        </SelectContent>
      </Select>
      <Select 
        :model-value="sortOrder" 
        @update:model-value="handleSortOrderUpdate"
      >
        <SelectTrigger class="sm:w-[180px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="asc">Name (A → Z)</SelectItem>
          <SelectItem value="desc">Name (Z → A)</SelectItem>
        </SelectContent>
      </Select>
      <Select 
        :model-value="itemsPerPage" 
        @update:model-value="handleItemsPerPageUpdate"
      >
        <SelectTrigger class="sm:w-[120px]">
          <SelectValue placeholder="Per page" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem :value="10">10 / page</SelectItem>
          <SelectItem :value="25">25 / page</SelectItem>
          <SelectItem :value="50">50 / page</SelectItem>
          <SelectItem :value="100">100 / page</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </section>
</template>
