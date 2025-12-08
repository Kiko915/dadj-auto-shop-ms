<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getEstimate, updateEstimateStatus } from '@/api/estimates'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { toPng } from 'html-to-image'
import { jsPDF } from 'jspdf'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { 
  Printer, 
  Edit, 
  Check, 
  X, 
  MoveLeft, 
  User, 
  Car,
  AlertCircle,
  Download
} from 'lucide-vue-next'
import EstimateDocument from '@/components/estimates/EstimateDocument.vue'

const route = useRoute()
const router = useRouter()
const estimate = ref(null)
const loading = ref(true)

// --- Actions ---

const fetchData = async () => {
    loading.value = true
    try {
        const id = route.params.id
        estimate.value = await getEstimate(id)
    } catch (error) {
        console.error('Failed to load estimate', error)
        toast.error('Failed to load estimate details')
        router.push('/dashboard/estimates')
    } finally {
        loading.value = false
    }
}

const handleStatusUpdate = async (status) => {
    if (!estimate.value) return
    try {
        const updated = await updateEstimateStatus(estimate.value.id, status)
        estimate.value = updated.estimate // Update local state with response
        toast.success(`Estimate marked as ${status}`)
    } catch (error) {
        console.error('Update status error', error)
        toast.error('Failed to update status')
    }
}

const handleDownloadPDF = async () => {
    const element = document.getElementById('estimate-pdf-content')
    if (!element) return

    // Apply same scrollbar fix as image download
    const tableContainer = element.querySelector('[data-slot="table-container"]')
    let originalOverflow = ''
    
    if (tableContainer) {
        originalOverflow = tableContainer.style.overflow
        tableContainer.style.overflow = 'visible'
    }

    try {
        const dataUrl = await toPng(element, { 
            backgroundColor: '#ffffff', 
            pixelRatio: 2,
            width: element.scrollWidth,
            height: element.scrollHeight
        })

        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        })

        const imgProps = pdf.getImageProperties(dataUrl)
        const pdfWidth = pdf.internal.pageSize.getWidth()
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width
        
        pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight)
        pdf.save(`Estimate_${estimate.value.id}.pdf`)
        toast.success('PDF downloaded successfully')
    } catch (error) {
        console.error('PDF generation error', error)
        toast.error('Failed to generate PDF')
    } finally {
        if (tableContainer) {
            tableContainer.style.overflow = originalOverflow
        }
    }
}

const handleDownloadImage = async () => {
    const element = document.getElementById('estimate-pdf-content')
    if (!element) return

    const tableContainer = element.querySelector('[data-slot="table-container"]')
    let originalOverflow = ''
    
    if (tableContainer) {
        originalOverflow = tableContainer.style.overflow
        tableContainer.style.overflow = 'visible'
    }

    try {
        const dataUrl = await toPng(element, { 
            backgroundColor: '#ffffff', 
            pixelRatio: 2,
            // Ensure the captured area includes the full width of the table if it overflows
            width: element.scrollWidth,
            height: element.scrollHeight
        })
        
        const link = document.createElement('a')
        link.download = `Estimate_${estimate.value.id}.png`
        link.href = dataUrl
        link.click()
        toast.success('Image downloaded successfully')
    } catch (error) {
        console.error('Image capture error', error)
        toast.error('Failed to generate image')
    } finally {
        if (tableContainer) {
            tableContainer.style.overflow = originalOverflow
        }
    }
}

// --- Computed & Utils ---

const getStatusVariant = (status) => {
  switch (status) {
    case 'APPROVED': return 'success'
    case 'PENDING': return 'secondary'
    case 'DECLINED': return 'destructive'
    case 'EXPIRED': return 'outline'
    default: return 'outline'
  }
}

const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })
}

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP'
    }).format(amount)
}

onMounted(fetchData)
</script>

<template>
    <div v-if="loading" class="flex justify-center items-center py-12">
        <div class="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
    </div>

    <div v-else-if="estimate" class="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
        
        <!-- Header -->
        <div class="flex flex-col space-y-4 print:hidden">
            <div class="space-y-1">
                <div class="flex items-center gap-3">
                    <Button variant="ghost" size="icon" @click="router.back()">
                        <MoveLeft class="h-4 w-4" />
                    </Button>
                    <h1 class="text-2xl font-bold tracking-tight">Estimate {{ estimate.id.startsWith('EST-') ? estimate.id : estimate.id.slice(-8) }}</h1>
                    <Badge :variant="getStatusVariant(estimate.status)">{{ estimate.status }}</Badge>
                </div>
                <p class="text-muted-foreground text-sm ml-10">
                    Created on {{ formatDate(estimate.createdAt) }}
                </p>
            </div>
        </div>

        <!-- Action Bar (Sticky or just separate) -->
        <div class="flex flex-wrap items-center justify-between gap-4 p-4 bg-muted/40 border rounded-lg print:hidden">
            <div class="flex items-center gap-2">
                <Button variant="outline" size="sm" @click="handleDownloadPDF">
                    <Printer class="h-4 w-4 mr-2" />
                    Download PDF
                </Button>
                <Button variant="outline" size="sm" @click="handleDownloadImage">
                    <Download class="h-4 w-4 mr-2" />
                    Download Image
                </Button>
            </div>

            <div class="flex items-center gap-2">
                <!-- Edit / Resume Editing -->
                <template v-if="estimate.status === 'DRAFT' || estimate.status === 'PENDING'">
                    <Button 
                        :variant="estimate.status === 'DRAFT' ? 'default' : 'outline'"
                        size="sm"
                        class="gap-2"
                        @click="router.push(`/dashboard/estimates/new?edit=${estimate.id}`)"
                    >
                        <Edit class="h-4 w-4" />
                        {{ estimate.status === 'DRAFT' ? 'Resume Editing' : 'Edit Details' }}
                    </Button>
                </template>

                <!-- Approval Actions -->
                <template v-if="estimate.status === 'PENDING'">
                    <div class="h-4 w-px bg-border mx-2 hidden md:block"></div> <!-- Separator -->
                    
                    <Button 
                        size="sm"
                        @click="handleStatusUpdate('APPROVED')"
                        class="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm border-emerald-600 hover:border-emerald-700"
                    >
                        <Check class="h-4 w-4" />
                        Approve Estimate
                    </Button>
                    
                    <Button 
                        variant="outline"
                        size="sm"
                        @click="handleStatusUpdate('DECLINED')"
                        class="gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                    >
                        <X class="h-4 w-4" />
                        Decline
                    </Button>
                </template>
            </div>
        </div>

        <!-- Main Content (Printable Area) -->
        <EstimateDocument id="estimate-pdf-content" :estimate="estimate" />
    </div>
</template>

<style scoped>
@media print {
  /* Hide everything not in main content usually handled by removing layout elements, 
     but here we rely on specific print styles or a print-specific layout. 
     For simple pages, hiding headers/sidebars via global CSS is common. 
  */
  
  /* Ensure the content takes full width and looks like a document */
  .max-w-5xl {
    max-width: none !important;
    padding: 0 !important;
    margin: 0 !important;
  }
  
  /* Hide page header/actions */
  .print\:hidden {
    display: none !important;
  }

  /* Reset card styling for print to look plain */
  .print\:border-none {
    border: none !important;
  }
  .print\:shadow-none {
    box-shadow: none !important;
  }
  .print\:p-0 {
    padding: 0 !important;
  }
}
</style>
