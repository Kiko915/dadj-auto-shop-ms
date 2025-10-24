<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ProfileTab from '@/components/views/profile/ProfileTab.vue'
import SecurityTab from '@/components/views/profile/SecurityTab.vue'
import DataExportTab from '@/components/views/profile/DataExportTab.vue'
import DeleteAccountTab from '@/components/views/profile/DeleteAccountTab.vue'
import {
  User,
  Shield,
  Download,
  Trash2,
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

// Valid tab values
const validTabs = ['profile', 'security', 'data', 'delete']

// Get initial tab from URL query parameter or default to 'profile'
const getInitialTab = () => {
  const tabParam = route.query.tab
  return validTabs.includes(tabParam) ? tabParam : 'profile'
}

const currentTab = ref(getInitialTab())

// Update URL when tab changes
const handleTabChange = (newTab) => {
  if (newTab && validTabs.includes(newTab)) {
    router.push({ query: { tab: newTab } })
  }
}

// Watch for URL changes (e.g., browser back/forward)
watch(() => route.query.tab, (newTab) => {
  if (newTab && validTabs.includes(newTab)) {
    currentTab.value = newTab
  } else if (!newTab) {
    currentTab.value = 'profile'
    router.replace({ query: { tab: 'profile' } })
  }
})

// Set initial URL if no tab parameter exists
onMounted(() => {
  if (!route.query.tab) {
    router.replace({ query: { tab: 'profile' } })
  }
})
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Profile Settings</h1>
      <p class="text-muted-foreground">
        Manage your account settings and preferences
      </p>
    </div>

    <!-- Tabs -->
    <Tabs 
      v-model="currentTab" 
      :default-value="currentTab"
      @update:model-value="handleTabChange" 
      class="space-y-6"
    >
      <TabsList class="grid w-full grid-cols-4 lg:w-auto">
        <TabsTrigger value="profile">
          <User class="h-4 w-4 mr-2" />
          <span class="hidden sm:inline">My Profile</span>
          <span class="sm:hidden">Profile</span>
        </TabsTrigger>
        <TabsTrigger value="security">
          <Shield class="h-4 w-4 mr-2" />
          <span class="hidden sm:inline">Security</span>
          <span class="sm:hidden">Security</span>
        </TabsTrigger>
        <TabsTrigger value="data">
          <Download class="h-4 w-4 mr-2" />
          <span class="hidden sm:inline">Data Export</span>
          <span class="sm:hidden">Export</span>
        </TabsTrigger>
        <TabsTrigger value="delete">
          <Trash2 class="h-4 w-4 mr-2" />
          <span class="hidden sm:inline">Delete Account</span>
          <span class="sm:hidden">Delete</span>
        </TabsTrigger>
      </TabsList>

      <!-- Tab Contents -->
      <TabsContent value="profile">
        <ProfileTab />
      </TabsContent>

      <TabsContent value="security">
        <SecurityTab />
      </TabsContent>

      <TabsContent value="data">
        <DataExportTab />
      </TabsContent>

      <TabsContent value="delete">
        <DeleteAccountTab />
      </TabsContent>
    </Tabs>
  </div>
</template>
