<script setup>
import { ref } from 'vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Lock,
  AlertTriangle,
  Key,
  Shield,
  Smartphone,
} from 'lucide-vue-next'

// Security tab state
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const twoFactorEnabled = ref(false)

// Actions
const handleChangePassword = () => {
  // To be implemented
  console.log('Change password:', { 
    currentPassword: currentPassword.value, 
    newPassword: newPassword.value 
  })
}

const handleToggle2FA = () => {
  twoFactorEnabled.value = !twoFactorEnabled.value
  // To be implemented
  console.log('2FA toggled:', twoFactorEnabled.value)
}
</script>

<template>
  <div class="space-y-6">
    <!-- Change Password Card -->
    <Card>
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
        <CardDescription>
          Update your password to keep your account secure
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="space-y-2">
          <Label for="current-password">Current Password</Label>
          <div class="relative">
            <Lock class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="current-password"
              v-model="currentPassword"
              type="password"
              placeholder="Enter current password"
              class="pl-10"
            />
          </div>
        </div>

        <div class="space-y-2">
          <Label for="new-password">New Password</Label>
          <div class="relative">
            <Key class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="new-password"
              v-model="newPassword"
              type="password"
              placeholder="Enter new password"
              class="pl-10"
            />
          </div>
        </div>

        <div class="space-y-2">
          <Label for="confirm-password">Confirm New Password</Label>
          <div class="relative">
            <Key class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="confirm-password"
              v-model="confirmPassword"
              type="password"
              placeholder="Confirm new password"
              class="pl-10"
            />
          </div>
        </div>

        <Alert>
          <AlertTriangle class="h-4 w-4" />
          <AlertDescription>
            Make sure your password is at least 8 characters long and includes a mix of letters, numbers, and symbols.
          </AlertDescription>
        </Alert>

        <div class="flex justify-end">
          <Button @click="handleChangePassword" class="gap-2">
            <Lock class="h-4 w-4" />
            Update Password
          </Button>
        </div>
      </CardContent>
    </Card>

    <!-- Two-Factor Authentication Card -->
    <Card>
      <CardHeader>
        <CardTitle>Two-Factor Authentication</CardTitle>
        <CardDescription>
          Add an extra layer of security to your account
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="rounded-full bg-primary/10 p-2">
              <Smartphone class="h-5 w-5 text-primary" />
            </div>
            <div>
              <p class="font-medium">Authenticator App</p>
              <p class="text-sm text-muted-foreground">
                Use an authenticator app to generate verification codes
              </p>
            </div>
          </div>
          <Badge 
            :variant="twoFactorEnabled ? 'default' : 'outline'"
            :class="twoFactorEnabled ? 'bg-green-600' : ''"
          >
            {{ twoFactorEnabled ? 'Enabled' : 'Disabled' }}
          </Badge>
        </div>

        <Separator />

        <div class="flex justify-end">
          <Button 
            @click="handleToggle2FA" 
            :variant="twoFactorEnabled ? 'outline' : 'default'"
            class="gap-2"
          >
            <Shield class="h-4 w-4" />
            {{ twoFactorEnabled ? 'Disable' : 'Enable' }} 2FA
          </Button>
        </div>
      </CardContent>
    </Card>

    <!-- Active Sessions Card -->
    <Card>
      <CardHeader>
        <CardTitle>Active Sessions</CardTitle>
        <CardDescription>
          Manage your active sessions across devices
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div class="space-y-3">
          <div class="flex items-center justify-between p-3 rounded-lg border">
            <div class="space-y-1">
              <p class="font-medium">Current Session</p>
              <p class="text-sm text-muted-foreground">Windows • Chrome • Philippines</p>
              <p class="text-xs text-muted-foreground">Last active: Just now</p>
            </div>
            <Badge variant="outline" class="bg-green-50 text-green-700 border-green-200">
              Active
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
