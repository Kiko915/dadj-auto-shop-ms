<script setup>
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Download,
  CheckCircle,
  FileText,
  FileJson,
  FileType,
} from 'lucide-vue-next'
import { useDataExport } from '@/composables/useDataExport'

// Use data export composable
const { exportLoading, exportFormat, handleExportData } = useDataExport()
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
            Your data export will include your profile information, address, active sessions, and account metadata. Choose your preferred export format below.
          </AlertDescription>
        </Alert>

        <div class="space-y-4">
          <div class="flex items-start gap-3">
            <CheckCircle class="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p class="font-medium">Profile Information</p>
              <p class="text-sm text-muted-foreground">Your name, email, role, and profile picture</p>
            </div>
          </div>

          <div class="flex items-start gap-3">
            <CheckCircle class="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p class="font-medium">Address Details</p>
              <p class="text-sm text-muted-foreground">Complete address information including region, province, city, and barangay</p>
            </div>
          </div>

          <div class="flex items-start gap-3">
            <CheckCircle class="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p class="font-medium">Active Sessions</p>
              <p class="text-sm text-muted-foreground">All currently active login sessions with device and location details</p>
            </div>
          </div>

          <div class="flex items-start gap-3">
            <CheckCircle class="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p class="font-medium">Account Metadata</p>
              <p class="text-sm text-muted-foreground">Account creation date, last update time, and session statistics</p>
            </div>
          </div>
        </div>

        <Separator />

        <!-- Format Selection -->
        <div class="space-y-3">
          <Label class="text-base font-medium">Export Format</Label>
          <RadioGroup v-model="exportFormat" class="gap-4">
            <div class="flex items-center space-x-3 space-y-0">
              <RadioGroupItem value="json" id="json" />
              <Label for="json" class="flex items-center gap-2 font-normal cursor-pointer">
                <FileJson class="h-4 w-4" />
                <div>
                  <div class="font-medium">JSON Format</div>
                  <div class="text-sm text-muted-foreground">Machine-readable format, ideal for backups and data portability</div>
                </div>
              </Label>
            </div>
            <div class="flex items-center space-x-3 space-y-0">
              <RadioGroupItem value="pdf" id="pdf" />
              <Label for="pdf" class="flex items-center gap-2 font-normal cursor-pointer">
                <FileType class="h-4 w-4" />
                <div>
                  <div class="font-medium">PDF Format</div>
                  <div class="text-sm text-muted-foreground">Human-readable document with business logo and professional formatting</div>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>

        <Separator />

        <div class="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
          <div>
            <p class="text-sm font-medium">Ready to export?</p>
            <p class="text-sm text-muted-foreground">
              Your data will be downloaded as a {{ exportFormat.toUpperCase() }} file
            </p>
          </div>
          <Button 
            @click="handleExportData" 
            :disabled="exportLoading"
            class="gap-2 w-full sm:w-auto"
          >
            <Download class="h-4 w-4" />
            {{ exportLoading ? 'Preparing Export...' : `Export as ${exportFormat.toUpperCase()}` }}
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
