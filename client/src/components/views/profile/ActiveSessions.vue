<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'vue-sonner'
import { LogOut, Smartphone, Monitor, AlertCircle, RefreshCw } from 'lucide-vue-next'
import api from '@/api'

const sessions = ref([])
const isLoading = ref(true)
const isDeletingSession = ref(null)
const isRefreshing = ref(false)
let refreshInterval = null

// Fetch sessions from API
const fetchSessions = async (silent = false) => {
  try {
    if (!silent) {
      isLoading.value = true
    }
    const response = await api.get('/user/sessions')
    sessions.value = response.data.sessions
  } catch (error) {
    console.error('Failed to fetch sessions:', error)
    if (!silent) {
      toast.error('Failed to Load Sessions', {
        description: 'Could not retrieve your active sessions.'
      })
    }
  } finally {
    isLoading.value = false
    isRefreshing.value = false
  }
}

// Manual refresh
const refreshSessions = async () => {
  isRefreshing.value = true
  await fetchSessions(true)
  toast.success('Sessions Refreshed', {
    description: 'Session list has been updated.'
  })
}

// Terminate a specific session
const terminateSession = async (sessionId) => {
  try {
    isDeletingSession.value = sessionId
    
    await api.delete(`/user/sessions/${sessionId}`)
    
    toast.success('Session Terminated', {
      description: 'The session has been logged out successfully.'
    })
    
    // Refresh sessions list
    await fetchSessions()
  } catch (error) {
    console.error('Failed to terminate session:', error)
    
    const errorMessage = error.response?.data?.message || 'Failed to terminate session'
    toast.error('Termination Failed', {
      description: errorMessage
    })
  } finally {
    isDeletingSession.value = null
  }
}

// Format last active time
const formatLastActive = (lastActivity) => {
  const now = new Date()
  const lastActiveDate = new Date(lastActivity)
  const diffMs = now - lastActiveDate
  const diffMins = Math.floor(diffMs / 60000)
  
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
  
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
}

// Get device icon
const getDeviceIcon = (device) => {
  if (!device) return Monitor
  const deviceLower = device.toLowerCase()
  if (deviceLower.includes('android') || deviceLower.includes('iphone') || deviceLower.includes('ipad')) {
    return Smartphone
  }
  return Monitor
}

onMounted(() => {
  fetchSessions()
  
  // Auto-refresh every 30 seconds
  refreshInterval = setInterval(() => {
    fetchSessions(true) // Silent refresh
  }, 30000)
  
  // Refresh when tab becomes visible
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onUnmounted(() => {
  // Clear interval on component unmount
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})

// Refresh when tab becomes visible
const handleVisibilityChange = () => {
  if (!document.hidden) {
    fetchSessions(true)
  }
}
</script>

<template>
  <Card>
    <CardHeader>
      <div class="flex items-center justify-between">
        <div>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>
            Manage your active sessions across devices
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          @click="refreshSessions"
          :disabled="isRefreshing"
          class="gap-2"
        >
          <RefreshCw 
            class="h-4 w-4" 
            :class="{ 'animate-spin': isRefreshing }"
          />
          Refresh
        </Button>
      </div>
    </CardHeader>
    <CardContent>
      <!-- Loading State -->
      <div v-if="isLoading" class="space-y-3">
        <div v-for="i in 2" :key="i" class="flex items-center justify-between p-3 rounded-lg border">
          <div class="space-y-2 flex-1">
            <Skeleton class="h-4 w-32" />
            <Skeleton class="h-3 w-48" />
            <Skeleton class="h-3 w-24" />
          </div>
          <Skeleton class="h-6 w-16" />
        </div>
      </div>

      <!-- No Sessions -->
      <div v-else-if="sessions.length === 0" class="text-center py-8">
        <AlertCircle class="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <p class="text-sm text-muted-foreground">No active sessions found</p>
      </div>

      <!-- Sessions List -->
      <div v-else class="space-y-3">
        <div 
          v-for="session in sessions" 
          :key="session.id"
          class="flex items-center justify-between p-3 rounded-lg border"
        >
          <div class="flex items-start gap-3 flex-1">
            <component 
              :is="getDeviceIcon(session.deviceInfo)" 
              class="h-5 w-5 text-muted-foreground mt-0.5"
            />
            <div class="space-y-1 flex-1">
              <div class="flex items-center gap-2">
                <p class="font-medium">
                  {{ session.isCurrent ? 'Current Session' : 'Session' }}
                </p>
                <Badge 
                  v-if="session.isCurrent"
                  variant="outline" 
                  class="bg-green-50 text-green-700 border-green-200"
                >
                  Active
                </Badge>
              </div>
              <p class="text-sm text-muted-foreground">
                {{ session.deviceInfo || 'Unknown Device' }} • 
                {{ session.browser || 'Unknown Browser' }} • 
                {{ session.location || 'Unknown Location' }}
              </p>
              <p class="text-xs text-muted-foreground">
                Last active: {{ formatLastActive(session.lastActivity) }}
              </p>
            </div>
          </div>
          
          <!-- Logout Button (only for non-current sessions) -->
          <Button
            v-if="!session.isCurrent"
            variant="outline"
            size="sm"
            @click="terminateSession(session.id)"
            :disabled="isDeletingSession === session.id"
            class="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut class="h-4 w-4" />
            {{ isDeletingSession === session.id ? 'Logging out...' : 'Logout' }}
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
