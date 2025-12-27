import jsPDF from 'jspdf'

/**
 * Export user data as professionally formatted PDF
 * @param {Object} data - User data to export
 */
export const exportAsPDF = async (data) => {
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
  yPos = drawField('City/Municipality', data.address.city, yPos)
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
