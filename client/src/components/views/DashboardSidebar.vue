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
  LayoutDashboard,
  Car,
  Users,
  Calendar,
  Package,
  FileText,
  Settings,
  BarChart,
  Wrench,
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
      },
      {
        title: 'Analytics',
        icon: BarChart,
        url: '/dashboard/analytics',
      },
    ],
  },
  {
    title: 'Management',
    items: [
      {
        title: 'Vehicles',
        icon: Car,
        url: '/dashboard/vehicles',
      },
      {
        title: 'Services',
        icon: Wrench,
        url: '/dashboard/services',
      },
      {
        title: 'Appointments',
        icon: Calendar,
        url: '/dashboard/appointments',
      },
      {
        title: 'Customers',
        icon: Users,
        url: '/dashboard/customers',
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
      },
      {
        title: 'Reports',
        icon: FileText,
        url: '/dashboard/reports',
      },
    ],
  },
]

const isActive = (url) => {
  return route.path === url
}
</script>

<template>
  <Sidebar collapsible="icon">
    <SidebarHeader>
      <div class="flex items-center gap-3 px-2 py-4">
        <!-- Logo for expanded state -->
        <img 
          src="/logo/symbol_w_wordmark_primary.png" 
          alt="DAD-J Auto Shop" 
          class="h-auto w-20 group-data-[collapsible=icon]:hidden"
        />
        <!-- Logo for collapsed state -->
        <img 
          src="/logo/primary_logo.png" 
          alt="DAD-J" 
          class="h-auto w-10 hidden group-data-[collapsible=icon]:block"
        />
      </div>
    </SidebarHeader>

    <SidebarContent>
      <SidebarGroup v-for="section in navigationItems" :key="section.title">
        <SidebarGroupLabel>{{ section.title }}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem v-for="item in section.items" :key="item.title">
              <SidebarMenuButton
                :as="'a'"
                :href="item.url"
                :isActive="isActive(item.url)"
                @click.prevent="$router.push(item.url)"
              >
                <component :is="item.icon" class="w-4 h-4" />
                <span>{{ item.title }}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <!-- Settings Section at Bottom -->
      <SidebarGroup class="mt-auto">
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                :as="'a'"
                :href="'/dashboard/settings'"
                :isActive="isActive('/dashboard/settings')"
                @click.prevent="$router.push('/dashboard/settings')"
              >
                <Settings class="w-4 h-4" />
                <span>Settings</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>

    <SidebarFooter>
      <div class="px-3 py-4 text-xs text-muted-foreground group-data-[collapsible=icon]:px-2 border-t">
        <div class="flex flex-col gap-1 group-data-[collapsible=icon]:items-center">
          <span class="font-medium group-data-[collapsible=icon]:hidden">Developed by Synera</span>
          <span class="group-data-[collapsible=icon]:hidden">Version 1.0.0</span>
          <span class="hidden group-data-[collapsible=icon]:block font-medium">v1.0</span>
        </div>
      </div>
    </SidebarFooter>

    <SidebarRail />
  </Sidebar>
</template>
