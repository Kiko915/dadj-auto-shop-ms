<template>
  <!-- Welcome Section -->
  <div class="space-y-6">
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Dashboard</h1>
      <p class="text-muted-foreground">
        Welcome back! Here's what's happening today.
      </p>
    </div>

      <!-- Stats Cards -->
      <div v-if="dashboardStats" class="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Total Users</CardTitle>
            <Users class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ dashboardStats.totalUsers }}</div>
            <p class="text-xs text-muted-foreground">All registered users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Active Users</CardTitle>
            <CheckCircle class="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold text-green-600">{{ dashboardStats.activeUsers }}</div>
            <p class="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Inactive Users</CardTitle>
            <AlertCircle class="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold text-red-600">{{ dashboardStats.inactiveUsers }}</div>
            <p class="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>
      </div>

      <!-- Loading State -->
      <div v-else class="grid gap-4 md:grid-cols-3">
        <Card v-for="i in 3" :key="i">
          <CardHeader>
            <Skeleton class="h-4 w-[100px]" />
          </CardHeader>
          <CardContent>
            <Skeleton class="h-8 w-[60px] mb-2" />
            <Skeleton class="h-3 w-[120px]" />
          </CardContent>
        </Card>
      </div>

      <!-- User Information -->
      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
          <CardDescription>Your current session details</CardDescription>
        </CardHeader>
        <CardContent>
          <dl class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div class="space-y-1">
              <dt class="text-sm font-medium text-muted-foreground">Email</dt>
              <dd class="text-sm">{{ authStore.userEmail }}</dd>
            </div>
            <div class="space-y-1">
              <dt class="text-sm font-medium text-muted-foreground">Status</dt>
              <dd>
                <Badge variant="outline" class="bg-green-50 text-green-700 border-green-200">
                  <div class="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></div>
                  Authenticated
                </Badge>
              </dd>
            </div>
            <div class="space-y-1">
              <dt class="text-sm font-medium text-muted-foreground">Role</dt>
              <dd>
                <Badge>{{ dashboardStats?.currentUser?.role || 'Loading...' }}</Badge>
              </dd>
            </div>
            <div class="space-y-1">
              <dt class="text-sm font-medium text-muted-foreground">Login Time</dt>
              <dd class="text-sm">{{ currentTime }}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <!-- Quick Actions -->
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Button variant="outline" class="justify-start h-auto py-4" @click="router.push('/dashboard/customers')">
              <Users class="mr-2 h-5 w-5" />
              <div class="text-left">
                <div class="font-medium">Manage Customers</div>
                <div class="text-xs text-muted-foreground">View and edit customer data</div>
              </div>
            </Button>
            <Button variant="outline" class="justify-start h-auto py-4" @click="router.push('/dashboard/services')">
              <Car class="mr-2 h-5 w-5" />
              <div class="text-left">
                <div class="font-medium">Vehicle Services</div>
                <div class="text-xs text-muted-foreground">Manage service records</div>
              </div>
            </Button>
            <Button variant="outline" class="justify-start h-auto py-4" @click="router.push('/dashboard/settings')">
              <Settings class="mr-2 h-5 w-5" />
              <div class="text-left">
                <div class="font-medium">Settings</div>
                <div class="text-xs text-muted-foreground">Configure your preferences</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/api'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { CheckCircle, Users, Car, Settings, AlertCircle } from 'lucide-vue-next'
import { useSEO } from '@/composables/useSEO'

// SEO Configuration
useSEO({
  title: 'Dashboard',
  description: 'DADJ Auto Shop customer dashboard. View your service history, schedule appointments, and manage your vehicle information.',
  keywords: 'dashboard, customer portal, vehicle services, appointment scheduling, service history',
  type: 'website'
})

const router = useRouter()
const authStore = useAuthStore()
const currentTime = ref('')
const dashboardStats = ref(null)
const isLoading = ref(true)

// Initialize component
onMounted(async () => {
  currentTime.value = new Date().toLocaleString()
  await loadDashboardData()
})

// Load dashboard data from protected API
const loadDashboardData = async () => {
  try {
    isLoading.value = true
    const response = await api.get('/protected/dashboard-stats')
    dashboardStats.value = response.data.stats
  } catch (error) {
    console.error('Failed to load dashboard data:', error)
  } finally {
    isLoading.value = false
  }
}
</script>