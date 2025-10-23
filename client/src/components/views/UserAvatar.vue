<script setup>
import { computed } from 'vue'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar'

const props = defineProps({
  email: {
    type: String,
    required: true
  },
  profilePicture: {
    type: String,
    default: null
  },
  size: {
    type: String,
    default: 'default', // 'sm', 'default', 'lg'
  }
})

// Generate avatar URL using DiceBear API
// Using 'initials' style - you can change to other styles like 'avataaars', 'lorelei', etc.
const avatarUrl = computed(() => {
  if (props.profilePicture) {
    return props.profilePicture
  }
  
  // Use DiceBear API with the email as seed for consistent avatars
  const seed = encodeURIComponent(props.email)
  return `https://api.dicebear.com/9.x/thumbs/svg?seed=${seed}`
})

// Get user initials as fallback
const userInitials = computed(() => {
  if (!props.email) return '?'
  
  const parts = props.email.split('@')[0].split(/[._-]/)
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase()
  }
  return props.email.charAt(0).toUpperCase()
})

// Compute size classes
const sizeClasses = computed(() => {
  const sizes = {
    sm: 'h-6 w-6',
    default: 'h-8 w-8',
    lg: 'h-10 w-10'
  }
  return sizes[props.size] || sizes.default
})
</script>

<template>
  <Avatar :class="sizeClasses">
    <AvatarImage 
      :src="avatarUrl" 
      :alt="`${email} avatar`" 
    />
    <AvatarFallback class="bg-primary text-primary-foreground">
      {{ userInitials }}
    </AvatarFallback>
  </Avatar>
</template>
