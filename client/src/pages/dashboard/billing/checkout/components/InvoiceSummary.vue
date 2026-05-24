<script setup>
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, CheckCircle2, Receipt } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { formatCurrency, formatDate } from '@/pages/dashboard/service-orders/utils'

const props = defineProps({
    order: Object,
    orderId: String,
    currentBalance: Number,
    printingMode: {
        type: String,
        default: 'RECEIPT'
    }
})

const router = useRouter()
</script>

<template>
    <div class="w-full sm:w-1/2 border-b sm:border-b-0 sm:border-r bg-slate-100/50 flex flex-col overflow-hidden relative">

        <!-- ── Mobile: Compact Summary Card ────────────────────────── -->
        <div class="sm:hidden bg-white" v-if="order">
            <!-- Top bar -->
            <div class="flex items-center justify-between px-4 py-3 border-b">
                <button @click="router.back()" class="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors">
                    <ArrowLeft class="w-4 h-4" />
                    Back
                </button>
                <div class="flex items-center gap-1.5">
                    <Receipt class="w-3.5 h-3.5 text-slate-400" />
                    <span class="text-xs font-mono text-slate-400 truncate max-w-[120px]">#{{ orderId }}</span>
                </div>
            </div>

            <div class="p-4 space-y-3">
                <!-- Customer & Vehicle -->
                <div class="flex items-start justify-between gap-2">
                    <div>
                        <p class="font-bold text-slate-900">{{ order.customer?.firstName }} {{ order.customer?.lastName }}</p>
                        <p class="text-xs text-muted-foreground">{{ order.vehicle?.make }} {{ order.vehicle?.model }}</p>
                    </div>
                    <Badge variant="secondary" class="font-mono text-[10px] shrink-0">{{ order.vehicle?.licensePlate }}</Badge>
                </div>

                <!-- Items compact list -->
                <div class="border rounded-lg bg-slate-50 overflow-hidden">
                    <div class="max-h-32 overflow-y-auto divide-y divide-slate-100">
                        <div v-for="item in order?.items" :key="item.id" class="flex items-center justify-between px-3 py-2 text-xs">
                            <div class="min-w-0">
                                <p class="font-medium text-slate-700 truncate">{{ item.name }}</p>
                                <p class="text-slate-400">{{ item.type }} × {{ item.quantity }}</p>
                            </div>
                            <span class="font-mono font-semibold text-slate-900 shrink-0 ml-3">{{ formatCurrency(item.total) }}</span>
                        </div>
                    </div>
                </div>

                <!-- Subtotals -->
                <div class="space-y-1 text-xs text-slate-500">
                    <div class="flex justify-between">
                        <span>Labor</span>
                        <span class="font-mono">{{ formatCurrency(order?.laborTotal || 0) }}</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Parts</span>
                        <span class="font-mono">{{ formatCurrency(order?.partsTotal || 0) }}</span>
                    </div>
                    <div v-if="order?.discount > 0" class="flex justify-between text-red-500">
                        <span>Discount{{ order.discountReason ? ` (${order.discountReason})` : '' }}</span>
                        <span class="font-mono">- {{ formatCurrency(order.discount) }}</span>
                    </div>
                    <div v-if="order?.amountPaid > 0" class="flex justify-between text-emerald-600">
                        <span class="flex items-center gap-1"><CheckCircle2 class="w-3 h-3" /> Paid</span>
                        <span class="font-mono">- {{ formatCurrency(order.amountPaid) }}</span>
                    </div>
                </div>

                <!-- Balance Due pill -->
                <div class="flex items-center justify-between bg-slate-900 rounded-xl px-4 py-3 text-white">
                    <span class="text-sm font-semibold">Balance Due</span>
                    <span class="text-2xl font-black font-mono tracking-tight">{{ formatCurrency(currentBalance) }}</span>
                </div>
            </div>
        </div>

        <!-- ── Desktop: Full Paper Invoice ─────────────────────────── -->
        <!-- Kept in DOM on mobile (display:none) so PrintPreviewModal can still target it -->
        <div class="hidden sm:flex p-8 pb-10 flex-1 overflow-y-auto custom-scrollbar flex-col items-center">

            <div id="invoice-receipt-summary" :class="{ 'print:hidden': printingMode !== 'RECEIPT' }" class="w-full max-w-[500px] bg-white shadow-2xl shadow-slate-200/50 rounded-none sm:rounded-md min-h-full flex flex-col relative flex-shrink-0 print:shadow-none print:w-full">

                <!-- Decorative Top Bar -->
                <div class="h-2 w-full bg-gradient-to-r from-primary to-primary/80"></div>

                <!-- Header -->
                <div class="p-8 pb-6 border-b border-slate-100">
                    <div class="flex justify-between items-start mb-8">
                        <div class="flex items-center gap-4">
                            <img src="/logo/symbol_w_wordmark_primary.png" alt="Logo" class="h-12 w-auto object-contain" />
                            <div class="h-8 w-px bg-slate-200 mx-2"></div>
                            <div>
                                <h1 class="text-lg font-bold tracking-tight text-slate-900 leading-none">INVOICE</h1>
                                <p class="text-[10px] text-slate-400 mt-0.5 font-medium tracking-wider uppercase">Invoice ID: {{ orderId }}</p>
                            </div>
                        </div>
                        <div class="text-right">
                            <p class="text-xs text-slate-400 font-medium uppercase tracking-wider">Date Issued</p>
                            <p class="text-sm font-bold text-slate-900">{{ formatDate(new Date()) }}</p>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-8 text-sm" v-if="order">
                        <div class="space-y-1">
                            <p class="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Bill To</p>
                            <p class="font-bold text-slate-800">{{ order.customer?.firstName }} {{ order.customer?.lastName }}</p>
                            <p class="text-slate-500 text-xs">{{ order.customer?.phoneNumber }}</p>
                        </div>
                        <div class="space-y-1 text-right">
                            <p class="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Vehicle Details</p>
                            <p class="font-bold text-slate-800">{{ order.vehicle?.make }} {{ order.vehicle?.model }}</p>
                            <Badge variant="secondary" class="font-mono text-[10px] h-5 px-1.5">{{ order.vehicle?.licensePlate }}</Badge>
                        </div>
                    </div>
                </div>

                <!-- Items Table -->
                <div class="flex-1">
                    <table class="w-full text-sm text-slate-600">
                        <thead class="bg-slate-50 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-400">
                            <tr>
                                <th class="text-left py-3 px-8 font-medium">Item Description</th>
                                <th class="text-right py-3 px-8 font-medium w-24">Amount</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-50">
                            <tr v-for="item in order?.items" :key="item.id" class="group hover:bg-slate-50/50 transition-colors">
                                <td class="py-3 px-8 align-top">
                                    <p class="font-medium text-slate-700 group-hover:text-slate-900 transition-colors">{{ item.name }}</p>
                                    <p class="text-[10px] text-slate-400 mt-0.5">
                                        {{ item.type }} × {{ item.quantity }} @ {{ formatCurrency(item.price) }}
                                    </p>
                                </td>
                                <td class="py-3 px-8 text-right font-mono text-slate-700 align-top pt-3">
                                    {{ formatCurrency(item.total) }}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Summary Footer -->
                <div class="bg-slate-50 p-8 pt-6 border-t border-slate-100">
                    <div class="space-y-3">
                        <div class="flex justify-between text-sm">
                            <span class="text-slate-500 font-medium">Labor Subtotal</span>
                            <span class="font-mono text-slate-700">{{ formatCurrency(order?.laborTotal || 0) }}</span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span class="text-slate-500 font-medium">Parts & Materials</span>
                            <span class="font-mono text-slate-700">{{ formatCurrency(order?.partsTotal || 0) }}</span>
                        </div>
                        <div v-if="order?.discount > 0" class="flex justify-between text-sm text-red-500">
                            <span class="font-medium">Discount {{ order.discountReason ? `(${order.discountReason})` : '' }}</span>
                            <span class="font-mono font-medium">- {{ formatCurrency(order?.discount || 0) }}</span>
                        </div>
                        <Separator class="my-2" />
                        <div class="flex justify-between items-center">
                            <span class="text-slate-900 font-bold">Total Amount</span>
                            <span class="font-mono text-lg font-bold text-slate-900">{{ formatCurrency(order?.totalAmount || 0) }}</span>
                        </div>
                        <div v-if="order?.amountPaid > 0" class="flex justify-between items-center text-emerald-600 text-sm">
                            <span class="font-medium flex items-center gap-1">
                                <CheckCircle2 class="w-3.5 h-3.5" /> Paid so far
                            </span>
                            <span class="font-mono font-bold">- {{ formatCurrency(order.amountPaid) }}</span>
                        </div>
                        <div class="mt-4 pt-4 border-t border-slate-200 border-dashed">
                            <div class="flex justify-between items-end">
                                <span class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Total Due Now</span>
                                <span class="font-mono text-2xl font-black text-slate-900 tracking-tight">{{ formatCurrency(currentBalance) }}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Bottom Branding -->
                <div class="bg-slate-900 px-8 py-3 text-center">
                    <p class="text-[10px] text-slate-500 font-medium tracking-widest uppercase">DADJ Auto Shop Management System</p>
                </div>

            </div>

            <div class="mt-6">
                <Button variant="ghost" class="text-slate-400 hover:text-slate-600" @click="router.back()">
                    <ArrowLeft class="w-4 h-4 mr-2" />
                    Cancel Transaction
                </Button>
            </div>

        </div>

    </div>
</template>
