<script setup>
import { ref } from 'vue'
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
import { toast } from 'vue-sonner'
import { exportUserData } from '@/api/profile'
import jsPDF from 'jspdf'

// Data export state
const exportLoading = ref(false)
const exportFormat = ref('json')

// Actions
const handleExportData = async () => {
  exportLoading.value = true
  
  try {
    // Fetch user data from backend using profile API
    const userData = await exportUserData()

    if (exportFormat.value === 'json') {
      await exportAsJSON(userData)
    } else {
      await exportAsPDF(userData)
    }

    toast.success('Data exported successfully!')
  } catch (error) {
    console.error('Export error:', error)
    toast.error('Failed to export data. Please try again.')
  } finally {
    exportLoading.value = false
  }
}

const exportAsJSON = (data) => {
  // Create formatted JSON string
  const jsonString = JSON.stringify(data, null, 2)
  
  // Create Blob
  const blob = new Blob([jsonString], { type: 'application/json' })
  
  // Create download link
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `my-data-export-${new Date().toISOString().split('T')[0]}.json`
  
  // Trigger download
  document.body.appendChild(link)
  link.click()
  
  // Cleanup
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

const exportAsPDF = async (data) => {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  
  // Color scheme
  const primaryColor = [41, 98, 255] // #2962FF
  const secondaryColor = [100, 100, 100]
  const lightGray = [245, 245, 245]
  
  // Load and add logo
  const logo = new Image()
  logo.src = '/logo/symbol_w_wordmark_primary.png'
  
  await new Promise((resolve) => {
    logo.onload = resolve
  })
  
  // Header background
  doc.setFillColor(...lightGray)
  doc.rect(0, 0, pageWidth, 70, 'F')
  
  // Add logo (top left)
  const logoWidth = 45
  const logoHeight = 18
  doc.addImage(logo, 'PNG', 15, 15, logoWidth, logoHeight)
  
  // Add profile picture if available (top right)
  let yPos = 45
  if (data.profile.profilePicture) {
    try {
      const profileImg = new Image()
      profileImg.crossOrigin = 'anonymous'
      profileImg.src = data.profile.profilePicture
      
      await new Promise((resolve, reject) => {
        profileImg.onload = resolve
        profileImg.onerror = resolve // Continue even if image fails to load
      })
      
      // Draw circular profile picture
      const imgSize = 35
      const imgX = pageWidth - imgSize - 15
      const imgY = 15
      
      // Draw white circle background
      doc.setFillColor(255, 255, 255)
      doc.circle(imgX + imgSize/2, imgY + imgSize/2, imgSize/2, 'F')
      
      // Add profile image
      doc.addImage(profileImg, 'JPEG', imgX, imgY, imgSize, imgSize)
    } catch (error) {
      console.log('Could not load profile picture:', error)
    }
  }
  
  // Title
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...primaryColor)
  doc.text('Data Export Report', 15, yPos)
  yPos += 8
  
  // Subtitle with date
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...secondaryColor)
  doc.text(`Generated on ${new Date(data.metadata.exportDate).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}`, 15, yPos)
  
  yPos = 85
  
  // Helper function to draw section header
  const drawSectionHeader = (title, y) => {
    doc.setFillColor(...primaryColor)
    doc.rect(15, y - 6, pageWidth - 30, 8, 'F')
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(255, 255, 255)
    doc.text(title, 18, y)
    return y + 8
  }
  
  // Helper function to draw field
  const drawField = (label, value, y, bold = false) => {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text(label + ':', 20, y)
    
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setTextColor(...secondaryColor)
    const labelWidth = doc.getTextWidth(label + ': ')
    doc.text(value || 'N/A', 20 + labelWidth, y)
    return y + 6
  }
  
  // Helper function to check if new page is needed
  const checkNewPage = (currentY, requiredSpace = 20) => {
    if (currentY + requiredSpace > pageHeight - 20) {
      doc.addPage()
      return 20
    }
    return currentY
  }
  
  // Profile Information Section
  yPos = drawSectionHeader('Profile Information', yPos)
  yPos += 5
  
  yPos = drawField('Full Name', data.profile.name, yPos, true)
  yPos = drawField('Email Address', data.profile.email, yPos)
  yPos = drawField('User Role', data.profile.role, yPos)
  yPos = drawField('User ID', data.profile.id, yPos)
  
  yPos += 8
  yPos = checkNewPage(yPos, 50)
  
  // Address Information Section
  yPos = drawSectionHeader('Address Information', yPos)
  yPos += 5
  
  yPos = drawField('Country', data.address.country, yPos)
  yPos = drawField('Region', data.address.region, yPos)
  yPos = drawField('Province', data.address.province, yPos)
  yPos = drawField('City', data.address.city, yPos)
  yPos = drawField('Barangay', data.address.barangay, yPos)
  yPos = drawField('Street', data.address.street, yPos)
  
  yPos += 8
  yPos = checkNewPage(yPos, 50)
  
  // Active Sessions Section
  yPos = drawSectionHeader(`Active Sessions (${data.sessions.length})`, yPos)
  yPos += 5
  
  if (data.sessions.length === 0) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(...secondaryColor)
    doc.text('No active sessions found', 20, yPos)
    yPos += 10
  } else {
    data.sessions.forEach((session, index) => {
      yPos = checkNewPage(yPos, 45)
      
      // Session card background
      doc.setFillColor(250, 250, 250)
      doc.roundedRect(18, yPos - 4, pageWidth - 36, 35, 2, 2, 'F')
      
      // Session number
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...primaryColor)
      doc.text(`Session ${index + 1}`, 22, yPos)
      yPos += 6
      
      // Session details
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(0, 0, 0)
      
      const labelX = 22
      doc.text(`Device: ${session.device} • ${session.browser}`, labelX, yPos)
      yPos += 5
      
      doc.text(`IP Address: ${session.ipAddress}`, labelX, yPos)
      yPos += 5
      
      doc.text(`Location: ${session.location || 'Unknown location'}`, labelX, yPos)
      yPos += 5
      
      doc.setTextColor(...secondaryColor)
      doc.text(`Last active: ${new Date(session.lastActivity).toLocaleString()}`, labelX, yPos)
      
      yPos += 12
    })
  }
  
  yPos = checkNewPage(yPos, 40)
  
  // Account Metadata Section
  yPos = drawSectionHeader('Account Metadata', yPos)
  yPos += 5
  
  yPos = drawField('Account Created', new Date(data.metadata.accountCreated).toLocaleString(), yPos)
  yPos = drawField('Last Updated', new Date(data.metadata.lastUpdated).toLocaleString(), yPos)
  yPos = drawField('Total Active Sessions', data.metadata.totalActiveSessions.toString(), yPos)
  
  // Footer on all pages
  const pageCount = doc.internal.pages.length - 1
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    
    // Footer separator line
    doc.setDrawColor(200, 200, 200)
    doc.setLineWidth(0.5)
    doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15)
    
    // Footer text
    doc.setFontSize(8)
    doc.setTextColor(...secondaryColor)
    doc.setFont('helvetica', 'normal')
    
    // Left side - confidential notice
    doc.text('Confidential Document', 15, pageHeight - 10)
    
    // Center - page number
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    )
    
    // Right side - company name
    doc.text('DADJ Auto Shop', pageWidth - 15, pageHeight - 10, { align: 'right' })
  }
  
  // Save PDF with formatted filename
  const filename = `DADJ-Data-Export-${data.profile.name?.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(filename)
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
