<script setup>
import { inject } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps({
  class: {
    type: String,
    default: ''
  }
})

const activeTab = inject('activeTab')
</script>

<template>
  <div :class="cn('inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground', props.class)">
    <slot />
  </div>
</template>
