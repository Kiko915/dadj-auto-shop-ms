<script setup>
import { CheckCircle2, Receipt, AlertTriangle } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/pages/dashboard/service-orders/utils'

defineProps({
    amountToPay: [Number, String],
    paymentMethod: String,
    referenceNumber: String,
    currentBalance: Number
})

defineEmits(['print-receipt', 'print-gate-pass', 'finish'])
</script>

<template>
    <div class="w-1/2 bg-white flex flex-col items-center justify-center h-full p-8 space-y-8 animate-in slide-in-from-right duration-500">
        <div class="h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 class="h-10 w-10 text-emerald-600 animate-in zoom-in duration-500" />
        </div>
        
        <div class="text-center space-y-2">
            <h2 class="text-3xl font-black text-slate-900 tracking-tight">Payment Successful!</h2>
            <p class="text-slate-500 text-lg">Transaction has been recorded.</p>
        </div>

        <Card class="w-full max-w-sm border-slate-200 shadow-sm bg-slate-50/50">
            <CardContent class="p-6 space-y-4">
                <div class="flex justify-between text-sm">
                    <span class="text-slate-500">Amount Paid</span>
                    <span class="font-bold font-mono text-slate-900">{{ formatCurrency(amountToPay) }}</span>
                </div>
                <div class="flex justify-between text-sm">
                    <span class="text-slate-500">Payment Method</span>
                    <span class="font-medium text-slate-900">{{ paymentMethod }}</span>
                </div>
                    <div class="flex justify-between text-sm" v-if="referenceNumber">
                    <span class="text-slate-500">Reference No.</span>
                    <span class="font-mono text-slate-900">{{ referenceNumber }}</span>
                </div>
                    <div class="flex justify-between text-sm border-t border-slate-200 pt-3 mt-3">
                    <span class="font-bold text-slate-700">Remaining Balance</span>
                    <span class="font-bold font-mono text-slate-900">{{ formatCurrency(currentBalance) }}</span>
                </div>
            </CardContent>
        </Card>

        <div class="grid grid-cols-2 gap-4 w-full max-w-sm">
            <Button variant="outline" class="h-12" @click="$emit('print-receipt')">
                <Receipt class="w-4 h-4 mr-2" />
                Print Receipt
            </Button>
            <div class="relative">
                <Button variant="outline" class="h-12 w-full opacity-70 cursor-not-allowed" disabled>
                    <img src="/logo/primary_logo.png" class="w-4 h-4 mr-2 object-contain grayscale" />
                    Gate Pass
                </Button>
                <Badge class="absolute -top-2 -right-2 bg-slate-800 text-white text-[10px] pointer-events-none hover:bg-slate-800">
                    Coming Soon
                </Badge>
            </div>
            <Button class="col-span-2 h-12" @click="$emit('finish')">
                Done
            </Button>
        </div>
        
        <p v-if="currentBalance > 0" class="text-xs text-center text-amber-600 bg-amber-50 px-4 py-2 rounded-lg border border-amber-100">
            <AlertTriangle class="w-3 h-3 inline mr-1" />
            Gate pass is only available for fully paid orders.
        </p>
    </div>
</template>
