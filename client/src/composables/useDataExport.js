import { ref } from 'vue'
import { toast } from 'vue-sonner'
import { exportUserData } from '@/api/profile'
import { exportAsJSON } from '@/utils/exportJSON'
import { exportAsPDF } from '@/utils/exportPDF'

/**
 * Composable for handling user data export
 * Supports both JSON and PDF formats
 */
export function useDataExport() {
  const exportLoading = ref(false)
  const exportFormat = ref('json')

  /**
   * Handle data export based on selected format
   */
  const handleExportData = async () => {
    exportLoading.value = true
    
    try {
      // Fetch user data from backend
      const userData = await exportUserData()

      // Export based on selected format
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

  return {
    exportLoading,
    exportFormat,
    handleExportData
  }
}
