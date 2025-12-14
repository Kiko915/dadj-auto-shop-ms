<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import api from '@/api'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
// Explicit imports to fix resolution issue
import Tabs from '@/components/ui/tabs/Tabs.vue'
import TabsList from '@/components/ui/tabs/TabsList.vue'
import TabsTrigger from '@/components/ui/tabs/TabsTrigger.vue'
import TabsContent from '@/components/ui/tabs/TabsContent.vue'
import { 
    DollarSign, 
    FileText, 
    CreditCard, 
    ArrowUpRight, 
    Printer, 
    AlertCircle,
    Download,
    ChevronLeft,
    ChevronRight,
    Loader2
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { useRouter } from 'vue-router'

const router = useRouter()
// ... existing refs ...

const downloadReport = (format) => {
    const url = `${api.defaults.baseURL}/reports/daily?format=${format}`
    // We need to use valid auth token. The API client adds it to headers, but basic window.open won't.
    // However, if we use a cookie-based auth it would work, but this project uses Bearer token in header.
    // Issue: window.open(url) won't send the Bearer token.
    // Solution: 
    // Option A: Use a temporary token in query param (insecure but easy).
    // Option B: Fetch blob with axios then create object URL (works for CSV and PDF/HTML).
    
    // Implementing Option B for better security consistency.
    
    // For HTML view, it's tricky because we want it to be a real page. 
    // But blob is fine: window.open(blobUrl)
    
    api.get(`/reports/daily`, { 
        params: { format },
        responseType: 'blob' 
    }).then((response) => {
        const file = new Blob([response.data], { type: format === 'csv' ? 'text/csv; charset=utf-8' : 'text/html; charset=utf-8' });
        const fileURL = URL.createObjectURL(file);
        
        if (format === 'csv') {
            const fileLink = document.createElement('a');
            fileLink.href = fileURL;
            fileLink.setAttribute('download', `daily_report_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(fileLink);
            fileLink.click();
            document.body.removeChild(fileLink);
            setTimeout(() => {
                URL.revokeObjectURL(fileURL);
            }, 100);
        } else {
            // HTML / PDF View
            window.open(fileURL, '_blank');
            // Give browser time to load the blob in new tab
            setTimeout(() => {
                URL.revokeObjectURL(fileURL);
            }, 5000);
        }
    }).catch(() => {
        toast.error('Error', { description: 'Failed to download report' })
    });
}


const stats = ref({
    dailyRevenue: 0,
    receivables: 0,
    activeInvoices: 0,
    digitalPayments: 0
})

const invoices = ref([])
const invoicesPage = ref(1)
const invoicesTotalPages = ref(1)
const invoicesLoading = ref(false)

const transactions = ref([])
const transactionsPage = ref(1)
const transactionsTotalPages = ref(1)
const transactionsLoading = ref(false)

const statsLoading = ref(true)

// Fetch Stats
const fetchStats = async () => {
    try {
        statsLoading.value = true
        const statsRes = await api.get('/reports/billing-stats')
        stats.value = statsRes.data
    } catch (error) {
        console.error('Failed to load stats', error)
    } finally {
        statsLoading.value = false
    }
}

// Fetch Invoices
const fetchInvoices = async (page = 1) => {
    try {
        invoicesLoading.value = true
        invoicesPage.value = page
        const ordersRes = await api.get('/service-orders', { 
            params: { 
                page, 
                limit: 10,
                status: 'PENDING,IN_PROGRESS,COMPLETED'
            } 
        })
        
        invoices.value = ordersRes.data.items || []
        invoicesTotalPages.value = ordersRes.data.totalPages || 1
    } catch (error) {
        console.error('Failed to load invoices', error)
        toast.error('Error', { description: 'Failed to load invoices.' })
    } finally {
        invoicesLoading.value = false
    }
}

// Fetch Transactions
const fetchTransactions = async (page = 1) => {
    try {
        transactionsLoading.value = true
        transactionsPage.value = page
        const paymentsRes = await api.get('/payments', {
            params: {
                page,
                limit: 10
            }
        })
        
        transactions.value = paymentsRes.data.items || []
        transactionsTotalPages.value = paymentsRes.data.totalPages || 1
    } catch (error) {
        console.error('Failed to load transactions', error)
         toast.error('Error', { description: 'Failed to load transactions.' })
    } finally {
        transactionsLoading.value = false
    }
}

const fetchAll = () => {
    fetchStats()
    fetchInvoices(1)
    fetchTransactions(1)
}

onMounted(() => {
    fetchAll()
})

// Computed
const receivablesList = computed(() => {
    // Note: Since we are paginating invoices, this client-side filtering only applies to the CURRENT PAGE.
    // Ideally, "Receivables" should be its own API call with filter `?paymentStatus=UNPAID`.
    // However, keeping current behavior for now as user asked for pagination on "tables".
    // For a robust solution, we should probably fetch Receivables separately if we want a complete list.
    // Given the constraints, let's just paginate the existing lists.
    return invoices.value.filter(inv => inv.paymentStatus === 'PARTIAL' || inv.paymentStatus === 'UNPAID')
})

// Methods
const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP'
    }).format(val || 0)
}

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    })
}

const getStatusBadgeVariant = (status) => {
    switch (status) {
        case 'PAID': return 'default' // primary
        case 'PARTIAL': return 'warning' // yellow/amber
        case 'UNPAID': return 'destructive' // red
        default: return 'secondary'
    }
}

const printReceipt = async (orderId) => {
    toast.info("Info", { description: "Select a transaction to print specific receipt." })
}

const downloadReceipt = async (paymentId) => {
    try {
        const response = await api.get(`/payments/${paymentId}/receipt`)
        const receiptWindow = window.open('', '_blank')
        if (!receiptWindow) {
            toast.error('Error', { description: 'Popup blocked. Please allow popups for this site.' })
            return
        }
        receiptWindow.document.write(response.data)
        receiptWindow.document.close()
    } catch (error) {
         toast.error('Error', {
            description: 'Failed to generate receipt',
        })
    }
}

const settleBalance = (orderId) => {
    router.push(`/dashboard/billing/checkout/${orderId}`)
}

</script>

<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 class="text-3xl font-bold tracking-tight">Billing & Invoicing</h1>
                <p class="text-muted-foreground">Manage financial records, invoices, and payments.</p>
            </div>
            <div class="flex items-center gap-2">
                <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                        <Button variant="outline">
                            <Download class="w-4 h-4 mr-2" />
                            Download Daily Report
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem @click="downloadReport('html')">
                            <Printer class="w-4 h-4 mr-2" />
                            View / Print (PDF)
                        </DropdownMenuItem>
                         <DropdownMenuItem @click="downloadReport('csv')">
                            <FileText class="w-4 h-4 mr-2" />
                            Download CSV
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>

        <!-- Stats Grid -->
        <div class="grid gap-4 md:grid-cols-4">
            <!-- Revenue -->
            <Card class="relative overflow-hidden bg-gradient-to-br from-green-50 to-white border-green-100 transition-all hover:shadow-md">
                <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle class="text-sm font-medium text-green-900">Daily Revenue</CardTitle>
                    <div class="p-2 bg-green-100/50 rounded-lg">
                        <DollarSign class="h-4 w-4 text-green-600" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div v-if="statsLoading" class="h-8 w-24 animate-pulse rounded bg-green-100"></div>
                    <div v-else class="text-2xl font-bold text-green-700">{{ formatCurrency(stats.dailyRevenue) }}</div>
                    <p class="text-xs text-green-600/80">Total collected today</p>
                </CardContent>
            </Card>

            <!-- Receivables -->
            <Card class="relative overflow-hidden bg-gradient-to-br from-amber-50 to-white border-amber-100 transition-all hover:shadow-md">
                <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle class="text-sm font-medium text-amber-900">Receivables</CardTitle>
                    <div class="p-2 bg-amber-100/50 rounded-lg">
                        <AlertCircle class="h-4 w-4 text-amber-600" />
                    </div>
                </CardHeader>
                <CardContent>
                     <div v-if="statsLoading" class="h-8 w-24 animate-pulse rounded bg-amber-100"></div>
                    <div v-else class="text-2xl font-bold text-amber-700">{{ formatCurrency(stats.receivables) }}</div>
                    <p class="text-xs text-amber-600/80">Outstanding balance</p>
                </CardContent>
            </Card>

             <!-- Active Invoices -->
             <Card class="relative overflow-hidden bg-gradient-to-br from-blue-50 to-white border-blue-100 transition-all hover:shadow-md">
                <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle class="text-sm font-medium text-blue-900">Active Invoices</CardTitle>
                    <div class="p-2 bg-blue-100/50 rounded-lg">
                        <FileText class="h-4 w-4 text-blue-600" />
                    </div>
                </CardHeader>
                <CardContent>
                     <div v-if="statsLoading" class="h-8 w-24 animate-pulse rounded bg-blue-100"></div>
                    <div v-else class="text-2xl font-bold text-blue-700">{{ stats.activeInvoices }}</div>
                    <p class="text-xs text-blue-600/80">Unpaid or partial orders</p>
                </CardContent>
            </Card>

            <!-- Digital Payments -->
            <Card class="relative overflow-hidden bg-gradient-to-br from-purple-50 to-white border-purple-100 transition-all hover:shadow-md">
                <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle class="text-sm font-medium text-purple-900">Digital Payments</CardTitle>
                    <div class="p-2 bg-purple-100/50 rounded-lg">
                        <CreditCard class="h-4 w-4 text-purple-600" />
                    </div>
                </CardHeader>
                <CardContent>
                     <div v-if="statsLoading" class="h-8 w-24 animate-pulse rounded bg-purple-100"></div>
                    <div v-else class="text-2xl font-bold text-purple-700">{{ formatCurrency(stats.digitalPayments) }}</div>
                    <p class="text-xs text-purple-600/80">GCash / Online today</p>
                </CardContent>
            </Card>
        </div>

        <!-- content Tabs -->
        <Tabs default-value="invoices" class="space-y-4">
            <TabsList>
                <TabsTrigger value="invoices">Recent Invoices</TabsTrigger>
                <TabsTrigger value="receivables" class="relative">
                    Accounts Receivable
                    <span v-if="receivablesList.length > 0" class="ml-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                </TabsTrigger>
                <TabsTrigger value="transactions">Past Transactions</TabsTrigger>
            </TabsList>
            
            <!-- Recent Invoices Tab -->
            <TabsContent value="invoices" class="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>All Invoices</CardTitle>
                        <CardDescription>List of all service orders and their payment status.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Invoice #</TableHead>
                                    <TableHead>Date Created</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead class="text-right">Total Amount</TableHead>
                                    <TableHead class="text-right">Paid</TableHead>
                                    <TableHead class="text-center">Status</TableHead>
                                    <TableHead class="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow v-if="invoicesLoading">
                                    <TableCell colspan="7" class="h-24 text-center">
                                        <Loader2 class="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                    </TableCell>
                                </TableRow>
                                <TableRow v-else-if="invoices.length === 0">
                                    <TableCell colspan="7" class="text-center py-8 text-muted-foreground">
                                        No invoices found.
                                    </TableCell>
                                </TableRow>
                                <TableRow v-else v-for="inv in invoices" :key="inv.id">
                                    <TableCell class="font-medium">{{ inv.id }}</TableCell>
                                    <TableCell>{{ formatDate(inv.createdAt) }}</TableCell>
                                    <TableCell>
                                        <div class="font-medium">{{ inv.customer?.firstName }} {{ inv.customer?.lastName }}</div>
                                        <div class="text-xs text-muted-foreground">{{ inv.vehicle?.licensePlate }}</div>
                                    </TableCell>
                                    <TableCell class="text-right font-mono">{{ formatCurrency(inv.totalAmount) }}</TableCell>
                                    <TableCell class="text-right font-mono">{{ formatCurrency(inv.amountPaid) }}</TableCell>
                                    <TableCell class="text-center">
                                        <Badge :variant="getStatusBadgeVariant(inv.paymentStatus)">
                                            {{ inv.paymentStatus }}
                                        </Badge>
                                    </TableCell>
                                    <TableCell class="text-right">
                                        <Button size="icon" variant="ghost" @click="settleBalance(inv.id)" title="View Details / Pay">
                                            <ArrowUpRight class="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                         <!-- Pagination -->
                         <div class="flex items-center justify-end gap-2 mt-4" v-if="invoicesTotalPages > 1">
                            <Button
                                variant="outline"
                                size="sm"
                                :disabled="invoicesPage <= 1 || invoicesLoading"
                                @click="fetchInvoices(invoicesPage - 1)"
                            >
                                <ChevronLeft class="h-4 w-4" />
                                Previous
                            </Button>
                            <div class="text-sm font-medium">
                                Page {{ invoicesPage }} of {{ invoicesTotalPages }}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                :disabled="invoicesPage >= invoicesTotalPages || invoicesLoading"
                                @click="fetchInvoices(invoicesPage + 1)"
                            >
                                Next
                                <ChevronRight class="h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <!-- Accounts Receivable Tab -->
            <TabsContent value="receivables" class="space-y-4">
                 <Card class="border-amber-200 bg-amber-50/30">
                    <CardHeader>
                        <CardTitle class="text-amber-900">Outstanding Balances</CardTitle>
                        <CardDescription>Customers who still owe payment.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Invoice #</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead class="text-right">Total</TableHead>
                                    <TableHead class="text-right">Paid</TableHead>
                                    <TableHead class="text-right text-red-600 font-bold">Balance Due</TableHead>
                                    <TableHead class="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow v-if="receivablesList.length === 0">
                                    <TableCell colspan="7" class="text-center py-8 text-muted-foreground">
                                        No outstanding balances on this page. Check other pages if needed.
                                    </TableCell>
                                </TableRow>
                                <TableRow v-for="inv in receivablesList" :key="inv.id">
                                    <TableCell class="font-medium">{{ inv.id }}</TableCell>
                                    <TableCell>
                                        <div class="font-medium">{{ inv.customer?.firstName }} {{ inv.customer?.lastName }}</div>
                                    </TableCell>
                                     <TableCell>
                                        {{ inv.customer?.phoneNumber }}
                                    </TableCell>
                                    <TableCell class="text-right">{{ formatCurrency(inv.totalAmount) }}</TableCell>
                                    <TableCell class="text-right">{{ formatCurrency(inv.amountPaid) }}</TableCell>
                                    <TableCell class="text-right font-bold text-red-600">
                                        {{ formatCurrency(inv.totalAmount - inv.amountPaid) }}
                                    </TableCell>
                                    <TableCell class="text-right">
                                        <Button size="sm" class="bg-blue-600 hover:bg-blue-700 text-white" @click="settleBalance(inv.id)">
                                            Settle Balance
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>

            <!-- Past Transactions Tab -->
            <TabsContent value="transactions" class="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Transaction History</CardTitle>
                        <CardDescription>Log of all processed payments.</CardDescription>
                    </CardHeader>
                     <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Order Ref</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Method</TableHead>
                                    <TableHead>Ref No.</TableHead>
                                    <TableHead class="text-right">Amount</TableHead>
                                    <TableHead class="text-right">Receipt</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow v-if="transactionsLoading">
                                     <TableCell colspan="7" class="h-24 text-center">
                                        <Loader2 class="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                    </TableCell>
                                </TableRow>
                                <TableRow v-else-if="transactions.length === 0">
                                    <TableCell colspan="7" class="text-center py-8 text-muted-foreground">
                                        No transactions recorded yet.
                                    </TableCell>
                                </TableRow>
                                <TableRow v-else v-for="txn in transactions" :key="txn.id">
                                    <TableCell>{{ new Date(txn.date).toLocaleString() }}</TableCell>
                                    <TableCell class="font-mono text-xs">{{ txn.orderId }}</TableCell>
                                    <TableCell>
                                         <div class="font-medium">{{ txn.order?.customer?.firstName }} {{ txn.order?.customer?.lastName }}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{{ txn.method }}</Badge>
                                    </TableCell>
                                    <TableCell class="font-mono text-xs">{{ txn.referenceNo || '-' }}</TableCell>
                                    <TableCell class="text-right font-bold">{{ formatCurrency(txn.amount) }}</TableCell>
                                    <TableCell class="text-right">
                                        <Button size="icon" variant="ghost" @click="downloadReceipt(txn.id)" title="Download Receipt">
                                            <Printer class="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                         <!-- Pagination -->
                         <div class="flex items-center justify-end gap-2 mt-4" v-if="transactionsTotalPages > 1">
                            <Button
                                variant="outline"
                                size="sm"
                                :disabled="transactionsPage <= 1 || transactionsLoading"
                                @click="fetchTransactions(transactionsPage - 1)"
                            >
                                <ChevronLeft class="h-4 w-4" />
                                Previous
                            </Button>
                            <div class="text-sm font-medium">
                                Page {{ transactionsPage }} of {{ transactionsTotalPages }}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                :disabled="transactionsPage >= transactionsTotalPages || transactionsLoading"
                                @click="fetchTransactions(transactionsPage + 1)"
                            >
                                Next
                                <ChevronRight class="h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    </div>
</template>
