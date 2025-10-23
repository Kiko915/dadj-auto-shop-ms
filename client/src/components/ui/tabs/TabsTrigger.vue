<script setup>
import { inject, computed } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps({
  value: {
    type: String,
    required: true
  },
  disabled: {
    type: Boolean,
    default: false
  },
  class: {
    type: String,
    default: ''
  }
})

const activeTab = inject('activeTab')
const setActiveTab = inject('setActiveTab')

const isActive = computed(() => activeTab.value === props.value)

const handleClick = () => {
  if (!props.disabled) {
    setActiveTab(props.value)
  }
}
</script>

<template>
  <button
    type="button"
    :disabled="disabled"
    :class="cn(
      'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
      isActive 
        ? 'bg-background text-foreground shadow-sm' 
        : 'text-muted-foreground hover:text-foreground',
      props.class
    )"
    @click="handleClick"
  >
    <slot />
  </button>
</template>
