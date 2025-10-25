<script setup>
import { provide, ref, watch } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps({
  defaultValue: {
    type: String,
    required: true
  },
  modelValue: {
    type: String,
    default: null
  },
  class: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])

// Use modelValue if provided, otherwise use defaultValue
const activeTab = ref(props.modelValue || props.defaultValue)

// Watch for external changes to modelValue
watch(() => props.modelValue, (newValue) => {
  if (newValue && newValue !== activeTab.value) {
    activeTab.value = newValue
  }
})

const setActiveTab = (value) => {
  activeTab.value = value
  emit('update:modelValue', value)
}

provide('activeTab', activeTab)
provide('setActiveTab', setActiveTab)
</script>

<template>
  <div :class="cn('', props.class)">
    <slot />
  </div>
</template>
