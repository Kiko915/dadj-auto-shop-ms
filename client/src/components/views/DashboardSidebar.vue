<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
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
  Wrench,
  ClipboardList,
  ChevronRight
} from 'lucide-vue-next'

const route = useRoute()
const authStore = useAuthStore()

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
    title: 'CRM',
    items: [
      {
        title: 'Customer Database',
        icon: Users,
        // No URL for parent item if it has children
        children: [
            {
                title: 'Customers',
                url: '/dashboard/customers',
                description: 'Existing customers table'
            },
            {
                title: 'Vehicles',
                url: '/dashboard/vehicles',
                description: 'All vehicles in system'
            },
             {
                title: 'Customer Analytics',
                url: '#',
                description: 'Coming soon',
                comingSoon: true
            }
        ]
      },
      {
        title: 'Appointments',
        icon: Calendar,
        url: '/dashboard/appointments',
        description: 'Schedule and manage appointments',
        comingSoon: true
      },
       {
        title: 'Communication',
        icon: Bell, // Placeholder icon
        url: '/dashboard/communication',
        description: 'SMS/Email logs',
        comingSoon: true
      },
    ],
  },
  {
    title: 'Inventory Management',
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
        comingSoon: true
      },
    ],
  },
  {
    title: 'Service Operations',
    items: [
      {
        title: 'Estimates',
        icon: FileText,
        children: [
            {
                title: 'New Estimate',
                url: '/dashboard/estimates/new',
                description: 'Create a quote for approval',
            },
            {
                title: 'Your Estimates',
                url: '/dashboard/estimates',
                description: 'View all estimates',
            }
        ]
      },
      {
        title: 'Service Orders',
        icon: Wrench,
        children: [
          {
            title: 'Job Board',
            url: '/dashboard/service-orders',
            description: 'Active repairs & status board',
          },
          {
            title: 'Service History',
            url: '/dashboard/service-history',
            description: 'Completed vehicle history',
            comingSoon: true
          },
        ]
      },
      {
        title: 'Billing & Invoicing',
        icon: DollarSign,
        url: '/dashboard/billing',
        description: 'Invoices and payments',
        comingSoon: true
      },

    ],
  },
]

// System section (appears at bottom)
const systemItems = [
  {
      title: 'Notifications',
      icon: Bell,
      url: '/dashboard/notifications',
      description: 'System notifications',
      comingSoon: true
  },
  {
    title: 'System Admin',
    icon: Settings,
    description: 'Admin-only access for roles, backup, settings',
    adminOnly: true,
    children: [
      {
        title: 'User Management',
        url: '/dashboard/admin/users',
        description: 'Manage user accounts and roles',
      },
      {
        title: 'System Settings',
        url: '/dashboard/admin/settings',
        description: 'Configure system settings',
      },
      {
        title: 'System Health',
        url: '/dashboard/admin/health',
        description: 'Monitor system performance and health',
      },
    ]
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
  <Sidebar collapsible="icon" class="border-r border-border/40 bg-[#041954]">
    <SidebarHeader>
      <div class="flex items-center justify-center gap-3 px-4 py-6 group-data-[collapsible=icon]:px-2">
        <!-- Logo for expanded state -->
        <img 
          src="/logo/symbol_w_wordmark_primary.png" 
          alt="DAD-J Auto Shop" 
          class="h-auto w-36 transition-all duration-300 group-data-[collapsible=icon]:hidden"
        />
        <!-- Logo for collapsed state -->
        <img 
          src="/logo/primary_logo.png" 
          alt="DAD-J" 
          class="h-auto w-18 hidden group-data-[collapsible=icon]:block transition-all duration-300"
        />
      </div>
      <div class="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    </SidebarHeader>

    <SidebarContent class="px-3 py-1 group-data-[collapsible=icon]:px-0">
      <TooltipProvider :delayDuration="1000">
        <!-- Main Navigation Sections -->
        <div v-for="(section, index) in navigationItems" :key="section.title">
          <SidebarSeparator v-if="index > 0" class="mb-2" />
          <SidebarGroup class="mb-1 group-data-[collapsible=icon]:mb-1">
            <SidebarGroupLabel class="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2 px-2 group-data-[collapsible=icon]:hidden">
              {{ section.title }}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu class="space-y-1 group-data-[collapsible=icon]:space-y-1">
              
              <template v-for="item in section.items" :key="item.title">
                
                <!-- Collapsible Item with Children -->
                <Collapsible v-if="item.children" as-child :default-open="false" class="group/collapsible">
                  <SidebarMenuItem>
                    <CollapsibleTrigger as-child>
                      <SidebarMenuButton :tooltip="item.title" class="cursor-pointer">
                        <component :is="item.icon" class="w-5 h-5 mr-2" />
                        <span class="font-medium">{{ item.title }}</span>
                        <ChevronRight class="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent class="collapsible-content">
                      <SidebarMenuSub class="ml-4 border-l border-border pl-2 space-y-1">
                          <SidebarMenuSubItem v-for="child in item.children" :key="child.title">
                              <Tooltip>
                                <TooltipTrigger as-child>
                                  <SidebarMenuSubButton 
                                      :as="'a'" 
                                      :href="child.url"
                                      @click.prevent="child.comingSoon ? null : $router.push(child.url)"
                                      :class="[
                                          'text-sm transition-all duration-200 rounded-md',
                                          isActive(child.url) 
                                            ? '!bg-primary !text-white shadow-md shadow-primary/20 hover:!bg-primary hover:shadow-lg hover:shadow-primary/30' 
                                            : 'text-foreground/70 hover:text-foreground hover:bg-accent/50',
                                          child.comingSoon ? 'opacity-50 cursor-not-allowed' : ''
                                      ]"
                                  >
                                      <span class="truncate">{{ child.title }}</span>
                                      <span v-if="child.comingSoon" class="ml-auto text-[10px] uppercase text-muted-foreground border border-border px-1 rounded shrink-0">Soon</span>
                                  </SidebarMenuSubButton>
                                </TooltipTrigger>
                                <TooltipContent side="right">
                                  <p class="font-medium">{{ child.title }}</p>
                                  <p v-if="child.description" class="text-xs text-gray-200 mt-1">{{ child.description }}</p>
                                </TooltipContent>
                              </Tooltip>
                          </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>

                <!-- Standard Item without Children -->
                <SidebarMenuItem v-else class="group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
                  <Tooltip>
                    <TooltipTrigger as-child>
                      <SidebarMenuButton
                        :as="'a'"
                        :href="item.url"
                        :isActive="isActive(item.url)"
                        @click.prevent="item.comingSoon ? null : $router.push(item.url)"
                        :class="[
                          'relative rounded-lg transition-all duration-200 hover:bg-accent/50',
                          'group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center',
                          isActive(item.url) 
                            ? '!bg-primary !text-white shadow-md shadow-primary/20 hover:!bg-primary hover:shadow-lg hover:shadow-primary/30' 
                            : 'text-foreground/70 hover:text-foreground',
                          item.comingSoon ? 'opacity-70' : ''
                        ]"
                      >
                        <component 
                          :is="item.icon" 
                          :class="[
                            'w-5 h-5 transition-all duration-200 group-data-[collapsible=icon]:m-0',
                            isActive(item.url) ? 'scale-110 !text-white' : ''
                          ]" 
                        />
                        <span class="font-medium truncate group-data-[collapsible=icon]:hidden">{{ item.title }}</span>
                        <span v-if="item.comingSoon" class="ml-auto text-[10px] uppercase bg-muted text-muted-foreground px-1.5 py-0.5 rounded shrink-0 group-data-[collapsible=icon]:hidden">
                            Soon
                        </span>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    <TooltipContent side="right" class="group-data-[state=expanded]:hidden">
                      <p class="font-medium">{{ item.title }}</p>
                      <p v-if="item.description" class="text-xs text-gray-200 mt-1">{{ item.description }}</p>
                    </TooltipContent>
                  </Tooltip>
                </SidebarMenuItem>

              </template>

            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        </div>

        <!-- System Section at Bottom -->
        <SidebarGroup class="mt-auto">
          <div class="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-4" />
          <SidebarGroupLabel class="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2 px-2 group-data-[collapsible=icon]:hidden">
            System
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu class="space-y-1 group-data-[collapsible=icon]:space-y-1">
              <template v-for="item in systemItems" :key="item.title">
                  <!-- Collapsible System Item with Children -->
                  <Collapsible 
                    v-if="item.children && (!item.adminOnly || (item.adminOnly && authStore.currentUser?.role === 'admin'))" 
                    as-child 
                    :default-open="false" 
                    class="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger as-child>
                        <SidebarMenuButton :tooltip="item.title" class="cursor-pointer">
                          <component :is="item.icon" class="w-5 h-5 mr-2" />
                          <span class="font-medium">{{ item.title }}</span>
                          <ChevronRight class="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent class="collapsible-content">
                        <SidebarMenuSub class="ml-4 border-l border-border pl-2 space-y-1">
                          <SidebarMenuSubItem v-for="child in item.children" :key="child.title">
                            <Tooltip>
                              <TooltipTrigger as-child>
                                <SidebarMenuSubButton 
                                  :as="'a'" 
                                  :href="child.url"
                                  @click.prevent="child.comingSoon ? null : $router.push(child.url)"
                                  :class="[
                                    'text-sm transition-all duration-200 rounded-md',
                                    isActive(child.url) 
                                      ? '!bg-primary !text-white shadow-md shadow-primary/20 hover:!bg-primary hover:shadow-lg hover:shadow-primary/30' 
                                      : 'text-foreground/70 hover:text-foreground hover:bg-accent/50',
                                    child.comingSoon ? 'opacity-50 cursor-not-allowed' : ''
                                  ]"
                                >
                                  <span class="truncate">{{ child.title }}</span>
                                  <span v-if="child.comingSoon" class="ml-auto text-[10px] uppercase text-muted-foreground border border-border px-1 rounded shrink-0">Soon</span>
                                </SidebarMenuSubButton>
                              </TooltipTrigger>
                              <TooltipContent side="right">
                                <p class="font-medium">{{ child.title }}</p>
                                <p v-if="child.description" class="text-xs text-gray-200 mt-1">{{ child.description }}</p>
                              </TooltipContent>
                            </Tooltip>
                          </SidebarMenuSubItem>
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>

                  <!-- Standard System Item without Children -->
                  <SidebarMenuItem 
                    v-else-if="!item.adminOnly || (item.adminOnly && authStore.currentUser?.role === 'admin')"
                    class="group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center"
                  >
                    <Tooltip>
                    <TooltipTrigger as-child>
                        <SidebarMenuButton
                        :as="'a'"
                        :href="item.url"
                        :isActive="isActive(item.url)"
                        @click.prevent="item.comingSoon ? null : $router.push(item.url)"
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
                        <span class="font-medium truncate group-data-[collapsible=icon]:hidden">{{ item.title }}</span>
                        <span v-if="item.comingSoon" class="ml-auto text-[10px] uppercase bg-muted text-muted-foreground px-1.5 py-0.5 rounded shrink-0 group-data-[collapsible=icon]:hidden">
                            Soon
                        </span>
                        </SidebarMenuButton>
                    </TooltipTrigger>
                    <TooltipContent side="right" class="group-data-[state=expanded]:hidden">
                        <p class="font-medium">{{ item.title }}</p>
                        <p v-if="item.description" class="text-xs text-gray-200 mt-1">{{ item.description }}</p>
                    </TooltipContent>
                    </Tooltip>
                </SidebarMenuItem>
              </template>
              
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
