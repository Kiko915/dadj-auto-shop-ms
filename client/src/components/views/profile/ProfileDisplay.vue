<script setup>
import { computed } from 'vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import UserAvatar from '@/components/views/UserAvatar.vue'
import {
  Mail,
  Shield,
  Calendar,
  Edit,
  CheckCircle,
  MapPin,
  Camera,
} from 'lucide-vue-next'

const props = defineProps({
  user: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['edit', 'change-avatar'])

// Format role for display
const displayRole = computed(() => {
  const role = props.user.role || 'user'
  return role.charAt(0).toUpperCase() + role.slice(1)
})

// Format joined date
const joinedDate = computed(() => {
  const date = props.user.createdAt ? new Date(props.user.createdAt) : new Date()
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
})

const handleEdit = () => {
  emit('edit')
}

const handleChangeAvatar = () => {
  emit('change-avatar')
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Profile Information</CardTitle>
      <CardDescription>
        Your personal information and account details
      </CardDescription>
    </CardHeader>
    <CardContent class="space-y-6">
      <!-- Avatar Section -->
      <div class="flex items-center gap-6">
        <div 
          class="relative group cursor-pointer"
          @click="handleChangeAvatar"
          role="button"
          tabindex="0"
          @keydown.enter="handleChangeAvatar"
          @keydown.space.prevent="handleChangeAvatar"
        >
          <UserAvatar 
            :email="user.email" 
            :profile-picture="user.profilePicture"
            size="lg"
            class="h-20 w-20"
          />
          <!-- Hover Overlay -->
          <div class="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera class="h-8 w-8 text-white" />
          </div>
        </div>
        <div class="space-y-1">
          <h3 class="text-lg font-semibold">
            {{ user.name || user.email?.split('@')[0] }}
          </h3>
          <p class="text-sm text-muted-foreground">
            {{ user.email }}
          </p>
          <Badge variant="outline" class="bg-primary/10 text-primary border-primary/20">
            {{ displayRole }}
          </Badge>
        </div>
      </div>

      <Separator />

      <!-- User Details -->
      <div class="grid gap-6 sm:grid-cols-2">
        <div class="space-y-2">
          <div class="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Mail class="h-4 w-4" />
            Email Address
          </div>
          <p class="text-sm font-medium">{{ user.email }}</p>
        </div>

        <div class="space-y-2">
          <div class="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Shield class="h-4 w-4" />
            Role
          </div>
          <p class="text-sm font-medium">{{ displayRole }}</p>
        </div>

        <div class="space-y-2">
          <div class="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Calendar class="h-4 w-4" />
            Member Since
          </div>
          <p class="text-sm font-medium">{{ joinedDate }}</p>
        </div>

        <div class="space-y-2">
          <div class="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <CheckCircle class="h-4 w-4" />
            Account Status
          </div>
          <Badge variant="outline" class="bg-green-50 text-green-700 border-green-200">
            <div class="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></div>
            Active
          </Badge>
        </div>
      </div>

      <Separator />

      <!-- Address Section -->
      <div>
        <div class="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-4">
          <MapPin class="h-4 w-4" />
          Address
        </div>
        
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-1">
            <p class="text-xs font-medium text-muted-foreground">Region</p>
            <p class="text-sm font-medium">
              {{ user.region || 'Not provided' }}
            </p>
          </div>

          <div class="space-y-1">
            <p class="text-xs font-medium text-muted-foreground">Province</p>
            <p class="text-sm font-medium">
              {{ user.province || 'Not provided' }}
            </p>
          </div>

          <div class="space-y-1">
            <p class="text-xs font-medium text-muted-foreground">City/Municipality</p>
            <p class="text-sm font-medium">
              {{ user.city || 'Not provided' }}
            </p>
          </div>

          <div class="space-y-1">
            <p class="text-xs font-medium text-muted-foreground">Barangay</p>
            <p class="text-sm font-medium">
              {{ user.barangay || 'Not provided' }}
            </p>
          </div>

          <div class="space-y-1 sm:col-span-2">
            <p class="text-xs font-medium text-muted-foreground">Street Address</p>
            <p class="text-sm font-medium">
              {{ user.street || 'Not provided' }}
            </p>
          </div>
        </div>
      </div>

      <Separator />

      <!-- Actions -->
      <div class="flex justify-end">
        <Button @click="handleEdit" class="gap-2">
          <Edit class="h-4 w-4" />
          Edit Profile
        </Button>
      </div>
    </CardContent>
  </Card>
</template>
