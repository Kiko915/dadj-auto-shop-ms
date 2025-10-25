<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { useAuthStore } from '@/stores/auth'
import { deleteAccount } from '@/api/profile'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Trash2,
  AlertTriangle,
  Copy,
  CheckCircle,
} from 'lucide-vue-next'

// Router and stores
const router = useRouter()
const authStore = useAuthStore()

// User role checking
const isAdmin = computed(() => authStore.userRole === 'admin')

// Delete account state
const password = ref('')
const confirmationWord = ref('')
const providedWord = ref('')
const showDeleteWarning = ref(false)
const isDeleting = ref(false)
const wordCopied = ref(false)

// Generate random confirmation word
const generateConfirmationWord = () => {
  const words = [
    'sunset', 'ocean', 'mountain', 'forest', 'river', 'desert',
    'galaxy', 'thunder', 'crystal', 'phoenix', 'dragon', 'falcon',
    'cosmos', 'nebula', 'meteor', 'comet', 'planet', 'stellar'
  ]
  return words[Math.floor(Math.random() * words.length)]
}

// Initialize confirmation word on mount
onMounted(() => {
  confirmationWord.value = generateConfirmationWord()
})

// Form validation
const isFormValid = computed(() => {
  return password.value.trim() !== '' && 
         providedWord.value.trim() !== '' &&
         providedWord.value.toLowerCase() === confirmationWord.value.toLowerCase()
})

// Actions  
const handleDeleteAccount = async () => {
  if (!isFormValid.value) {
    toast.error('Please fill in all required fields correctly')
    return
  }

  isDeleting.value = true

  try {
    const response = await deleteAccount({
      password: password.value,
      confirmationWord: confirmationWord.value,
      providedWord: providedWord.value
    })

    // Only proceed with logout if deletion was successful
    if (response) {
      toast.success('Account deleted successfully')
      
      // Clear authentication and redirect to login
      await authStore.logout()
      
      setTimeout(() => {
        router.push('/auth/login')
      }, 1500)
    }
  } catch (error) {
    console.error('Delete account error:', error)
    
    if (error.response?.data?.error === 'ADMIN_DELETE_RESTRICTED') {
      toast.error('Admins cannot delete their own accounts. Please contact developers.', {
        duration: 5000
      })
    } else if (error.response?.data?.error === 'INVALID_PASSWORD') {
      toast.error('Current password is incorrect')
    } else if (error.response?.data?.error === 'INVALID_CONFIRMATION') {
      toast.error('Confirmation word does not match')
    } else {
      toast.error(error.response?.data?.message || 'Failed to delete account')
    }
  } finally {
    isDeleting.value = false
  }
}

const resetForm = () => {
  showDeleteWarning.value = false
  password.value = ''
  providedWord.value = ''
  confirmationWord.value = generateConfirmationWord()
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
        <!-- Admin Warning -->
        <Alert v-if="isAdmin" variant="destructive">
          <AlertTriangle class="h-4 w-4" />
          <AlertDescription>
            <strong>Administrator Account:</strong> Admins cannot delete their own accounts for security reasons. Please contact the development team if you need to delete your account.
          </AlertDescription>
        </Alert>

        <!-- General Warning -->
        <Alert v-else variant="destructive">
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
              <span>All active sessions will be terminated</span>
            </li>
          </ul>
        </div>

        <Separator />

        <!-- Admin Restriction Message -->
        <div v-if="isAdmin" class="p-4 bg-muted rounded-lg border border-border">
          <div class="flex items-start gap-3">
            <AlertTriangle class="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
            <div class="space-y-1">
              <p class="text-sm font-medium">Account Deletion Restricted</p>
              <p class="text-sm text-muted-foreground">
                Administrator accounts cannot be deleted for security and system integrity purposes. 
                If you need to delete your admin account, please contact the development team at 
                <a href="mailto:synera.swe@gmail.com" class="text-primary hover:underline">synera.swe@gmail.com</a>
              </p>
            </div>
          </div>
        </div>

        <!-- Initial Delete Button (Non-Admin Only) -->
        <div v-else-if="!showDeleteWarning" class="flex justify-start">
          <Button 
            @click="showDeleteWarning = true" 
            variant="outline" 
            class="text-destructive border-destructive hover:bg-destructive hover:text-white gap-2"
          >
            <Trash2 class="h-4 w-4" />
            I want to delete my account
          </Button>
        </div>

        <!-- Delete Confirmation Form -->
        <div v-else class="space-y-6">
          <Alert variant="destructive">
            <AlertTriangle class="h-4 w-4" />
            <AlertDescription>
              To proceed with account deletion, you must verify your identity by providing your current password and typing the randomly generated confirmation word.
            </AlertDescription>
          </Alert>

          <!-- Password Input -->
          <div class="space-y-2">
            <Label for="password">Current Password <span class="text-destructive">*</span></Label>
            <Input
              id="password"
              v-model="password"
              type="password"
              placeholder="Enter your current password"
              class="border-destructive focus-visible:ring-destructive"
              :disabled="isDeleting"
            />
          </div>

          <!-- Confirmation Word Display -->
          <div class="space-y-2">
            <Label>Confirmation Word</Label>
            <div class="flex gap-2">
              <div class="flex-1 p-3 bg-muted rounded-md font-mono text-lg font-semibold text-center border-2 border-destructive select-none" inert="true">
                {{ confirmationWord }}
              </div>
            </div>
            <p class="text-xs text-muted-foreground">
              Copy this word and type it in the field below to confirm deletion
            </p>
          </div>

          <!-- Confirmation Word Input -->
          <div class="space-y-2">
            <Label for="provided-word">Type the confirmation word <span class="text-destructive">*</span></Label>
            <Input
              id="provided-word"
              v-model="providedWord"
              type="text"
              placeholder="Type the confirmation word"
              class="border-destructive focus-visible:ring-destructive"
              :disabled="isDeleting"
            />
            <p v-if="providedWord && providedWord.toLowerCase() !== confirmationWord.toLowerCase()" 
               class="text-xs text-destructive">
              Confirmation word does not match
            </p>
            <p v-else-if="providedWord && providedWord.toLowerCase() === confirmationWord.toLowerCase()" 
               class="text-xs text-green-600">
              Confirmation word matches
            </p>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-3">
            <Button 
              @click="resetForm" 
              variant="outline"
              class="flex-1"
              :disabled="isDeleting"
            >
              Cancel
            </Button>
            <Button 
              @click="handleDeleteAccount"
              :disabled="!isFormValid || isDeleting"
              variant="destructive"
              class="flex-1 gap-2"
            >
              <Trash2 v-if="!isDeleting" class="h-4 w-4" />
              <span v-if="isDeleting">Deleting...</span>
              <span v-else>Delete Account Permanently</span>
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
