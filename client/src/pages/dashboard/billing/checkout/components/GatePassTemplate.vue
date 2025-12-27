<script setup>
import { formatDate } from '@/pages/dashboard/service-orders/utils'

defineProps({
    order: Object,
    orderId: String
})
</script>

<template>
    <div id="gate-pass-print" class="fixed top-0 left-0 -z-50 opacity-0 pointer-events-none print:static print:z-auto print:opacity-100 print:block print:w-full p-8">
        <div class="border-4 border-slate-900 p-8 flex flex-col items-center text-center space-y-6">
            <h1 class="text-4xl font-black uppercase tracking-widest text-slate-900">Gate Pass</h1>
            <div class="h-1 w-32 bg-slate-900"></div>
            
            <div class="space-y-2">
                <p class="text-sm font-bold uppercase tracking-wider text-slate-500">Service Order</p>
                <p class="text-3xl font-mono font-bold text-slate-900">#{{ orderId }}</p>
            </div>

            <div class="grid grid-cols-2 gap-12 text-left w-full max-w-lg border-t border-b border-slate-200 py-8 my-8">
                <div>
                    <span class="block text-xs font-bold uppercase text-slate-500">Vehicle</span>
                    <span class="text-xl font-bold text-slate-900">{{ order?.vehicle?.make }} {{ order?.vehicle?.model }}</span>
                </div>
                <div>
                    <span class="block text-xs font-bold uppercase text-slate-500">Plate Number</span>
                    <span class="text-xl font-mono font-bold text-slate-900">{{ order?.vehicle?.plateNumber }}</span>
                </div>
                <div>
                    <span class="block text-xs font-bold uppercase text-slate-500">Customer</span>
                    <span class="text-base font-bold text-slate-900">{{ order?.customer?.firstName }} {{ order?.customer?.lastName }}</span>
                </div>
                <div>
                    <span class="block text-xs font-bold uppercase text-slate-500">Date Released</span>
                    <span class="text-base font-bold text-slate-900">{{ formatDate(new Date()) }}</span>
                </div>
            </div>

            <div class="pt-12 w-full flex justify-between items-end">
                <div class="text-center">
                    <div class="h-px w-48 bg-slate-900 mb-2"></div>
                    <span class="text-xs font-bold uppercase">Authorized Signature</span>
                </div>
                <div class="text-center">
                    <div class="h-px w-48 bg-slate-900 mb-2"></div>
                    <span class="text-xs font-bold uppercase">Guard on Duty</span>
                </div>
            </div>
                <p class="text-[10px] text-slate-400 font-medium uppercase tracking-widest mt-8">DADJ Auto Shop Management System</p>
        </div>
    </div>
</template>
