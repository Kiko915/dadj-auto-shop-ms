<script setup>
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import DashboardSidebar from './DashboardSidebar.vue'
import DashboardNavbar from './DashboardNavbar.vue'
</script>

<template>
  <SidebarProvider>
    <DashboardSidebar />
    <SidebarInset class="flex flex-col">
      <div class="sticky top-0 z-10 bg-background">
        <DashboardNavbar />
      </div>
      <main class="flex-1 overflow-y-auto">
        <div class="container mx-auto p-6">
          <router-view />
        </div>
      </main>
    </SidebarInset>
  </SidebarProvider>
</template>
