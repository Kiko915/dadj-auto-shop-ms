<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <!-- Logo and Title -->
          <div class="flex items-center">
            <img src="/logo/symbol_logo_white.png" alt="Logo" class="w-8 h-8 mr-3" />
            <h1 class="text-xl font-semibold text-gray-900">DAD-J Auto Shop</h1>
          </div>
          
          <!-- User Info and Logout -->
          <div class="flex items-center space-x-4">
            <div class="text-sm text-gray-700">
              Welcome, <span class="font-medium">{{ authStore.userEmail }}</span>
            </div>
            <Button
              @click="handleLogout"
              variant="outline"
              size="sm"
              class="text-gray-600 hover:text-gray-900"
            >
              <LogOut class="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <!-- Welcome Section -->
        <div class="bg-white overflow-hidden shadow rounded-lg mb-6">
          <div class="px-4 py-5 sm:p-6">
            <div class="flex items-center">
              <CheckCircle class="w-8 h-8 text-green-500 mr-3" />
              <div>
                <h2 class="text-2xl font-bold text-gray-900">Welcome to DAD-J Auto Shop!</h2>
                <p class="text-gray-600 mt-1">Authentication is working successfully.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- User Information Card -->
        <div class="bg-white overflow-hidden shadow rounded-lg mb-6">
          <div class="px-4 py-5 sm:p-6">
            <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
              User Information
            </h3>
            <dl class="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
              <div>
                <dt class="text-sm font-medium text-gray-500">Email</dt>
                <dd class="mt-1 text-sm text-gray-900">{{ authStore.userEmail }}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">Authentication Status</dt>
                <dd class="mt-1">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <div class="w-1.5 h-1.5 bg-green-400 rounded-full mr-1"></div>
                    Authenticated
                  </span>
                </dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">Role</dt>
                <dd class="mt-1">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {{ dashboardStats?.currentUser?.role || 'Loading...' }}
                  </span>
                </dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">Login Time</dt>
                <dd class="mt-1 text-sm text-gray-900">{{ currentTime }}</dd>
              </div>
            </dl>
          </div>
        </div>

        <!-- Dashboard Statistics -->
        <div v-if="dashboardStats" class="bg-white overflow-hidden shadow rounded-lg mb-6">
          <div class="px-4 py-5 sm:p-6">
            <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
              System Statistics
            </h3>
            <dl class="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-3">
              <div class="bg-gray-50 px-4 py-3 rounded-lg">
                <dt class="text-sm font-medium text-gray-500">Total Users</dt>
                <dd class="mt-1 text-2xl font-semibold text-gray-900">{{ dashboardStats.totalUsers }}</dd>
              </div>
              <div class="bg-green-50 px-4 py-3 rounded-lg">
                <dt class="text-sm font-medium text-gray-500">Active Users</dt>
                <dd class="mt-1 text-2xl font-semibold text-green-600">{{ dashboardStats.activeUsers }}</dd>
              </div>
              <div class="bg-red-50 px-4 py-3 rounded-lg">
                <dt class="text-sm font-medium text-gray-500">Inactive Users</dt>
                <dd class="mt-1 text-2xl font-semibold text-red-600">{{ dashboardStats.inactiveUsers }}</dd>
              </div>
            </dl>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="px-4 py-5 sm:p-6">
            <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Button class="flex items-center justify-center py-3" variant="outline">
                <Users class="w-5 h-5 mr-2" />
                Manage Users
              </Button>
              <Button class="flex items-center justify-center py-3" variant="outline">
                <Car class="w-5 h-5 mr-2" />
                Vehicle Services
              </Button>
              <Button class="flex items-center justify-center py-3" variant="outline">
                <Settings class="w-5 h-5 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { authAPI } from '@/api/auth'
import api from '@/api'
import { Button } from '@/components/ui/button'
import { CheckCircle, LogOut, Users, Car, Settings } from 'lucide-vue-next'

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

// Handle logout
const handleLogout = async () => {
  try {
    // Call the auth store logout (which calls server logout)
    await authStore.logout()
    
    // Redirect to login page
    router.push('/auth/login')
  } catch (error) {
    console.error('Logout error:', error)
    // Even if server logout fails, still redirect to login
    router.push('/auth/login')
  }
}
</script>