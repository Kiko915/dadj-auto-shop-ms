<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { UserPlus } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { toast } from 'vue-sonner'
import { getAllUsers, deactivateUser, activateUser, deleteUserPermanent } from '@/api/users'
import AddUserDialog from '@/components/views/admin/AddUserDialog.vue'
import EditUserDialog from '@/components/views/admin/EditUserDialog.vue'
import UserStatsCards from '@/components/views/admin/UserStatsCards.vue'
import UsersTable from '@/components/views/admin/UsersTable.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'

const router = useRouter()
const authStore = useAuthStore()

// Check admin access
const isAdmin = computed(() => authStore.currentUser?.role === 'admin')

// Data state
const users = ref([])
const loading = ref(true)
const searchQuery = ref('')
const debouncedSearchQuery = ref('')
const filterRole = ref('All')
const filterStatus = ref('All')
let debounceTimeout = null

// Pagination State
const currentPage = ref(1)
const pageSize = ref(10)
const totalUsers = ref(0)
const totalPages = ref(1)

// Stats
const stats = ref({
  roleCounts: {},
  activeCount: 0,
  inactiveCount: 0,
  totalCount: 0
})

// Dialog states
const isAddDialogOpen = ref(false)
const isEditDialogOpen = ref(false)
const selectedUser = ref(null)

// Confirmation Dialog State
const isConfirmDialogOpen = ref(false)
const userToDeactivate = ref(null)
const isDeactivating = ref(false)

// Delete Dialog State
const isDeleteDialogOpen = ref(false)
const userToDelete = ref(null)
const isDeleting = ref(false)

// Watch search query for debounce
watch(searchQuery, (newValue) => {
  if (debounceTimeout) clearTimeout(debounceTimeout)
  debounceTimeout = setTimeout(() => {
    debouncedSearchQuery.value = newValue
    currentPage.value = 1
    fetchUsers()
  }, 300)
})

// Watch filters
watch([filterRole, filterStatus], () => {
  currentPage.value = 1
  fetchUsers()
})

const fetchUsers = async () => {
  try {
    loading.value = true
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      search: debouncedSearchQuery.value,
      role: filterRole.value,
      status: filterStatus.value
    }
    
    const response = await getAllUsers(params)
    users.value = response.users
    
    if (response.meta) {
      totalUsers.value = response.meta.total
      totalPages.value = response.meta.totalPages
      currentPage.value = response.meta.page
    }
    
    if (response.stats) {
      stats.value = response.stats
    }
  } catch (error) {
    console.error('Failed to fetch users:', error)
    if (error.response?.status === 403) {
      toast.error('Access Denied', {
        description: 'You do not have permission to access this page.'
      })
      router.push('/dashboard')
    } else {
      toast.error('Error', {
        description: 'Failed to fetch users. Please try again.'
      })
    }
  } finally {
    loading.value = false
  }
}

const changePage = (newPage) => {
  if (newPage < 1 || newPage > totalPages.value) return
  currentPage.value = newPage
  fetchUsers()
}

const openEditDialog = (user) => {
  selectedUser.value = user
  isEditDialogOpen.value = true
}

const handleDeactivate = (user) => {
  userToDeactivate.value = user
  isConfirmDialogOpen.value = true
}

const confirmDeactivate = async () => {
  if (!userToDeactivate.value) return

  try {
    isDeactivating.value = true
    await deactivateUser(userToDeactivate.value.id)
    toast.success('User Deactivated', {
      description: `${userToDeactivate.value.name || userToDeactivate.value.email} has been deactivated.`
    })
    fetchUsers()
    isConfirmDialogOpen.value = false
  } catch (error) {
    console.error('Failed to deactivate user:', error)
    toast.error('Error', {
      description: error.response?.data?.error || 'Failed to deactivate user.'
    })
  } finally {
    isDeactivating.value = false
    userToDeactivate.value = null
  }
}



const handleHardDelete = (user) => {
  userToDelete.value = user
  isDeleteDialogOpen.value = true
}

const confirmHardDelete = async () => {
  if (!userToDelete.value) return

  try {
    isDeleting.value = true
    await deleteUserPermanent(userToDelete.value.id)
    toast.success('User Deleted', {
      description: `${userToDelete.value.name || userToDelete.value.email} has been permanently deleted.`
    })
    fetchUsers()
    isDeleteDialogOpen.value = false
  } catch (error) {
    console.error('Failed to delete user:', error)
    toast.error('Error', {
      description: error.response?.data?.error || 'Failed to delete user.'
    })
  } finally {
    isDeleting.value = false
    userToDelete.value = null
  }
}

const handleActivate = async (user) => {
  try {
    await activateUser(user.id)
    toast.success('User Activated', {
      description: `${user.name || user.email} has been reactivated.`
    })
    fetchUsers()
  } catch (error) {
    console.error('Failed to activate user:', error)
    toast.error('Error', {
      description: error.response?.data?.error || 'Failed to activate user.'
    })
  }
}

const handleUserCreated = () => {
  isAddDialogOpen.value = false
  fetchUsers()
}

const handleUserUpdated = () => {
  isEditDialogOpen.value = false
  selectedUser.value = null
  fetchUsers()
}

onMounted(() => {
  if (!isAdmin.value) {
    toast.error('Access Denied', {
      description: 'You do not have permission to access this page.'
    })
    router.push('/dashboard')
    return
  }
  fetchUsers()
})

onBeforeUnmount(() => {
  if (debounceTimeout) clearTimeout(debounceTimeout)
  debounceTimeout = null
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-3xl font-bold tracking-tight">User Management</h2>
        <p class="text-muted-foreground">
          Manage system users, roles, and permissions.
        </p>
      </div>
      <Button @click="isAddDialogOpen = true" class="gap-2">
        <UserPlus class="h-4 w-4" />
        Add User
      </Button>
    </div>

    <!-- Stat Cards -->
    <UserStatsCards :stats="stats" />

    <!-- Users Table -->
    <UsersTable 
      :users="users"
      :loading="loading"
      v-model:search-query="searchQuery"
      v-model:filter-role="filterRole"
      v-model:filter-status="filterStatus"
      :current-page="currentPage"
      :total-pages="totalPages"
      :total-users="totalUsers"
      @page-change="changePage"
      @edit="openEditDialog"

      @deactivate="handleDeactivate"
      @activate="handleActivate"
      @delete-hard="handleHardDelete"
    />

    <!-- Add User Dialog -->
    <AddUserDialog 
      v-model:open="isAddDialogOpen"
      @created="handleUserCreated"
    />

    <!-- Edit User Dialog -->
    <EditUserDialog 
      v-model:open="isEditDialogOpen"
      :user="selectedUser"
      @updated="handleUserUpdated"
    />

    <!-- Confirmation Dialog (Deactivate) -->
    <ConfirmDialog
      v-model:open="isConfirmDialogOpen"
      title="Deactivate User"
      :description="`Are you sure you want to deactivate ${userToDeactivate?.name || 'this user'}? They will no longer be able to log in.`"
      confirm-text="Deactivate"
      variant="destructive"
      :loading="isDeactivating"
      @confirm="confirmDeactivate"
    />

    <!-- Confirmation Dialog (Delete) -->
    <ConfirmDialog
      v-model:open="isDeleteDialogOpen"
      title="Permanently Delete User"
      :description="`Are you sure you want to PERMANENTLY delete ${userToDelete?.name || 'this user'}? This action CANNOT be undone and will remove all associated data.`"
      confirm-text="Delete Permanently"
      variant="destructive"
      :loading="isDeleting"
      @confirm="confirmHardDelete"
    />
  </div>
</template>
