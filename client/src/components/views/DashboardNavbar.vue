<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import UserAvatar from '@/components/views/UserAvatar.vue'
import {
  Bell,
  User,
  Settings,
  LogOut,
  ChevronDown,
} from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'

const router = useRouter()
const authStore = useAuthStore()

// Mock notifications count - replace with actual data
const notificationsCount = ref(3)

// Format user role for display
const displayRole = computed(() => {
  const role = authStore.userRole || 'user'
  return role.charAt(0).toUpperCase() + role.slice(1)
})

const handleLogout = () => {
  try {
    // Call logout which clears local storage and calls server
    authStore.logout()
    
    // Redirect to login page
    router.push('/auth/login')
  } catch (error) {
    console.error('Logout error:', error)
    // Even if there's an error, still redirect to login
    router.push('/auth/login')
  }
}
</script>

<template>
  <header class="flex h-16 shrink-0 items-center gap-4 border-b bg-background px-6 shadow-sm">
    <!-- Sidebar Trigger -->
    <SidebarTrigger class="-ml-2" />
    
    <!-- Separator -->
    <div class="h-6 w-px bg-border" />
    
    <!-- Page Title/Breadcrumb Area -->
    <div class="flex-1">
      <h1 class="text-lg font-semibold">Dashboard</h1>
    </div>
    
    <!-- Right Side Actions -->
    <div class="flex items-center gap-3">
      <!-- Notifications -->
      <Button variant="ghost" size="icon" class="relative">
        <Bell class="h-5 w-5" />
        <Badge 
          v-if="notificationsCount > 0"
          variant="destructive" 
          class="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
        >
          {{ notificationsCount }}
        </Badge>
      </Button>

      <!-- User Menu -->
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="ghost" class="relative h-10 gap-2 px-2">
            <UserAvatar 
              :email="authStore.userEmail" 
              :profile-picture="authStore.profilePicture"
              size="default"
            />
            <div class="hidden md:flex flex-col items-start text-left">
              <span class="text-sm font-medium">{{authStore.userName || authStore.userEmail }}</span>
              <span class="text-xs text-muted-foreground">{{ displayRole }}</span>
            </div>
            <ChevronDown class="h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="w-56">
          <DropdownMenuLabel>
            <div class="flex flex-col space-y-1">
              <p class="text-sm font-medium">My Account</p>
              <p class="text-xs text-muted-foreground truncate">
                {{ authStore.userEmail }}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem @click="router.push('/dashboard/profile')">
            <User class="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem @click="router.push('/dashboard/settings')">
            <Settings class="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem @click="handleLogout" class="text-destructive focus:text-destructive">
            <LogOut class="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </header>
</template>
