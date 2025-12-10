<script setup>
import { computed } from 'vue'
import { Users, Shield, UserCog, Wrench } from 'lucide-vue-next'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const props = defineProps({
  stats: {
    type: Object,
    required: true,
    default: () => ({
      roleCounts: {},
      activeCount: 0,
      inactiveCount: 0,
      totalCount: 0
    })
  }
})

const statCards = computed(() => [
  {
    title: 'Total Users',
    value: props.stats.totalCount || 0,
    icon: Users,
    description: 'All registered users',
    cssClasses: {
      bg: 'bg-gradient-to-br from-blue-50 to-white border-blue-100',
      title: 'text-blue-900',
      iconBg: 'bg-blue-100/50',
      icon: 'text-blue-600',
      value: 'text-blue-700',
      description: 'text-blue-600/80'
    }
  },
  {
    title: 'Admins',
    value: props.stats.roleCounts?.admin || 0,
    icon: Shield,
    description: 'System administrators',
    cssClasses: {
      bg: 'bg-gradient-to-br from-purple-50 to-white border-purple-100',
      title: 'text-purple-900',
      iconBg: 'bg-purple-100/50',
      icon: 'text-purple-600',
      value: 'text-purple-700',
      description: 'text-purple-600/80'
    }
  },
  {
    title: 'Staff',
    value: props.stats.roleCounts?.staff || 0,
    icon: UserCog,
    description: 'Staff members',
    cssClasses: {
      bg: 'bg-gradient-to-br from-indigo-50 to-white border-indigo-100',
      title: 'text-indigo-900',
      iconBg: 'bg-indigo-100/50',
      icon: 'text-indigo-600',
      value: 'text-indigo-700',
      description: 'text-indigo-600/80'
    }
  },
  {
    title: 'Mechanics',
    value: props.stats.roleCounts?.mechanic || 0,
    icon: Wrench,
    description: 'Service technicians',
    cssClasses: {
      bg: 'bg-gradient-to-br from-green-50 to-white border-green-100',
      title: 'text-green-900',
      iconBg: 'bg-green-100/50',
      icon: 'text-green-600',
      value: 'text-green-700',
      description: 'text-green-600/80'
    }
  }
])
</script>

<template>
  <div class="grid gap-4 md:grid-cols-4">
    <Card 
      v-for="stat in statCards" 
      :key="stat.title"
      :class="['relative overflow-hidden transition-all hover:shadow-md border', stat.cssClasses.bg]"
    >
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle :class="['text-sm font-medium', stat.cssClasses.title]">
          {{ stat.title }}
        </CardTitle>
        <div :class="['p-2 rounded-lg', stat.cssClasses.iconBg]">
          <component :is="stat.icon" :class="['h-4 w-4', stat.cssClasses.icon]" />
        </div>
      </CardHeader>
      <CardContent>
        <div :class="['text-2xl font-bold', stat.cssClasses.value]">{{ stat.value }}</div>
        <p :class="['text-xs', stat.cssClasses.description]">
          {{ stat.description }}
        </p>
      </CardContent>
    </Card>
  </div>
</template>
