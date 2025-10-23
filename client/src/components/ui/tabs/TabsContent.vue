<script setup>
import { inject, computed } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps({
  value: {
    type: String,
    required: true
  },
  class: {
    type: String,
    default: ''
  }
})

const activeTab = inject('activeTab')

const isActive = computed(() => activeTab.value === props.value)
</script>

<template>
  <div
    v-show="isActive"
    :class="cn('mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2', props.class)"
  >
    <slot />
  </div>
</template>
