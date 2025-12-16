<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/api'
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { 
  Download, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign, 
  Package,
  Loader2,
  Pencil
} from 'lucide-vue-next'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

// Chart.js imports
import { Bar, Doughnut, Line } from 'vue-chartjs'
import { 
  Chart as ChartJS, 
  Title, 
  Tooltip, 
  Legend, 
  BarElement, 
  ArcElement,
  PointElement,
  LineElement,
  CategoryScale, 
  LinearScale,
  Filler
} from 'chart.js'

ChartJS.register(
  Title, 
  Tooltip, 
  Legend, 
  BarElement, 
  ArcElement,
  PointElement,
  LineElement,
  CategoryScale, 
  LinearScale,
  Filler
)

// State
const isLoading = ref(true)
const inventoryValue = ref(0)
const lowStockCount = ref(0)
const fastestMover = ref({ name: "N/A", count: 0 })

const restockItems = ref([])
const deadStockItems = ref([])

const topSellingData = ref({ labels: [], datasets: [] })
const revenueChartData = ref({ labels: [], datasets: [] })
const trendChartData = ref({ labels: [], datasets: [] })

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false
}

// Calculations
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount)
}

const getRestockCost = (item) => {
  const needed = Math.max(0, item.maxStock - item.stock)
  return needed * item.costPerUnit
}

const getProgressColor = (stock, max) => {
  if (stock === 0) return 'bg-red-500'
  const percentage = (stock / max) * 100
  if (percentage < 30) return 'bg-amber-500'
  return 'bg-green-500'
}

const fetchReportData = async () => {
    try {
        isLoading.value = true
        const response = await api.get('/inventory/reports')
        const data = response.data

        // KPIs
        inventoryValue.value = data.kpi.inventoryValue
        lowStockCount.value = data.kpi.lowStockCount
        fastestMover.value = data.kpi.fastestMover

        // Lists
        restockItems.value = data.restockList.map(item => ({ ...item, selected: false }))
        deadStockItems.value = data.deadStockList

        // Charts
        const charts = data.charts

        topSellingData.value = {
            labels: charts.topSelling.labels,
            datasets: [{
                label: 'Units Sold (This Month)',
                backgroundColor: '#f59e0b',
                data: charts.topSelling.data
            }]
        }

        revenueChartData.value = {
            labels: charts.revenueDistribution.labels,
            datasets: [{
                backgroundColor: ['#f59e0b', '#ef4444', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#6366f1'],
                data: charts.revenueDistribution.data
            }]
        }

        trendChartData.value = {
            labels: charts.salesTrend.labels,
            datasets: [{
                label: 'Parts Revenue (PHP)',
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                data: charts.salesTrend.data,
                fill: true
            }]
        }

    } catch (error) {
        console.error('Failed to load report data', error)
        // Optionally toast error
    } finally {
        isLoading.value = false
    }
}

const isUpdatingTarget = ref(null)
const updateTargetStock = async (item, newTarget) => {
    const target = parseInt(newTarget)
    if (isNaN(target) || target < 0) return

    try {
        isUpdatingTarget.value = item.id
        await api.patch(`/inventory/${item.id}/target-stock`, { targetStock: target })
        
        // Update local data
        item.maxStock = target
        item.targetStock = target // Ensure we store it if we need it
        toast.success('Target stock updated')
    } catch (error) {
        console.error('Failed to update target stock:', error)
        toast.error('Failed to update target stock')
    } finally {
        isUpdatingTarget.value = null
    }
}

const handleExportPDF = async () => {
  const doc = new jsPDF()
  
  // Add Logo
  try {
      const logoUrl = '/logo/symbol_w_wordmark_primary.png'
      const logoResponse = await fetch(logoUrl)
      const logoBlob = await logoResponse.blob()
      const logoBase64 = await new Promise((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result)
          reader.readAsDataURL(logoBlob)
      })
      doc.addImage(logoBase64, 'PNG', 14, 10, 40, 15) // x, y, w, h
  } catch (err) {
      console.error('Failed to load logo for PDF:', err)
  }

  doc.setFontSize(20)
  doc.text("Restock List", 14, 35)
  doc.setFontSize(10)
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 42)
  
  const selectedItems = restockItems.value.filter(item => item.selected)
  const itemsToPrint = selectedItems.length > 0 ? selectedItems : restockItems.value
  
  const tableData = itemsToPrint.map(item => [
    item.name,
    item.stock,
    item.maxStock,
    `PHP ${getRestockCost(item).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  ])
  
  autoTable(doc, {
    head: [['Item Name', 'Current Stock', 'Target Stock', 'Est. Refill Cost']],
    body: tableData,
    startY: 48,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [41, 128, 185] }
  })
  
  doc.save("restock-list.pdf")
}

onMounted(() => {
    fetchReportData()
})

</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight text-[#041954]">Inventory Intelligence</h1>
        <p class="text-muted-foreground">Analyze inventory health and plan restocks effectively.</p>
      </div>
      <Button @click="handleExportPDF" class="bg-[#D92D20] hover:bg-[#b9251b] text-white">
        <Download class="mr-2 h-4 w-4" /> 
        {{ restockItems.filter(i => i.selected).length > 0 ? `Export Selected (${restockItems.filter(i => i.selected).length})` : 'Export Restock List (All)' }}
      </Button>
    </div>

    <div v-if="isLoading" class="flex justify-center items-center py-20">
        <Loader2 class="h-12 w-12 animate-spin text-muted-foreground" />
    </div>

    <div v-else class="space-y-6 animate-in fade-in duration-500">
        <div class="grid gap-4 md:grid-cols-3">
        <!-- Inventory Value (Green Theme) -->
        <Card class="relative overflow-hidden bg-gradient-to-br from-green-50 to-white border-green-100 transition-all hover:shadow-md">
            <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium text-green-900">Inventory Value</CardTitle>
            <div class="p-2 bg-green-100/50 rounded-lg">
                <DollarSign class="h-4 w-4 text-green-600" />
            </div>
            </CardHeader>
            <CardContent>
            <div class="text-2xl font-bold text-green-700">{{ formatCurrency(inventoryValue) }}</div>
            <p class="text-xs text-green-600/80">Money sitting on shelves</p>
            </CardContent>
        </Card>
        
        <!-- Low Stock Alerts (Red Theme) -->
        <Card class="relative overflow-hidden bg-gradient-to-br from-red-50 to-white border-red-100 transition-all hover:shadow-md">
            <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium text-red-900">Low Stock Alerts</CardTitle>
            <div class="p-2 bg-red-100/50 rounded-lg">
                <AlertTriangle class="h-4 w-4 text-red-600" />
            </div>
            </CardHeader>
            <CardContent>
            <div class="text-2xl font-bold text-red-700">{{ lowStockCount }} Items</div>
            <p class="text-xs text-red-600/80">Requires immediate attention</p>
            </CardContent>
        </Card>
        
        <!-- Fastest Mover (Amber Theme) -->
        <Card class="relative overflow-hidden bg-gradient-to-br from-amber-50 to-white border-amber-100 transition-all hover:shadow-md">
            <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium text-amber-900">Fastest Mover</CardTitle>
            <div class="p-2 bg-amber-100/50 rounded-lg">
                <TrendingUp class="h-4 w-4 text-amber-600" />
            </div>
            </CardHeader>
            <CardContent>
            <div class="text-2xl font-bold text-amber-700">{{ fastestMover.name }}</div>
            <p class="text-xs text-amber-600/80">{{ fastestMover.count }} sold this month</p>
            </CardContent>
        </Card>
        </div>

        <!-- Main Content Tabs -->
        <Tabs default-value="restock" class="space-y-4">
        <TabsList>
            <TabsTrigger value="restock">Restock Recommendations</TabsTrigger>
            <TabsTrigger value="usage">Usage Analytics</TabsTrigger>
        </TabsList>

        <!-- Tab A: Restock Recommendations -->
        <TabsContent value="restock" class="space-y-4">
            <Card>
            <CardHeader>
                <CardTitle>Shopping List</CardTitle>
                <CardDescription>Items below threshold that need restocking.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead class="w-[50px]">
                        <!-- Select All to be implemented if needed -->
                    </TableHead>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Current</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Cost to Refill</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow v-if="restockItems.length === 0">
                        <TableCell colspan="5" class="text-center text-muted-foreground py-8">No items currently need restocking.</TableCell>
                    </TableRow>
                    <TableRow v-else v-for="item in restockItems" :key="item.id">
                    <TableCell>
                        <input type="checkbox" v-model="item.selected" class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                    </TableCell>
                    <TableCell class="font-medium">{{ item.name }}</TableCell>
                    <TableCell>
                        <span :class="{'text-red-500 font-bold': item.stock === 0, 'text-amber-500': item.stock > 0 && item.stock < 5}">
                            {{ item.stock }}
                        </span>
                    </TableCell>
                    <TableCell>
                        <div class="flex items-center gap-2 group">
                            <span v-if="isUpdatingTarget !== item.id" class="font-medium">{{ item.maxStock }}</span>
                            <div v-if="isUpdatingTarget === item.id" class="flex items-center">
                                <Loader2 class="h-3 w-3 animate-spin"/>
                            </div>
                            <Popover v-else>
                                <PopoverTrigger as-child>
                                    <Button variant="ghost" size="icon" class="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Pencil class="h-3 w-3 text-muted-foreground" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent class="w-40 p-2">
                                    <div class="space-y-2">
                                        <p class="text-xs font-medium">Set Target Stock</p>
                                        <Input 
                                            type="number" 
                                            :defaultValue="item.maxStock" 
                                            @keypress.enter="(e) => { updateTargetStock(item, e.target.value); }"
                                            class="h-7 text-xs" 
                                        />
                                        <p class="text-[10px] text-muted-foreground">Press Enter to save</p>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </TableCell>
                    <TableCell>{{ formatCurrency(getRestockCost(item)) }}</TableCell>
                    </TableRow>
                </TableBody>
                </Table>
            </CardContent>
            </Card>
        </TabsContent>

        <!-- Tab B: Usage Analytics -->
        <TabsContent value="usage" class="space-y-4">
            <div class="grid gap-4 md:grid-cols-2">
            <!-- Top Selling Parts -->
            <Card>
                <CardHeader>
                <CardTitle>Top Selling Parts</CardTitle>
                <CardDescription>Highest volume items this month</CardDescription>
                </CardHeader>
                <CardContent>
                    <div class="h-[300px]">
                        <Bar :data="topSellingData" :options="chartOptions" />
                    </div>
                </CardContent>
            </Card>

            <!-- Revenue Distribution -->
            <Card>
                <CardHeader>
                <CardTitle>Revenue Distribution</CardTitle>
                <CardDescription>Sales breakdown by category</CardDescription>
                </CardHeader>
                <CardContent>
                    <div class="h-[300px] flex justify-center">
                        <Doughnut :data="revenueChartData" :options="chartOptions" />
                    </div>
                </CardContent>
            </Card>

            <!-- Monthly Sales Trend -->
            <Card class="md:col-span-2">
                <CardHeader>
                <CardTitle>Monthly Sales Trend</CardTitle>
                <CardDescription>Revenue performance over last 6 months</CardDescription>
                </CardHeader>
                <CardContent>
                    <div class="h-[300px]">
                        <Line :data="trendChartData" :options="chartOptions" />
                    </div>
                </CardContent>
            </Card>

            <!-- Dead Stock Warning -->
            <Card class="md:col-span-2">
                <CardHeader>
                <CardTitle>Dead Stock Warning</CardTitle>
                <CardDescription>Items not sold in the last 180 days</CardDescription>
                </CardHeader>
                <CardContent>
                <div class="space-y-4">
                    <div v-if="deadStockItems.length === 0" class="text-center text-muted-foreground py-4">No dead stock detected. Good job!</div>
                    <div v-else v-for="item in deadStockItems" :key="item.id" class="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                        <div class="flex items-start gap-4">
                            <div class="bg-red-100 p-2 rounded-full">
                                <Package class="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                                <p class="font-medium">{{ item.name }}</p>
                                <p class="text-sm text-muted-foreground">Last sold: {{ item.lastSold }}</p>
                            </div>
                        </div>
                        <Badge variant="outline" class="text-red-500 border-red-200 bg-red-50">
                            {{ item.daysSinceSold }} days
                        </Badge>
                    </div>
                </div>
                </CardContent>
            </Card>
            </div>
        </TabsContent>
        </Tabs>
    </div>
  </div>
</template>
