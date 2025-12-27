<template>
  <Card 
    class="relative overflow-hidden transition-all hover:shadow-md cursor-pointer border-l-4"
    :class="[
      themeClasses.cardBg,
      themeClasses.borderColor
    ]"
    @click="onClick"
  >
    <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle class="text-sm font-medium" :class="themeClasses.titleColor">
        {{ title }}
      </CardTitle>
      <div class="p-2 rounded-lg" :class="themeClasses.iconBg">
        <component :is="icon" class="h-4 w-4" :class="themeClasses.iconColor" />
      </div>
    </CardHeader>
    <CardContent>
      <div class="text-2xl font-bold" :class="themeClasses.valueColor">
        {{ value }}
      </div>
      <p v-if="description" class="text-xs" :class="themeClasses.descColor">
        {{ description }}
      </p>
    </CardContent>
  </Card>
</template>

<script setup>
import { computed } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const props = defineProps({
  title: { type: String, required: true },
  value: { type: [String, Number], required: true },
  description: { type: String, default: '' },
  icon: { type: Object, required: true },
  variant: { type: String, default: 'blue', validator: (v) => ['blue', 'green', 'red', 'amber'].includes(v) }
})

const emit = defineEmits(['click'])

const onClick = () => {
    emit('click')
}

const themeClasses = computed(() => {
  switch (props.variant) {
    case 'green':
      return {
        cardBg: 'bg-gradient-to-br from-green-50 to-white',
        borderColor: 'border-green-500',
        titleColor: 'text-green-900',
        iconBg: 'bg-green-100/50',
        iconColor: 'text-green-600',
        valueColor: 'text-green-700',
        descColor: 'text-green-600/80'
      }
    case 'red':
      return {
        cardBg: 'bg-gradient-to-br from-red-50 to-white',
        borderColor: 'border-red-500',
        titleColor: 'text-red-900',
        iconBg: 'bg-red-100/50',
        iconColor: 'text-red-600',
        valueColor: 'text-red-700',
        descColor: 'text-red-600/80'
      }
    case 'amber':
      return {
        cardBg: 'bg-gradient-to-br from-amber-50 to-white',
        borderColor: 'border-amber-500',
        titleColor: 'text-amber-900',
        iconBg: 'bg-amber-100/50',
        iconColor: 'text-amber-600',
        valueColor: 'text-amber-700',
        descColor: 'text-amber-600/80'
      }
    case 'blue':
    default:
      return {
        cardBg: 'bg-gradient-to-br from-blue-50 to-white',
        borderColor: 'border-blue-500',
        titleColor: 'text-blue-900',
        iconBg: 'bg-blue-100/50',
        iconColor: 'text-blue-600',
        valueColor: 'text-blue-700',
        descColor: 'text-blue-600/80'
      }
  }
})
</script>
