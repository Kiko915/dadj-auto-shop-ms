<script setup>
import { ref } from 'vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Download,
  CheckCircle,
  FileText,
} from 'lucide-vue-next'

// Data export state
const exportLoading = ref(false)

// Actions
const handleExportData = async () => {
  exportLoading.value = true
  // To be implemented
  setTimeout(() => {
    exportLoading.value = false
    console.log('Data export initiated')
  }, 2000)
}
</script>

<template>
  <div class="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle>Export Your Data</CardTitle>
        <CardDescription>
          Download a copy of your personal data and account information
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-6">
        <Alert>
          <FileText class="h-4 w-4" />
          <AlertDescription>
            Your data export will include your profile information, account activity, and preferences. The export will be provided in JSON format.
          </AlertDescription>
        </Alert>

        <div class="space-y-4">
          <div class="flex items-start gap-3">
            <CheckCircle class="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p class="font-medium">Profile Information</p>
              <p class="text-sm text-muted-foreground">Your name, email, role, and account settings</p>
            </div>
          </div>

          <div class="flex items-start gap-3">
            <CheckCircle class="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p class="font-medium">Account Activity</p>
              <p class="text-sm text-muted-foreground">Login history and session information</p>
            </div>
          </div>

          <div class="flex items-start gap-3">
            <CheckCircle class="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p class="font-medium">User Preferences</p>
              <p class="text-sm text-muted-foreground">Your settings and customizations</p>
            </div>
          </div>
        </div>

        <Separator />

        <div class="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
          <div>
            <p class="text-sm font-medium">Ready to export?</p>
            <p class="text-sm text-muted-foreground">Your data will be prepared and downloaded as a JSON file</p>
          </div>
          <Button 
            @click="handleExportData" 
            :disabled="exportLoading"
            class="gap-2 w-full sm:w-auto"
          >
            <Download class="h-4 w-4" />
            {{ exportLoading ? 'Preparing Export...' : 'Export Data' }}
          </Button>
        </div>
      </CardContent>
    </Card>

    <!-- Privacy Notice -->
    <Card>
      <CardHeader>
        <CardTitle>Privacy Notice</CardTitle>
      </CardHeader>
      <CardContent>
        <p class="text-sm text-muted-foreground">
          We respect your privacy and are committed to protecting your personal data. Your exported data will only be accessible to you and will not be shared with any third parties. The export process is secure and complies with data protection regulations.
        </p>
      </CardContent>
    </Card>
  </div>
</template>
