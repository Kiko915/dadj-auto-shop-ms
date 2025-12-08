<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Plus, Search, FileText, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

import { getEstimates, getEstimate, getEstimateStats, updateEstimateStatus, deleteEstimate } from '@/api/estimates'
import EstimateStatsCards from '@/components/views/estimates/EstimateStatsCards.vue'
import EstimateDocument from '@/components/estimates/EstimateDocument.vue'
import { toPng } from 'html-to-image'
import { jsPDF } from 'jspdf'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'

// Types
interface Estimate {
  id: string
  createdAt: string
  status: string
  totalAmount: number
  _count: {
    items: number
  }
  customer: {
    firstName: string
    lastName: string
  }
  vehicle: {
    make: string
    model: string
    licensePlate: string
  }
}

interface Stats {
  totalEstimates: number
  pendingEstimates: number
  approvedEstimates: number
  declinedEstimates: number
  revenue: number
}

// State
const router = useRouter()
const route = useRoute()
const estimates = ref<Estimate[]>([])
const stats = ref<Stats>({
  totalEstimates: 0,
  pendingEstimates: 0,
  approvedEstimates: 0,
  declinedEstimates: 0,
  revenue: 0
})
const loading = ref(true)
const search = ref('')
const statusFilter = ref((route.query.status as string) || 'ALL')
const page = ref(1)
const totalPages = ref(1)
const totalItems = ref(0)
const limit = 10

// Delete Modal State
const estimateToDelete = ref<string | null>(null)
const deleteDialogOpen = ref(false)
const tempEstimate = ref(null)

// Methods
const fetchData = async () => {
  loading.value = true
  try {
    const params: any = {
      page: page.value,
      limit,
      search: search.value
    }
    
    if (statusFilter.value !== 'ALL') {
      params.status = statusFilter.value
    }

    const [estimatesData, statsData] = await Promise.all([
      getEstimates(params),
      getEstimateStats()
    ])

    estimates.value = estimatesData.items
    totalPages.value = estimatesData.totalPages
    totalItems.value = estimatesData.totalItems
    stats.value = statsData
  } catch (error) {
    console.error('Failed to fetch data:', error)
    toast.error('Error', {
      description: 'Failed to load estimates data.'
    })
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  page.value = 1
  fetchData()
}

// Debounce search
let searchTimeout: ReturnType<typeof setTimeout>
watch(search, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(handleSearch, 500)
})

watch(statusFilter, (newStatus) => {
  const query = { ...route.query }
  if (newStatus && newStatus !== 'ALL') {
    query.status = newStatus
  } else {
    delete query.status
  }
  router.push({ query })

  page.value = 1
  fetchData()
})

const nextPage = () => {
  if (page.value < totalPages.value) {
    page.value++
    fetchData()
  }
}

const prevPage = () => {
  if (page.value > 1) {
    page.value--
    fetchData()
  }
}

const navigateToNew = () => {
  router.push('/dashboard/estimates/new')
}

const navigateToEdit = (id: string) => {
  router.push(`/dashboard/estimates/new?edit=${id}`)
}

const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
        await updateEstimateStatus(id, newStatus)
        toast.success('Status updated')
        fetchData() // Refresh list
    } catch (error) {
        toast.error('Failed to update status')
    }
}

const handleDelete = (id: string) => {
    estimateToDelete.value = id
    deleteDialogOpen.value = true
}

const confirmDelete = async () => {
    if (!estimateToDelete.value) return
    
    try {
        await deleteEstimate(estimateToDelete.value)
        toast.success('Estimate deleted')
        fetchData()
    } catch (error) {
        toast.error('Failed to delete estimate')
    } finally {
        // Reset state
        deleteDialogOpen.value = false
        estimateToDelete.value = null
    }
}

const handleDownloadPDF = async (id: string) => {
    try {
        const data = await getEstimate(id)
        tempEstimate.value = data
        
        // Wait for DOM to render the hidden component
        await nextTick()
        
        // Small delay to ensure styles are fully applied
        await new Promise(resolve => setTimeout(resolve, 100))

        const element = document.getElementById('temp-estimate-pdf')
        if (!element) throw new Error('Document element not found')

        // Apply scrollbar fix logic
        const tableContainer = element.querySelector('[data-slot="table-container"]') as HTMLElement
        let originalOverflow = ''
        
        if (tableContainer) {
            originalOverflow = tableContainer.style.overflow
            tableContainer.style.overflow = 'visible'
        }

        const dataUrl = await toPng(element, { 
            backgroundColor: '#ffffff', 
            pixelRatio: 2,
            width: element.scrollWidth,
            height: element.scrollHeight
        })

        if (tableContainer) {
            tableContainer.style.overflow = originalOverflow
        }

        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        })

        const imgProps = pdf.getImageProperties(dataUrl)
        const pdfWidth = pdf.internal.pageSize.getWidth()
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width
        
        pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight)
        pdf.save(`Estimate_${id}.pdf`)
        toast.success('PDF downloaded successfully')

    } catch (error) {
        console.error('PDF generation error', error)
        toast.error('Failed to generate PDF')
    } finally {
        tempEstimate.value = null // Cleanup
    }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP'
  }).format(value)
}

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'APPROVED': return 'success' // usually black/primary
    case 'PENDING': return 'secondary' // usually gray/yellowish depending on theme
    case 'DECLINED': return 'destructive'
    case 'EXPIRED': return 'outline'
    default: return 'outline'
  }
}

// Initial load
onMounted(fetchData)
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Estimates</h1>
        <p class="text-muted-foreground">create and manage customer estimates.</p>
      </div>
      <Button @click="navigateToNew">
        <Plus class="mr-2 h-4 w-4" />
        New Estimate
      </Button>
    </div>

    <!-- Stats -->
    <div v-if="loading && !stats.totalEstimates" class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
       <Skeleton v-for="i in 4" :key="i" class="h-32 rounded-xl" />
    </div>
    <EstimateStatsCards v-else :stats="stats" />

    <!-- Filters -->
    <div class="flex flex-col sm:flex-row gap-4 items-center justify-between">
      <div class="flex items-center gap-2 w-full sm:w-auto">
        <div class="relative w-full sm:w-64">
          <Search class="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            v-model="search" 
            placeholder="Search estimates..." 
            class="pl-8"
          />
        </div>
        <Select v-model="statusFilter">
          <SelectTrigger class="w-[180px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="DECLINED">Declined</SelectItem>
            <SelectItem value="EXPIRED">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <!-- Table -->
    <div class="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Vehicle</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead class="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="loading && estimates.length === 0">
            <TableCell colspan="7" class="h-24 text-center">
              <div class="flex justify-center">
                 <div class="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
              </div>
            </TableCell>
          </TableRow>
          
          <TableRow v-else-if="estimates.length === 0">
            <TableCell colspan="7" class="h-[400px] text-center">
              <div class="flex flex-col items-center justify-center space-y-3">
                <div class="flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
                  <FileText class="h-8 w-8 text-muted-foreground" />
                </div>
                <div class="space-y-1">
                  <h3 class="font-semibold text-lg tracking-tight">No estimates found</h3>
                  <p class="text-sm text-muted-foreground max-w-sm mx-auto">
                    You haven't created any estimates yet. <br/>
                    Start by creating a new estimate for your customers.
                  </p>
                </div>
                <div class="pt-2">
                  <Button @click="router.push('/dashboard/estimates/new')">
                    <Plus class="mr-2 h-4 w-4" />
                    Create Estimate
                  </Button>
                </div>
              </div>
            </TableCell>
          </TableRow>

          <TableRow v-else v-for="estimate in estimates" :key="estimate.id">
            <TableCell class="font-medium">
              <div class="flex flex-col">
                <span>{{ formatDate(estimate.createdAt) }}</span>
                <span class="text-xs text-muted-foreground font-mono">{{ estimate.id.startsWith('EST-') ? estimate.id : estimate.id.slice(-8) }}</span>
              </div>
            </TableCell>
            <TableCell>
              <div class="font-medium">{{ estimate.customer.firstName }} {{ estimate.customer.lastName }}</div>
            </TableCell>
            <TableCell>
              <div>{{ estimate.vehicle.make }} {{ estimate.vehicle.model }}</div>
              <div class="text-xs text-muted-foreground">{{ estimate.vehicle.licensePlate }}</div>
            </TableCell>
             <TableCell>
              {{ estimate._count.items }} items
            </TableCell>
            <TableCell>
              {{ formatCurrency(estimate.totalAmount) }}
            </TableCell>
            <TableCell>
              <Badge :variant="getStatusVariant(estimate.status)">{{ estimate.status }}</Badge>
            </TableCell>
            <TableCell class="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button variant="ghost" class="h-8 w-8 p-0">
                    <span class="sr-only">Open menu</span>
                    <MoreHorizontal class="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem 
                    v-if="estimate.status === 'DRAFT' || estimate.status === 'PENDING'"
                    @click="navigateToEdit(estimate.id)"
                  >
                    {{ estimate.status === 'DRAFT' ? 'Resume Editing' : 'Edit Estimate' }}
                  </DropdownMenuItem>
                  <DropdownMenuItem @click="router.push(`/dashboard/estimates/${estimate.id}`)">
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    v-if="estimate.status === 'DRAFT' || estimate.status === 'PENDING'"
                    @click="handleStatusUpdate(estimate.id, 'APPROVED')"
                  >
                    Mark as Approved
                  </DropdownMenuItem>
                   <DropdownMenuItem 
                    v-if="estimate.status === 'DRAFT'"
                    @click="handleStatusUpdate(estimate.id, 'PENDING')"
                  >
                    Submit for Approval
                  </DropdownMenuItem>
                   <DropdownMenuItem 
                    v-if="estimate.status === 'PENDING'"
                    @click="handleStatusUpdate(estimate.id, 'DECLINED')"
                  >
                    Mark as Declined
                  </DropdownMenuItem>

                  <DropdownMenuItem @click="handleDownloadPDF(estimate.id)">Download PDF</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    @click="handleDelete(estimate.id)"
                    class="text-destructive"
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- Pagination -->
    <div class="flex items-center justify-end space-x-2 py-4">
      <div class="flex-1 text-sm text-muted-foreground">
        Page {{ page }} of {{ totalPages }} ({{ totalItems }} items)
      </div>
      <div class="space-x-2">
        <Button
          variant="outline"
          size="sm"
          :disabled="page <= 1 || loading"
          @click="prevPage"
        >
          <ChevronLeft class="h-4 w-4 mr-2" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          :disabled="page >= totalPages || loading"
          @click="nextPage"
        >
          Next
          <ChevronRight class="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  </div>

  <!-- Delete Confirmation Dialog -->
  <Dialog :open="deleteDialogOpen" @update:open="deleteDialogOpen = $event">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Delete Estimate</DialogTitle>
        <DialogDescription>
          Are you sure you want to delete this estimate? This action cannot be undone.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" @click="deleteDialogOpen = false">Cancel</Button>
        <Button variant="destructive" @click="confirmDelete">Delete</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

    <!-- Hidden Container for PDF Generation -->
    <div class="fixed left-[-9999px] top-0 overflow-visible w-[800px]"> <!-- Fixed width to simulate A4 aspect ratio approx -->
        <EstimateDocument 
            v-if="tempEstimate" 
            id="temp-estimate-pdf" 
            :estimate="tempEstimate"
        />
    </div>
</template>
