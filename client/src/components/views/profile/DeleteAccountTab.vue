<script setup>
import { ref } from 'vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Trash2,
  AlertTriangle,
} from 'lucide-vue-next'

// Delete account state
const deleteConfirmation = ref('')
const showDeleteWarning = ref(false)

// Actions
const handleDeleteAccount = () => {
  if (deleteConfirmation.value === 'DELETE') {
    // To be implemented
    console.log('Account deletion initiated')
  }
}
</script>

<template>
  <div class="space-y-6">
    <Card class="border-destructive">
      <CardHeader>
        <CardTitle class="text-destructive">Delete Account</CardTitle>
        <CardDescription>
          Permanently delete your account and all associated data
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-6">
        <Alert variant="destructive">
          <AlertTriangle class="h-4 w-4" />
          <AlertDescription>
            <strong>Warning:</strong> This action cannot be undone. This will permanently delete your account and remove your data from our servers.
          </AlertDescription>
        </Alert>

        <div class="space-y-3">
          <p class="text-sm font-medium">Before you go, please note:</p>
          <ul class="space-y-2 text-sm text-muted-foreground">
            <li class="flex items-start gap-2">
              <span class="text-destructive mt-0.5">•</span>
              <span>All your personal information will be permanently deleted</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-destructive mt-0.5">•</span>
              <span>You will lose access to all services and features</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-destructive mt-0.5">•</span>
              <span>Your account cannot be recovered after deletion</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-destructive mt-0.5">•</span>
              <span>Any active subscriptions or services will be cancelled</span>
            </li>
          </ul>
        </div>

        <Separator />

        <div v-if="!showDeleteWarning" class="flex justify-start">
          <Button 
            @click="showDeleteWarning = true" 
            variant="outline" 
            class="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground gap-2"
          >
            <Trash2 class="h-4 w-4" />
            I want to delete my account
          </Button>
        </div>

        <div v-else class="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle class="h-4 w-4" />
            <AlertDescription>
              Please type <strong>DELETE</strong> to confirm account deletion
            </AlertDescription>
          </Alert>

          <div class="space-y-2">
            <Label for="delete-confirmation">Confirmation</Label>
            <Input
              id="delete-confirmation"
              v-model="deleteConfirmation"
              placeholder="Type DELETE to confirm"
              class="border-destructive focus-visible:ring-destructive"
            />
          </div>

          <div class="flex gap-3">
            <Button 
              @click="showDeleteWarning = false; deleteConfirmation = ''" 
              variant="outline"
              class="flex-1"
            >
              Cancel
            </Button>
            <Button 
              @click="handleDeleteAccount"
              :disabled="deleteConfirmation !== 'DELETE'"
              variant="destructive"
              class="flex-1 gap-2"
            >
              <Trash2 class="h-4 w-4" />
              Delete Account
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Support Card -->
    <Card>
      <CardHeader>
        <CardTitle>Need Help?</CardTitle>
      </CardHeader>
      <CardContent>
        <p class="text-sm text-muted-foreground">
          If you're experiencing issues with your account or have questions before deleting, please contact our support team. We're here to help and might be able to resolve your concerns.
        </p>
      </CardContent>
    </Card>
  </div>
</template>
