<template>
  <div class="space-y-6 animate-in fade-in duration-500">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-6">
      <div class="space-y-1">
        <h1 class="text-3xl font-bold tracking-tight text-foreground">
            {{ greeting }}, {{ userName }}
        </h1>
        <p class="text-muted-foreground flex items-center gap-2 text-sm">
          <CalendarDays class="w-4 h-4" />
          {{ currentDate }}
        </p>
      </div>
      <div class="flex items-center space-x-3">
          
          <Select v-model="selectedTimeRange">
            <SelectTrigger class="w-[160px] bg-background">
                <div class="flex items-center gap-2">
                    <Filter class="w-4 h-4 text-muted-foreground" />
                    <SelectValue placeholder="Period" />
                </div>
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="thisMonth">This Month</SelectItem>
                <SelectItem value="lastMonth">Last Month</SelectItem>
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button size="lg" class="gap-2 shadow-sm bg-slate-900 hover:bg-slate-800 text-white">
                <PlusCircle class="h-4 w-4" />
                Quick Create
                <ChevronDown class="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" class="w-56">
              <DropdownMenuLabel>Create New</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem @click="router.push('/dashboard/estimates/new')">
                <ClipboardList class="mr-2 h-4 w-4" />
                <span>New Estimate</span>
              </DropdownMenuItem>
              <DropdownMenuItem @click="router.push('/dashboard/service-orders/new')">
                <Wrench class="mr-2 h-4 w-4" />
                <span>Direct Service Order</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem @click="router.push('/dashboard/inventory')">
                 <Package class="mr-2 h-4 w-4" />
                 <span>Manage Inventory</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
      </div>
    </div>

    <!-- AI Insight -->
    <AIInsightCard v-if="stats" :stats="stats" :urgent-jobs="stats.dueToday || []" />

    <!-- KPI Grid -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <KPIStatsCard
        title="Active Jobs"
        :value="stats?.activeJobs || 0"
        description="Vehicles in service"
        :icon="Wrench"
        variant="blue"
        @click="router.push('/dashboard/service-orders?status=IN_PROGRESS')"
      />
      <KPIStatsCard
        title="Today's Sales"
        :value="formatCurrency(stats?.todaysSales || 0)"
        description="Gross revenue today"
        :icon="DollarSign"
        variant="green"
      />
      <KPIStatsCard
        title="Low Inventory"
        :value="stats?.lowInventory || 0"
        description="Items below reorder point"
        :icon="Package"
        variant="red"
        @click="router.push('/dashboard/inventory/reports')"
      />
      <KPIStatsCard
        title="Pending Approvals"
        :value="stats?.pendingApprovals || 0"
        description="Estimates awaiting action"
        :icon="FileClock"
        variant="amber"
        @click="router.push('/dashboard/estimates?status=PENDING')"
      />
    </div>

    <!-- Main Content Grid -->
    <div class="grid gap-6 md:grid-cols-3">
      
      <!-- Operational Column (Left 2/3) -->
      <div class="md:col-span-2 space-y-6">
        
        <!-- Revenue Trend (Line Chart) -->
        <Card class="col-span-1">
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Income performance over time</CardDescription>
          </CardHeader>
          <CardContent>
             <div class="h-[300px] w-full">
                <Line v-if="revenueChartData" :data="revenueChartData" :options="revenueChartOptions" />
                <div v-else class="h-full flex items-center justify-center text-muted-foreground">
                    Loading chart...
                </div>
             </div>
          </CardContent>
        </Card>

        <!-- Priority / Due Today -->
        <Card>
          <CardHeader>
            <CardTitle>Priority Jobs</CardTitle>
            <CardDescription>Scheduled for completion today</CardDescription>
          </CardHeader>
          <CardContent>
            <OperationalTable :orders="stats?.dueToday" :loading="isLoading" />
          </CardContent>
        </Card>

        <!-- Top Moving Parts -->
        <Card>
            <CardHeader>
                <CardTitle>Top Moving Parts</CardTitle>
                <CardDescription>Highest volume inventory items</CardDescription>
            </CardHeader>
            <CardContent>
                <div class="h-[300px] w-full">
                    <Bar :data="topPartsChartData" :options="topPartsChartOptions" />
                </div>
            </CardContent>
        </Card>
      </div>

      <!-- Quick Actions Column (Right 1/3) -->
      <div class="space-y-6">
        
        <!-- Quick Links -->
        <Card>
          <CardHeader>
             <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent class="grid gap-3">
            <Button variant="outline" class="w-full justify-start h-12 text-base font-normal border-slate-200 hover:border-blue-500 hover:text-blue-600 transition-all" @click="router.push('/dashboard/estimates/new')">
                <PlusCircle class="mr-3 h-5 w-5" />
                New Estimate
            </Button>
            <Button variant="outline" class="w-full justify-start h-12 text-base font-normal border-slate-200 hover:border-blue-500 hover:text-blue-600 transition-all" @click="router.push('/dashboard/billing')">
                <CreditCard class="mr-3 h-5 w-5" />
                New Counter Sale
            </Button>
            <Button variant="outline" class="w-full justify-start h-12 text-base font-normal border-slate-200 hover:border-blue-500 hover:text-blue-600 transition-all" @click="router.push('/dashboard/customers')">
                <UserPlus class="mr-3 h-5 w-5" />
                Register Customer
            </Button>
          </CardContent>
        </Card>

        <!-- Shop Capacity -->
        <Card>
           <CardHeader>
             <CardTitle>Shop Capacity</CardTitle>
             <CardDescription>Bay utlization</CardDescription>
           </CardHeader>
           <CardContent class="space-y-6">
              <div class="h-[220px] w-full flex items-center justify-center relative">
                 <Doughnut :data="capacityChartData" :options="capacityChartOptions" />
                 <div class="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                    <span class="text-4xl font-bold tracking-tighter text-slate-900">{{ stats?.shopCapacity?.current || 0 }}</span>
                    <span class="text-sm text-muted-foreground font-medium">of {{ stats?.shopCapacity?.total || 10 }} Bays</span>
                 </div>
              </div>
              <div class="flex items-center justify-between text-sm px-4">
                  <div class="flex items-center gap-2">
                       <span class="w-3 h-3 rounded-full bg-slate-900"></span>
                       <span class="text-muted-foreground">Occupied</span>
                  </div>
                  <span class="font-medium">{{ Math.round(capacityPercentage) }}%</span>
              </div>
           </CardContent>
        </Card>

        <!-- Service Order Status -->
        <Card>
            <CardHeader>
                <CardTitle>Service Status</CardTitle>
                <CardDescription>Current workflow distribution</CardDescription>
            </CardHeader>
            <CardContent>
                <div class="h-[250px] w-full flex items-center justify-center">
                    <Doughnut :data="statusChartData" :options="statusChartOptions" />
                </div>
            </CardContent>
        </Card>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import OperationalTable from '@/components/dashboard/OperationalTable.vue'
import KPIStatsCard from '@/components/dashboard/KPIStatsCard.vue'
import AIInsightCard from '@/components/dashboard/AIInsightCard.vue'
import { Wrench, DollarSign, Package, FileClock, PlusCircle, CreditCard, UserPlus, ChevronDown, ClipboardList, Settings, Filter, CalendarDays } from 'lucide-vue-next'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSEO } from '@/composables/useSEO'
import { Doughnut, Bar, Line } from 'vue-chartjs'
import { 
    Chart as ChartJS, 
    ArcElement, 
    Tooltip, 
    Legend, 
    BarElement, 
    CategoryScale, 
    LinearScale, 
    PointElement, 
    LineElement, 
    Filler 
} from 'chart.js'

ChartJS.register(
    ArcElement, 
    Tooltip, 
    Legend, 
    BarElement, 
    CategoryScale, 
    LinearScale, 
    PointElement, 
    LineElement, 
    Filler
)

// SEO
useSEO({
  title: 'Command Center',
  description: 'Manager Dashboard for shop overview',
})

const router = useRouter()
const authStore = useAuthStore()
const stats = ref(null)
const isLoading = ref(true)
const selectedTimeRange = ref('7days')

const userName = computed(() => {
    return stats.value?.currentUser?.name || authStore.user?.name || 'Admin'
})

const greeting = computed(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 18) return 'Good Afternoon'
    return 'Good Evening'
})

const currentDate = ref('')

// Initialize
onMounted(async () => {
    updateDateTime()
    setInterval(updateDateTime, 60000) 
    await loadData()
})

const updateDateTime = () => {
    const now = new Date()
    currentDate.value = now.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
    })
}

const loadData = async () => {
    try {
        isLoading.value = true
        const res = await api.get('/protected/dashboard-stats', {
            params: { timeRange: selectedTimeRange.value }
        })
        stats.value = res.data.stats
    } catch (e) {
        console.error('Failed to load dashboard:', e)
    } finally {
        isLoading.value = false
    }
}

watch(selectedTimeRange, () => {
    loadData()
})

// Helpers
const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val)
}

const formatDateShort = (dateStr) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

const capacityPercentage = computed(() => {
    if (!stats.value?.shopCapacity) return 0
    return (stats.value.shopCapacity.current / stats.value.shopCapacity.total) * 100
})

// --- Charts Configuration ---
// Using a standard Blue/Indigo that acts as "Primary"
const PRIMARY_COLOR = '#3b82f6'; // Blue-500

// 1. Revenue Trend (Line Chart)
const revenueChartData = computed(() => {
    const trend = stats.value?.revenueTrend || []
    return {
        labels: trend.map(d => formatDateShort(d.date)),
        datasets: [{
            label: 'Revenue',
            data: trend.map(d => d.amount),
            borderColor: PRIMARY_COLOR,
            backgroundColor: (ctx) => {
                const canvas = ctx.chart.ctx;
                const gradient = canvas.createLinearGradient(0, 0, 0, 300);
                gradient.addColorStop(0, 'rgba(59, 130, 246, 0.2)'); // Blue-500 at 20%
                gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
                return gradient;
            },
            fill: true,
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: '#ffffff',
            pointBorderColor: PRIMARY_COLOR,
            pointBorderWidth: 2
        }]
    }
})

const revenueChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { display: false },
        tooltip: {
            backgroundColor: '#0f172a',
            titleColor: '#fff',
            bodyColor: '#fff',
            padding: 10,
            cornerRadius: 4,
            displayColors: false,
            callbacks: {
                label: (context) => formatCurrency(context.raw)
            }
        }
    },
    scales: {
        x: {
            grid: { display: false },
            ticks: { color: '#64748b', font: { size: 11 } }
        },
        y: {
            border: { display: false },
            grid: { color: '#f1f5f9', borderDash: [4, 4] },
            ticks: { 
                color: '#64748b', 
                font: { size: 11 },
                callback: (value) => '₱' + value / 1000 + 'k' 
            },
            beginAtZero: true
        }
    }
}

// 2. Shop Capacity (Doughnut)
const capacityChartData = computed(() => {
    const current = stats.value?.shopCapacity?.current || 0
    const total = stats.value?.shopCapacity?.total || 10
    const available = Math.max(0, total - current)
    
    let occupiedColor = PRIMARY_COLOR
    if (current / total >= 0.8) occupiedColor = '#ef4444' // Red if super busy

    return {
        labels: ['Occupied', 'Available'],
        datasets: [{
            backgroundColor: [occupiedColor, '#f1f5f9'],
            data: [current, available],
            borderWidth: 0,
            hoverOffset: 4
        }]
    }
})

const capacityChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '85%', 
    plugins: { legend: { display: false }, tooltip: { enabled: false } } // Custom center text used instead
}

// 3. Service Status (Doughnut)
const statusChartData = computed(() => {
    const data = stats.value?.charts?.orderStatus
    if (!data) return { labels: [], datasets: [] }

    return {
        labels: ['Pending', 'In Progress', 'Completed', 'Cancelled'],
        datasets: [{
            backgroundColor: ['#fbbf24', PRIMARY_COLOR, '#10b981', '#cbd5e1'], // Amber, Primary, Emerald, Slate
            data: [
                data.PENDING || 0, 
                data.IN_PROGRESS || 0, 
                data.COMPLETED || 0, 
                data.CANCELLED || 0
            ],
            borderWidth: 0,
            hoverOffset: 10
        }]
    }
})

const statusChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    plugins: {
        legend: { 
            position: 'right', 
            labels: { usePointStyle: true, boxWidth: 8, padding: 15, font: { size: 12 } } 
        }
    }
}

// 4. Top Moving Parts (Bar)
const topPartsChartData = computed(() => {
    const parts = stats.value?.charts?.topParts || []
    
    return {
        labels: parts.map(p => p.name),
        datasets: [{
            label: 'Qty Sold',
            backgroundColor: PRIMARY_COLOR, 
            borderRadius: 4,
            barPercentage: 0.6,
            data: parts.map(p => p.quantity)
        }]
    }
})

const topPartsChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
        legend: { display: false },
        tooltip: {
            backgroundColor: '#0f172a',
            padding: 10,
            cornerRadius: 4,
            displayColors: false
        }
    },
    scales: {
        x: { 
            beginAtZero: true,
            grid: { display: false },
            ticks: { color: '#64748b' }
        },
        y: {
            grid: { display: false },
            ticks: { color: '#0f172a', font: { weight: '500' } }
        }
    }
}
</script>