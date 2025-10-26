<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  LayoutDashboard,
  Users,
  FileText,
  DollarSign,
  Bell,
  Calendar,
  Package,
  TrendingUp,
  Settings,
  User,
  Moon,
} from 'lucide-vue-next'

const route = useRoute()

// Navigation items organized by sections
const navigationItems = [
  {
    title: 'Overview',
    items: [
      {
        title: 'Dashboard',
        icon: LayoutDashboard,
        url: '/dashboard',
        description: 'Main landing page for daily stats',
      },
    ],
  },
  {
    title: 'Operations',
    items: [
      {
        title: 'Customers',
        icon: Users,
        url: '/dashboard/customers',
        description: 'Customer & Vehicle CRM hub',
      },
      {
        title: 'New Service Order',
        icon: FileText,
        url: '/dashboard/service-orders/new',
        description: 'Start Transaction/Financial process',
      },
      {
        title: 'Transactions',
        icon: DollarSign,
        url: '/dashboard/transactions',
        description: 'View receipts, payments, and balances',
      },
      {
        title: 'Notifications',
        icon: Bell,
        url: '/dashboard/notifications',
        description: 'View log of automated SMS/Email',
      },
      {
        title: 'Appointments',
        icon: Calendar,
        url: '/dashboard/appointments',
        description: 'Schedule and manage appointments',
      },
    ],
  },
  {
    title: 'Inventory',
    items: [
      {
        title: 'Parts & Supplies',
        icon: Package,
        url: '/dashboard/inventory',
        description: 'Inventory List and CRUD',
      },
      {
        title: 'Restock/Usage Reports',
        icon: TrendingUp,
        url: '/dashboard/inventory/reports',
        description: 'Critical reports for preventing overstocking',
      },
    ],
  },
]

// System section (appears at bottom)
const systemItems = [
  {
    title: 'System Admin',
    icon: Settings,
    url: '/dashboard/admin',
    description: 'Admin-only access for roles, backup, settings',
    adminOnly: true,
  },
  {
    title: 'My Account',
    icon: User,
    url: '/dashboard/profile',
    description: 'User profile and settings',
  },
]

const isActive = (url) => {
  return route.path === url
}

const toggleDarkMode = () => {
  // Placeholder for dark mode toggle functionality
  // This will be implemented when dark mode feature is added
  console.log('Dark mode toggle clicked - feature coming soon')
}
</script>

<template>
  <Sidebar collapsible="icon" class="border-r border-border/40">
    <SidebarHeader>
      <div class="flex items-center justify-center gap-3 px-4 py-6 group-data-[collapsible=icon]:px-2">
        <!-- Logo for expanded state -->
        <img 
          src="/logo/symbol_w_wordmark_primary.png" 
          alt="DAD-J Auto Shop" 
          class="h-auto w-30 transition-all duration-300 group-data-[collapsible=icon]:hidden"
        />
        <!-- Logo for collapsed state -->
        <img 
          src="/logo/primary_logo.png" 
          alt="DAD-J" 
          class="h-auto w-14 hidden group-data-[collapsible=icon]:block transition-all duration-300"
        />
      </div>
      <div class="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    </SidebarHeader>

    <SidebarContent class="px-3 py-1 group-data-[collapsible=icon]:px-0">
      <TooltipProvider :delayDuration="1000">
        <!-- Main Navigation Sections -->
        <SidebarGroup v-for="section in navigationItems" :key="section.title" class="mb-6 group-data-[collapsible=icon]:mb-3">
          <SidebarGroupLabel class="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2 px-2 group-data-[collapsible=icon]:hidden">
            {{ section.title }}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu class="space-y-1 group-data-[collapsible=icon]:space-y-1">
              <SidebarMenuItem v-for="item in section.items" :key="item.title" class="group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
                <Tooltip>
                  <TooltipTrigger as-child>
                    <SidebarMenuButton
                      :as="'a'"
                      :href="item.url"
                      :isActive="isActive(item.url)"
                      @click.prevent="$router.push(item.url)"
                      :class="[
                        'relative rounded-lg transition-all duration-200 hover:bg-accent/50',
                        'group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center',
                        isActive(item.url) 
                          ? '!bg-primary !text-white shadow-md shadow-primary/20 hover:!bg-primary hover:shadow-lg hover:shadow-primary/30' 
                          : 'text-foreground/70 hover:text-foreground'
                      ]"
                    >
                      <component 
                        :is="item.icon" 
                        :class="[
                          'w-5 h-5 transition-all duration-200 group-data-[collapsible=icon]:m-0',
                          isActive(item.url) ? 'scale-110 !text-white' : ''
                        ]" 
                      />
                      <span class="font-medium group-data-[collapsible=icon]:hidden">{{ item.title }}</span>
                    </SidebarMenuButton>
                  </TooltipTrigger>
                  <TooltipContent side="right" class="group-data-[state=expanded]:hidden">
                    <p class="font-medium">{{ item.title }}</p>
                    <p v-if="item.description" class="text-xs text-gray-200 mt-1">{{ item.description }}</p>
                  </TooltipContent>
                </Tooltip>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <!-- System Section at Bottom -->
        <SidebarGroup class="mt-auto">
          <div class="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-4" />
          <SidebarGroupLabel class="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2 px-2 group-data-[collapsible=icon]:hidden">
            System
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu class="space-y-1 group-data-[collapsible=icon]:space-y-1">
              <SidebarMenuItem v-for="item in systemItems" :key="item.title" class="group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
                <Tooltip>
                  <TooltipTrigger as-child>
                    <SidebarMenuButton
                      :as="'a'"
                      :href="item.url"
                      :isActive="isActive(item.url)"
                      @click.prevent="$router.push(item.url)"
                      :class="[
                        'relative rounded-lg transition-all duration-200 hover:bg-accent/50',
                        'group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center',
                        isActive(item.url) 
                          ? '!bg-primary !text-white shadow-md shadow-primary/20 hover:!bg-primary hover:shadow-lg hover:shadow-primary/30' 
                          : 'text-foreground/70 hover:text-foreground'
                      ]"
                    >
                      <component 
                        :is="item.icon" 
                        :class="[
                          'w-5 h-5 transition-all duration-200 group-data-[collapsible=icon]:m-0',
                          isActive(item.url) ? 'scale-110 !text-white' : ''
                        ]" 
                      />
                      <span class="font-medium group-data-[collapsible=icon]:hidden">{{ item.title }}</span>
                    </SidebarMenuButton>
                  </TooltipTrigger>
                  <TooltipContent side="right" class="group-data-[state=expanded]:hidden">
                    <p class="font-medium">{{ item.title }}</p>
                    <p v-if="item.description" class="text-xs text-gray-200 mt-1">{{ item.description }}</p>
                  </TooltipContent>
                </Tooltip>
              </SidebarMenuItem>
              
              <!-- Dark Mode Toggle -->
              <SidebarMenuItem class="group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
                <Tooltip>
                  <TooltipTrigger as-child>
                    <SidebarMenuButton 
                      @click="toggleDarkMode"
                      class="rounded-lg transition-all duration-200 hover:bg-accent/50 text-foreground/70 hover:text-foreground cursor-pointer group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center"
                    >
                      <Moon class="w-5 h-5 group-data-[collapsible=icon]:m-0" />
                      <span class="font-medium group-data-[collapsible=icon]:hidden">Dark Mode</span>
                      <span class="ml-auto text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium group-data-[collapsible=icon]:hidden">
                        Soon
                      </span>
                    </SidebarMenuButton>
                  </TooltipTrigger>
                  <TooltipContent side="right" class="group-data-[state=expanded]:hidden">
                    <p class="font-medium">Dark Mode</p>
                    <p class="text-xs text-gray-200 mt-1">Coming soon</p>
                  </TooltipContent>
                </Tooltip>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </TooltipProvider>
    </SidebarContent>

    <SidebarFooter class="border-t border-border/40">
      <div class="px-4 py-4 text-xs text-muted-foreground group-data-[collapsible=icon]:px-2">
        <div class="flex flex-col gap-1 group-data-[collapsible=icon]:items-center">
          <div class="flex items-center gap-2 group-data-[collapsible=icon]:hidden mb-2">
            <div class="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span class="font-medium">System Active</span>
          </div>
          <span class="font-semibold text-foreground/60 group-data-[collapsible=icon]:hidden">Developed by Synera</span>
          <span class="text-muted-foreground/50 group-data-[collapsible=icon]:hidden">Version 1.0.0</span>
          <div class="hidden group-data-[collapsible=icon]:flex flex-col items-center gap-1">
            <div class="w-2 h-2 rounded-full bg-green-500" />
            <span class="font-medium text-[10px]">v1.0</span>
          </div>
        </div>
      </div>
    </SidebarFooter>

    <SidebarRail />
  </Sidebar>
</template>
