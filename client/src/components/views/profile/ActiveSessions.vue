<script setup>
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// In a real app, this would come from an API
const sessions = [
  {
    id: 1,
    device: 'Windows',
    browser: 'Chrome',
    location: 'Philippines',
    lastActive: 'Just now',
    isCurrent: true
  }
]
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Active Sessions</CardTitle>
      <CardDescription>
        Manage your active sessions across devices
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div class="space-y-3">
        <div 
          v-for="session in sessions" 
          :key="session.id"
          class="flex items-center justify-between p-3 rounded-lg border"
        >
          <div class="space-y-1">
            <p class="font-medium">
              {{ session.isCurrent ? 'Current Session' : 'Session' }}
            </p>
            <p class="text-sm text-muted-foreground">
              {{ session.device }} • {{ session.browser }} • {{ session.location }}
            </p>
            <p class="text-xs text-muted-foreground">
              Last active: {{ session.lastActive }}
            </p>
          </div>
          <Badge 
            variant="outline" 
            class="bg-green-50 text-green-700 border-green-200"
          >
            Active
          </Badge>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
