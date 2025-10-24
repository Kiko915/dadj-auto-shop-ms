/**
 * Export user data as JSON file
 * @param {Object} data - User data to export
 */
export const exportAsJSON = (data) => {
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
