<script setup>
import { provide, ref } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps({
  defaultValue: {
    type: String,
    required: true
  },
  class: {
    type: String,
    default: ''
  }
})

const activeTab = ref(props.defaultValue)

const setActiveTab = (value) => {
  activeTab.value = value
}

provide('activeTab', activeTab)
provide('setActiveTab', setActiveTab)
</script>

<template>
  <div :class="cn('', props.class)">
    <slot />
  </div>
</template>
