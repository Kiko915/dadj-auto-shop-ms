<script setup>
import {
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  UserX,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Mail,
  Calendar
} from 'lucide-vue-next'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const props = defineProps({
  users: { type: Array, required: true },
  loading: { type: Boolean, default: false },
  searchQuery: { type: String, default: '' },
  filterRole: { type: String, default: 'All' },
  filterStatus: { type: String, default: 'All' },
  currentPage: { type: Number, default: 1 },
  totalPages: { type: Number, default: 1 },
  totalUsers: { type: Number, default: 0 }
})

const emit = defineEmits([
  'update:searchQuery',
  'update:filterRole',
  'update:filterStatus',
  'page-change',
  'edit',
  'deactivate',
  'activate'
])

const roleOptions = ['All', 'admin', 'staff', 'mechanic']
const statusOptions = ['All', 'active', 'inactive']

const getRoleBadgeClass = (role) => {
  switch (role) {
    case 'admin':
      return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'staff':
      return 'bg-indigo-100 text-indigo-800 border-indigo-200'
    case 'mechanic':
      return 'bg-green-100 text-green-800 border-green-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

const getStatusBadgeClass = (isActive) => {
  return isActive 
    ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
    : 'bg-red-100 text-red-800 border-red-200'
}

const getInitials = (name) => {
  if (!name) return '?'
  const names = name.trim().split(' ')
  if (names.length >= 2) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
  }
  return names[0]?.[0]?.toUpperCase() || '?'
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>All Users</CardTitle>
      <CardDescription>
        A list of all system users including their role and status.
      </CardDescription>
      <div class="flex items-center py-4">
        <div class="relative w-full max-w-sm">
          <Search class="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            :model-value="searchQuery"
            @update:model-value="$emit('update:searchQuery', $event)"
            class="pl-8"
          />
        </div>
        <div class="ml-auto flex items-center gap-2">
          <!-- Role Filter -->
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="outline" size="sm" class="h-8 border-dashed">
                <Filter class="mr-2 h-4 w-4" />
                Role
                <span v-if="filterRole !== 'All'" class="ml-2 rounded-sm bg-primary px-1 font-normal text-primary-foreground capitalize">
                  {{ filterRole }}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" class="w-[150px]">
              <DropdownMenuLabel>Filter by Role</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                v-for="role in roleOptions"
                :key="role"
                :checked="filterRole === role"
                @click="$emit('update:filterRole', role)"
                class="capitalize"
              >
                {{ role }}
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <!-- Status Filter -->
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="outline" size="sm" class="h-8 border-dashed">
                <Filter class="mr-2 h-4 w-4" />
                Status
                <span v-if="filterStatus !== 'All'" class="ml-2 rounded-sm bg-primary px-1 font-normal text-primary-foreground capitalize">
                  {{ filterStatus }}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" class="w-[150px]">
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                v-for="status in statusOptions"
                :key="status"
                :checked="filterStatus === status"
                @click="$emit('update:filterStatus', status)"
                class="capitalize"
              >
                {{ status }}
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead class="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="loading">
            <TableCell colspan="6" class="h-24 text-center">
              Loading users...
            </TableCell>
          </TableRow>
          <TableRow v-else-if="users.length === 0">
            <TableCell colspan="6" class="h-64 text-center">
              <div class="flex flex-col items-center justify-center space-y-3">
                <div class="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <Search class="h-6 w-6 text-muted-foreground" />
                </div>
                <div class="space-y-1">
                  <h3 class="font-semibold text-lg">No users found</h3>
                  <p class="text-sm text-muted-foreground max-w-xs mx-auto">
                    We couldn't find any users matching your search filters.
                  </p>
                </div>
                <Button 
                  v-if="searchQuery || filterRole !== 'All' || filterStatus !== 'All'"
                  variant="link" 
                  @click="$emit('update:searchQuery', ''); $emit('update:filterRole', 'All'); $emit('update:filterStatus', 'All')"
                  class="text-primary mt-2"
                >
                  Clear all filters
                </Button>
              </div>
            </TableCell>
          </TableRow>
          <TableRow v-for="user in users" :key="user.id">
            <TableCell class="font-medium">
              <div class="flex items-center gap-3">
                <Avatar class="h-10 w-10 border border-border">
                  <AvatarImage v-if="user.profilePicture" :src="user.profilePicture" :alt="user.name" />
                  <AvatarFallback class="text-sm font-medium">{{ getInitials(user.name) }}</AvatarFallback>
                </Avatar>
                <span class="font-medium">{{ user.name || 'No Name' }}</span>
              </div>
            </TableCell>
            <TableCell>
              <div class="flex items-center gap-2">
                <Mail class="h-4 w-4 text-muted-foreground" />
                {{ user.email }}
              </div>
            </TableCell>
            <TableCell>
              <Badge :class="['border capitalize', getRoleBadgeClass(user.role)]">
                {{ user.role }}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge :class="['border', getStatusBadgeClass(user.isActive)]">
                {{ user.isActive ? 'Active' : 'Inactive' }}
              </Badge>
            </TableCell>
            <TableCell>
              <div class="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar class="h-4 w-4" />
                {{ formatDate(user.createdAt) }}
              </div>
            </TableCell>
            <TableCell class="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button variant="ghost" class="h-8 w-8 p-0">
                    <span class="sr-only">Open menu</span>
                    <MoreHorizontal class="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem @click="$emit('edit', user)">
                    <Edit class="mr-2 h-4 w-4" /> Edit User
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    v-if="user.isActive"
                    @click="$emit('deactivate', user)"
                    class="text-destructive focus:text-destructive"
                    :disabled="user.email === authStore.userEmail"
                  >
                    <UserX class="mr-2 h-4 w-4" /> Deactivate
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    v-else
                    @click="$emit('activate', user)"
                    class="text-green-600 focus:text-green-600"
                  >
                    <UserCheck class="mr-2 h-4 w-4" /> Activate
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <!-- Pagination Footer -->
      <div class="flex items-center justify-between space-x-2 py-4 border-t mt-4">
        <div class="text-sm text-muted-foreground">
          Page {{ currentPage }} of {{ totalPages }} ({{ totalUsers }} users)
        </div>
        <div class="space-x-2">
          <Button
            variant="outline"
            size="sm"
            :disabled="currentPage === 1 || loading"
            @click="$emit('page-change', currentPage - 1)"
          >
            <ChevronLeft class="h-4 w-4 mr-2" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            :disabled="currentPage === totalPages || loading"
            @click="$emit('page-change', currentPage + 1)"
          >
            Next
            <ChevronRight class="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
