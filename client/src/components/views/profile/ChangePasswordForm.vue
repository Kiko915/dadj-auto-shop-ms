<script setup>
import { ref, computed } from 'vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Lock,
  AlertTriangle,
  Key,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import api from '@/api'

// Form state
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const isLoading = ref(false)

// Password visibility toggles
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

// Password strength calculation
const passwordStrength = computed(() => {
  const password = newPassword.value
  if (!password) return { score: 0, label: '', checks: {} }

  let score = 0
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  }

  // Calculate score
  if (checks.length) score += 20
  if (checks.lowercase) score += 20
  if (checks.uppercase) score += 20
  if (checks.number) score += 20
  if (checks.special) score += 20

  // Additional points for longer passwords
  if (password.length >= 12) score += 10
  if (password.length >= 16) score += 10

  // Cap at 100
  score = Math.min(score, 100)

  // Determine strength label
  let label
  if (score < 40) {
    label = 'Weak'
  } else if (score < 70) {
    label = 'Fair'
  } else if (score < 90) {
    label = 'Good'
  } else {
    label = 'Strong'
  }

  return { score, label, checks }
})

// Validation computed properties
const passwordsMatch = computed(() => {
  if (!confirmPassword.value) return null
  return newPassword.value === confirmPassword.value
})

const canSubmit = computed(() => {
  return currentPassword.value &&
         newPassword.value &&
         confirmPassword.value &&
         passwordsMatch.value &&
         passwordStrength.value.score >= 40
})

// Submit handler
const handleChangePassword = async () => {
  if (!canSubmit.value) {
    toast.error('Validation Failed', {
      description: 'Please check all fields and try again.'
    })
    return
  }

  try {
    isLoading.value = true

    await api.patch('/user/password', {
      currentPassword: currentPassword.value,
      newPassword: newPassword.value
    })

    toast.success('Password Updated', {
      description: 'Your password has been changed successfully.'
    })

    // Clear form
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''

  } catch (error) {
    console.error('Password change error:', error)
    
    const errorMessage = error.response?.data?.message || 'Failed to update password'
    toast.error('Update Failed', {
      description: errorMessage
    })
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Change Password</CardTitle>
      <CardDescription>
        Update your password to keep your account secure
      </CardDescription>
    </CardHeader>
    <CardContent class="space-y-4">
      <!-- Current Password -->
      <div class="space-y-2">
        <Label for="current-password">Current Password</Label>
        <div class="relative">
          <Lock class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="current-password"
            v-model="currentPassword"
            :type="showCurrentPassword ? 'text' : 'password'"
            placeholder="Enter current password"
            class="pl-10 pr-10"
          />
          <button
            type="button"
            @click="showCurrentPassword = !showCurrentPassword"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Eye v-if="!showCurrentPassword" class="h-4 w-4" />
            <EyeOff v-else class="h-4 w-4" />
          </button>
        </div>
      </div>

      <!-- New Password -->
      <div class="space-y-2">
        <Label for="new-password">New Password</Label>
        <div class="relative">
          <Key class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="new-password"
            v-model="newPassword"
            :type="showNewPassword ? 'text' : 'password'"
            placeholder="Enter new password"
            class="pl-10 pr-10"
          />
          <button
            type="button"
            @click="showNewPassword = !showNewPassword"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Eye v-if="!showNewPassword" class="h-4 w-4" />
            <EyeOff v-else class="h-4 w-4" />
          </button>
        </div>
        
        <!-- Password Strength Indicator -->
        <div v-if="newPassword" class="space-y-2">
          <div class="flex items-center justify-between text-sm">
            <span class="text-muted-foreground">Password Strength:</span>
            <span 
              class="font-medium"
              :class="{
                'text-red-600': passwordStrength.score < 40,
                'text-yellow-600': passwordStrength.score >= 40 && passwordStrength.score < 70,
                'text-blue-600': passwordStrength.score >= 70 && passwordStrength.score < 90,
                'text-green-600': passwordStrength.score >= 90
              }"
            >
              {{ passwordStrength.label }}
            </span>
          </div>
          
          <!-- Password Requirements Checklist -->
          <div class="space-y-1 text-xs">
            <div class="flex items-center gap-2" :class="passwordStrength.checks.length ? 'text-green-600' : 'text-muted-foreground'">
              <CheckCircle2 v-if="passwordStrength.checks.length" class="h-3 w-3" />
              <XCircle v-else class="h-3 w-3" />
              <span>At least 8 characters</span>
            </div>
            <div class="flex items-center gap-2" :class="passwordStrength.checks.lowercase ? 'text-green-600' : 'text-muted-foreground'">
              <CheckCircle2 v-if="passwordStrength.checks.lowercase" class="h-3 w-3" />
              <XCircle v-else class="h-3 w-3" />
              <span>Contains lowercase letter</span>
            </div>
            <div class="flex items-center gap-2" :class="passwordStrength.checks.uppercase ? 'text-green-600' : 'text-muted-foreground'">
              <CheckCircle2 v-if="passwordStrength.checks.uppercase" class="h-3 w-3" />
              <XCircle v-else class="h-3 w-3" />
              <span>Contains uppercase letter</span>
            </div>
            <div class="flex items-center gap-2" :class="passwordStrength.checks.number ? 'text-green-600' : 'text-muted-foreground'">
              <CheckCircle2 v-if="passwordStrength.checks.number" class="h-3 w-3" />
              <XCircle v-else class="h-3 w-3" />
              <span>Contains number</span>
            </div>
            <div class="flex items-center gap-2" :class="passwordStrength.checks.special ? 'text-green-600' : 'text-muted-foreground'">
              <CheckCircle2 v-if="passwordStrength.checks.special" class="h-3 w-3" />
              <XCircle v-else class="h-3 w-3" />
              <span>Contains special character</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Confirm Password -->
      <div class="space-y-2">
        <Label for="confirm-password">Confirm New Password</Label>
        <div class="relative">
          <Key class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="confirm-password"
            v-model="confirmPassword"
            :type="showConfirmPassword ? 'text' : 'password'"
            placeholder="Confirm new password"
            class="pl-10 pr-10"
            :class="{
              'border-red-500': passwordsMatch === false,
              'border-green-500': passwordsMatch === true
            }"
          />
          <button
            type="button"
            @click="showConfirmPassword = !showConfirmPassword"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Eye v-if="!showConfirmPassword" class="h-4 w-4" />
            <EyeOff v-else class="h-4 w-4" />
          </button>
        </div>
        <p v-if="passwordsMatch === false" class="text-xs text-red-600 flex items-center gap-1">
          <XCircle class="h-3 w-3" />
          Passwords do not match
        </p>
        <p v-if="passwordsMatch === true" class="text-xs text-green-600 flex items-center gap-1">
          <CheckCircle2 class="h-3 w-3" />
          Passwords match
        </p>
      </div>

      <!-- Alert -->
      <Alert>
        <AlertTriangle class="h-4 w-4" />
        <AlertDescription>
          Make sure your password is at least 8 characters long and includes a mix of letters, numbers, and symbols.
        </AlertDescription>
      </Alert>

      <!-- Submit Button -->
      <div class="flex justify-end">
        <Button 
          @click="handleChangePassword" 
          :disabled="!canSubmit || isLoading"
          class="gap-2"
        >
          <Lock class="h-4 w-4" />
          {{ isLoading ? 'Updating...' : 'Update Password' }}
        </Button>
      </div>
    </CardContent>
  </Card>
</template>
