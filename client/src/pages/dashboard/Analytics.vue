<script setup>
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { BarChart, TrendingUp, TrendingDown, Activity } from 'lucide-vue-next'
import { useSEO } from '@/composables/useSEO'

useSEO({
  title: 'Analytics - Dashboard',
  description: 'View analytics and insights for your auto shop',
  keywords: 'analytics, statistics, insights, reports',
})
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Analytics</h1>
      <p class="text-muted-foreground">
        Insights and performance metrics for your business.
      </p>
    </div>

      <!-- Metrics Grid -->
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Revenue</CardTitle>
            <Activity class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">$45,231.89</div>
            <p class="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp class="h-3 w-3 text-green-600" />
              <span class="text-green-600">+20.1%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Services</CardTitle>
            <BarChart class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">+2350</div>
            <p class="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp class="h-3 w-3 text-green-600" />
              <span class="text-green-600">+180.1%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Appointments</CardTitle>
            <Activity class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">+12,234</div>
            <p class="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp class="h-3 w-3 text-green-600" />
              <span class="text-green-600">+19%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Customer Satisfaction</CardTitle>
            <TrendingUp class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">95.2%</div>
            <p class="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingDown class="h-3 w-3 text-red-600" />
              <span class="text-red-600">-2%</span> from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <!-- Charts Placeholder -->
      <div class="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>Monthly revenue for the current year</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="h-[300px] flex items-center justify-center border-2 border-dashed rounded-lg">
              <p class="text-muted-foreground">Chart component will be added here</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Service Distribution</CardTitle>
            <CardDescription>Breakdown of services by type</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="h-[300px] flex items-center justify-center border-2 border-dashed rounded-lg">
              <p class="text-muted-foreground">Chart component will be added here</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
</template>
