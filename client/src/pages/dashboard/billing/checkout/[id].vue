<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { Loader2, Lock } from 'lucide-vue-next'
import confetti from 'canvas-confetti'
import PrintPreviewModal from '@/components/payment/PrintPreviewModal.vue'
import { getServiceOrder } from '@/api/serviceOrders'
import api from '@/api'

// Sub-components
import InvoiceSummary from './components/InvoiceSummary.vue'
import PaymentTerminal from './components/PaymentTerminal.vue'
import PaymentSuccess from './components/PaymentSuccess.vue'
import PaymentFailed from './components/PaymentFailed.vue'
import GatePassTemplate from './components/GatePassTemplate.vue'

const route = useRoute()
const router = useRouter()
const orderId = route.params.orderId

// State
const loading = ref(true)
const isSubmitting = ref(false)
const order = ref(null)

const paymentMethod = ref('CASH') // CASH | GCASH
const amountToPay = ref(0)
const cashTendered = ref(0)
const referenceNumber = ref('')

// Print Preview State
const showPrintPreview = ref(false)
const previewTitle = ref('')
const previewMode = ref('RECEIPT')
const previewTargetId = ref('')
const previewFileName = ref('')
const printingMode = ref('RECEIPT') // RECEIPT | GATE_PASS

// Payment Result State
const paymentResult = ref('IDLE') // IDLE | SUCCESS | FAILED
const errorMessage = ref('')

// Computed
const currentBalance = computed(() => {
    if (!order.value) return 0
    return Number(order.value.totalAmount) - Number(order.value.amountPaid || 0)
})

const newRemainingBalance = computed(() => {
    const pay = Number(amountToPay.value) || 0
    return Math.max(0, currentBalance.value - pay)
})

const changeDue = computed(() => {
    if (paymentMethod.value !== 'CASH') return 0
    const tender = Number(cashTendered.value) || 0
    const pay = Number(amountToPay.value) || 0
    return Math.max(0, tender - pay)
})

const isPartial = computed(() => {
    const pay = Number(amountToPay.value) || 0
    return pay < currentBalance.value && pay > 0
})

const isValidAmount = computed(() => {
    const pay = Number(amountToPay.value) || 0
    return pay > 0 && pay <= currentBalance.value
})

const canProcess = computed(() => {
    if (!isValidAmount.value) return false
    if (isSubmitting.value) return false
    
    if (paymentMethod.value === 'CASH') {
        return Number(cashTendered.value) >= Number(amountToPay.value)
    }
    
    if (paymentMethod.value === 'GCASH') {
        return referenceNumber.value.length >= 6
    }
    
    return false
})

// Methods
const fetchOrder = async () => {
    loading.value = true
    try {
        const data = await getServiceOrder(orderId)
        
        if (data.status !== 'COMPLETED') {
             toast.error(`Order #${data.id} is not ready for payment. Status: ${data.status}`)
             router.replace('/dashboard/service-orders')
             return
        }

        const remaining = Number(data.totalAmount) - Number(data.amountPaid || 0)
        
        if (remaining <= 0 || data.paymentStatus === 'PAID') {
             toast.success(`Order #${data.id} is already fully paid.`)
             router.replace('/dashboard/service-orders')
             return
        }

        order.value = data
        amountToPay.value = remaining
        loading.value = false
    } catch (error) {
        console.error('Failed to fetch order', error)
        toast.error('Failed to load order details')
        router.push('/dashboard/service-orders')
    }
}

const handleProcessPayment = async () => {
    if (!canProcess.value) return
    
    isSubmitting.value = true
    errorMessage.value = ''
    
    try {
        const payload = {
            orderId,
            amount: Number(amountToPay.value),
            method: paymentMethod.value,
            referenceNo: referenceNumber.value
        }
        
        await api.post('/payments', payload)

        order.value.amountPaid = Number(order.value.amountPaid || 0) + Number(amountToPay.value)
        
        paymentResult.value = 'SUCCESS'
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#10b981', '#3b82f6', '#f59e0b']
        })
        toast.success('Payment processed successfully')
    } catch (error) {
        console.error(error)
        errorMessage.value = error.response?.data?.error || 'Unknown error occurred'
        paymentResult.value = 'FAILED'
        toast.error('Payment failed')
    } finally {
        isSubmitting.value = false
    }
}

const finishTransaction = () => {
    router.push('/dashboard/service-orders') 
}

const printReceipt = () => {
    printingMode.value = 'RECEIPT'
    previewTitle.value = 'Official Receipt'
    previewMode.value = 'RECEIPT'
    previewTargetId.value = 'invoice-receipt-summary'
    previewFileName.value = `Invoice-${order.value?.id}`
    showPrintPreview.value = true
}

const printGatePass = () => {
    printingMode.value = 'GATE_PASS'
    previewTitle.value = 'Gate Pass'
    previewMode.value = 'GATE_PASS'
    previewTargetId.value = 'gate-pass-print'
    previewFileName.value = `GatePass-${order.value?.id}`
    showPrintPreview.value = true
}

onMounted(() => {
    fetchOrder()
})
</script>

<template>
    <div class="relative flex flex-col rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white sm:h-[calc(100vh-8rem)]">
        
        <!-- Enhanced Loading State -->
        <div v-if="loading" class="absolute inset-0 z-50 bg-slate-50 flex flex-col items-center justify-center p-4">
            <div class="flex flex-col items-center max-w-md text-center space-y-6 animate-in fade-in zoom-in duration-300">
                <div class="relative">
                    <div class="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-20"></div>
                    <div class="relative h-20 w-20 bg-white rounded-2xl shadow-xl shadow-emerald-500/10 flex items-center justify-center border border-emerald-100">
                        <Loader2 class="w-10 h-10 text-emerald-500 animate-spin absolute" />
                        <div class="z-10 bg-white rounded-full p-2">
                            <Lock class="w-6 h-6 text-emerald-600" />
                        </div>
                    </div>
                </div>
                <div class="space-y-2">
                    <h2 class="text-xl font-bold text-slate-900 tracking-tight">Loading Secure Checkout Page</h2>
                    <p class="text-sm text-slate-500 font-medium">Establishing secure connection...</p>
                </div>
                <p class="text-xs text-slate-400 pt-8 animate-pulse">Running final security checks...</p>
            </div>
        </div>

        <div v-else class="flex flex-col sm:flex-row sm:h-full overflow-y-auto sm:overflow-hidden">
            
            <!-- Left: Invoice Summary -->
            <InvoiceSummary 
                :order="order"
                :orderId="orderId"
                :currentBalance="currentBalance"
                :printingMode="printingMode"
            />

            <!-- Right: Payment Terminal -->
            <PaymentTerminal 
                v-if="paymentResult === 'IDLE'"
                v-model:amountToPay="amountToPay"
                v-model:paymentMethod="paymentMethod"
                v-model:cashTendered="cashTendered"
                v-model:referenceNumber="referenceNumber"
                :currentBalance="currentBalance"
                :isSubmitting="isSubmitting"
                :isValidAmount="isValidAmount"
                :isPartial="isPartial"
                :newRemainingBalance="newRemainingBalance"
                :changeDue="changeDue"
                :canProcess="canProcess"
                @process-payment="handleProcessPayment"
            />

            <!-- Success View -->
            <PaymentSuccess 
                v-else-if="paymentResult === 'SUCCESS'"
                :amountToPay="amountToPay"
                :paymentMethod="paymentMethod"
                :referenceNumber="referenceNumber"
                :currentBalance="currentBalance"
                @print-receipt="printReceipt"
                @print-gate-pass="printGatePass"
                @finish="finishTransaction"
            />

            <!-- Failed View -->
            <PaymentFailed 
                v-else-if="paymentResult === 'FAILED'"
                :errorMessage="errorMessage"
                @retry="paymentResult = 'IDLE'"
                @cancel="router.back()"
            />

            <!-- Gate Pass Template -->
            <GatePassTemplate 
                :order="order" 
                :orderId="orderId" 
            />

        </div>
    </div>

    <PrintPreviewModal 
        v-model:isOpen="showPrintPreview"
        :title="previewTitle"
        :mode="previewMode"
        :targetId="previewTargetId"
        :fileName="previewFileName"
    />
</template>

<style scoped>
/* Chrome, Safari, Edge, Opera */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  appearance: none;
  margin: 0;
}

/* Firefox */
input[type=number] {
  -moz-appearance: textfield;
  appearance: textfield;
}

@media print {
    /* Global Print Resets */
    body {
        visibility: hidden;
    }
    
    /* Show Invoice Summary (Receipt) */
    .print\:w-full, 
    .print\:w-full * {
        visibility: visible;
    }

    .print\:w-full {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        background: white !important;
        z-index: 9999 !important;
    }

    /* Hide everything else explicitly if needed */
    .no-print, .print\:hidden {
        display: none !important;
    }
    
    /* Layout Adjustments */
    .h-screen, .h-full, .overflow-hidden {
        height: auto !important;
        overflow: visible !important;
    }
}
</style>
