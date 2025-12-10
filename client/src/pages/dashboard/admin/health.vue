<script setup>
import { Activity, Construction, Server, Database, Cpu } from 'lucide-vue-next'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h2 class="text-3xl font-bold tracking-tight">System Health</h2>
      <p class="text-muted-foreground">
        Monitor system performance, uptime, and resource usage.
      </p>
    </div>

    <!-- Coming Soon Card -->
    <Card class="border-dashed">
      <CardContent class="flex flex-col items-center justify-center py-16">
        <div class="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-6">
          <Construction class="h-8 w-8 text-green-600" />
        </div>
        <h3 class="text-xl font-semibold mb-2">Coming Soon</h3>
        <p class="text-muted-foreground text-center max-w-md">
          System health monitoring is currently under development. 
          Soon you'll be able to view server status, database health, 
          API performance, and system logs.
        </p>
        <div class="flex items-center gap-6 mt-6 text-sm text-muted-foreground">
          <div class="flex items-center gap-2">
            <Server class="h-4 w-4" />
            <span>Server Status</span>
          </div>
          <div class="flex items-center gap-2">
            <Database class="h-4 w-4" />
            <span>Database</span>
          </div>
          <div class="flex items-center gap-2">
            <Cpu class="h-4 w-4" />
            <span>Performance</span>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
