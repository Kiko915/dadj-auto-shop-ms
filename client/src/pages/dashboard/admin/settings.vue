<script setup>
import { Settings, Construction } from 'lucide-vue-next'
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
      <h2 class="text-3xl font-bold tracking-tight">System Settings</h2>
      <p class="text-muted-foreground">
        Configure system-wide settings and preferences.
      </p>
    </div>

    <!-- Coming Soon Card -->
    <Card class="border-dashed">
      <CardContent class="flex flex-col items-center justify-center py-16">
        <div class="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <Construction class="h-8 w-8 text-primary" />
        </div>
        <h3 class="text-xl font-semibold mb-2">Coming Soon</h3>
        <p class="text-muted-foreground text-center max-w-md">
          System settings page is currently under development. 
          Soon you'll be able to configure business information, notification preferences, 
          backup settings, and more.
        </p>
        <div class="flex items-center gap-2 mt-6 text-sm text-muted-foreground">
          <Settings class="h-4 w-4" />
          <span>Expected features: Business Profile, Notifications, Backups, Integrations</span>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
