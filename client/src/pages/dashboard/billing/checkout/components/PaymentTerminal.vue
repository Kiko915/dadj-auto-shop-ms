<script setup>
import { Banknote, QrCode, AlertTriangle, Loader2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { formatCurrency } from '@/pages/dashboard/service-orders/utils'

const props = defineProps({
    amountToPay: [Number, String],
    currentBalance: Number,
    paymentMethod: String,
    cashTendered: [Number, String],
    referenceNumber: String,
    isSubmitting: Boolean,
    isValidAmount: Boolean,
    isPartial: Boolean,
    newRemainingBalance: Number,
    changeDue: Number,
    canProcess: Boolean
})

const emit = defineEmits([
    'update:amountToPay',
    'update:paymentMethod',
    'update:cashTendered',
    'update:referenceNumber',
    'process-payment'
])

const setExactAmount = () => {
    emit('update:cashTendered', props.amountToPay)
}

const addBill = (amount) => {
    emit('update:cashTendered', (Number(props.cashTendered) || 0) + amount)
}
</script>

<template>
    <div class="w-1/2 bg-white flex flex-col h-full overflow-y-auto custom-scrollbar">
        <div class="p-8 pt-12 max-w-xl mx-auto w-full flex flex-col justify-start">
            
            <div class="mb-8">
                <h2 class="text-xl font-bold text-slate-900 mb-1">Process Payment</h2>
                <p class="text-slate-500 text-sm">Select payment method and enter amount.</p>
            </div>

            <div class="space-y-8">
                
                <!-- 1. Amount to Pay -->
                <div class="space-y-3">
                    <label class="text-sm font-bold text-slate-700">How much is the customer paying?</label>
                    <div class="relative">
                        <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">₱</span>
                        <input 
                            type="number" 
                            :value="amountToPay"
                            @input="$emit('update:amountToPay', $event.target.value)"
                            :max="currentBalance"
                            min="0"
                            step="0.01"
                            class="flex h-16 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 pl-10 text-3xl font-bold ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            :class="{'border-red-500 focus-visible:ring-red-500': !isValidAmount}"
                        />
                    </div>
                    <div v-if="isValidAmount && isPartial" class="p-3 bg-amber-50 rounded-lg border border-amber-100 flex items-start gap-3">
                        <AlertTriangle class="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div class="text-sm text-amber-800">
                            <span class="font-bold">Partial Payment.</span> 
                            <span class="block mt-0.5 opacity-90">Remaining Balance will be <span class="font-bold font-mono">{{ formatCurrency(newRemainingBalance) }}</span></span>
                        </div>
                    </div>
                        <p v-if="!isValidAmount" class="text-sm text-red-600 font-medium mt-1">
                        Amount must be greater than 0 and not exceed balance.
                    </p>
                </div>

                <!-- 2. Method -->
                <div class="space-y-3">
                    <label class="text-sm font-bold text-slate-700">Payment Method</label>
                    <div class="grid grid-cols-2 gap-4">
                        <button 
                            class="relative flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all"
                            :class="paymentMethod === 'CASH' ? 'border-primary bg-primary/5 text-primary' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-slate-600'"
                            @click="$emit('update:paymentMethod', 'CASH')"
                        >
                            <Banknote class="w-6 h-6" />
                            <span class="font-bold">Cash</span>
                            <div v-if="paymentMethod === 'CASH'" class="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary ring-2 ring-white"></div>
                        </button>
                        <button 
                            class="relative flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all"
                            :class="paymentMethod === 'GCASH' ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-slate-600'"
                            @click="$emit('update:paymentMethod', 'GCASH')"
                        >
                            <img src="/logo/gcash-seeklogo-2.svg" class="w-auto h-6 object-contain" alt="GCash" />
                            <span class="font-bold">GCash</span>
                            <div v-if="paymentMethod === 'GCASH'" class="absolute top-2 right-2 h-2 w-2 rounded-full bg-blue-500 ring-2 ring-white"></div>
                        </button>
                    </div>
                </div>

                    <!-- 3. Dynamic Inputs -->
                    <div class="bg-slate-50 rounded-xl p-5 border border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
                    
                    <!-- CASH Logic -->
                    <div v-if="paymentMethod === 'CASH'" class="space-y-8">
                        
                        <!-- Amount Input -->
                        <div class="space-y-3">
                            <div class="flex justify-between items-end">
                                <label class="text-sm font-medium text-slate-700">Cash Received</label>
                                <span v-if="cashTendered > 0 && cashTendered < amountToPay" class="text-xs font-medium text-red-600">
                                    Short by {{ formatCurrency(amountToPay - cashTendered) }}
                                </span>
                            </div>
                            
                            <div class="relative">
                                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-lg">₱</span>
                                <input 
                                    type="number" 
                                    :value="cashTendered"
                                    @input="$emit('update:cashTendered', $event.target.value)"
                                    class="block w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-lg text-2xl font-bold text-slate-900 placeholder:text-slate-300 focus:border-slate-400 focus:ring-0 transition-colors outline-none"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                        
                        <!-- Denominations / Quick Add -->
                        <div class="space-y-3">
                            <label class="text-sm font-medium text-slate-700">Quick Select</label>
                            <div class="grid grid-cols-4 gap-3">
                                <button @click="setExactAmount" class="col-span-4 py-3 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 hover:border-slate-300 transition-all">
                                    Exact Amount
                                </button>
                                <button @click="addBill(20)" class="py-3 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-md hover:border-slate-400 hover:text-slate-900 transition-all">₱20</button>
                                <button @click="addBill(50)" class="py-3 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-md hover:border-slate-400 hover:text-slate-900 transition-all">₱50</button>
                                <button @click="addBill(100)" class="py-3 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-md hover:border-slate-400 hover:text-slate-900 transition-all">₱100</button>
                                <button @click="addBill(200)" class="py-3 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-md hover:border-slate-400 hover:text-slate-900 transition-all">₱200</button>
                                <button @click="addBill(500)" class="py-3 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-md hover:border-slate-400 hover:text-slate-900 transition-all">₱500</button>
                                <button @click="addBill(1000)" class="col-span-3 py-3 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-md hover:border-slate-400 hover:text-slate-900 transition-all">₱1,000</button>
                            </div>
                        </div>

                        <!-- Change Display -->
                        <div class="pt-6 border-t border-slate-100">
                            <div class="flex justify-between items-center p-4 bg-slate-50 rounded-lg border border-slate-100">
                                <span class="text-sm font-medium text-slate-600 uppercase tracking-wide">Change Due</span>
                                <span class="text-2xl font-bold font-mono text-slate-900">
                                    {{ formatCurrency(changeDue) }}
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- GCASH Logic -->
                    <div v-else class="space-y-4">
                        <Dialog>
                            <DialogTrigger as-child>
                                <button class="w-full p-4 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-xl text-sm font-medium flex gap-3 items-center justify-center transition-all group">
                                    <div class="h-8 w-8 bg-white rounded-lg flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                        <QrCode class="w-5 h-5 text-blue-600" />
                                    </div>
                                    <span>Click to Scan Shop QR Code</span>
                                </button>
                            </DialogTrigger>
                            <DialogContent class="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle>Scan to Pay</DialogTitle>
                                    <DialogDescription>
                                        Scan this QR code using your GCash app to pay.
                                    </DialogDescription>
                                </DialogHeader>
                                <div class="flex items-center justify-center p-4">
                                    <div class="relative rounded-xl overflow-hidden shadow-2xl border-4 border-white">
                                        <img src="/images/gcash-qr.jpg" alt="GCash QR Code" class="w-full max-w-[300px] h-auto object-contain" />
                                        
                                        <!-- Logo Overlay -->
                                        <div class="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 animate-in fade-in duration-1000 delay-500 fill-mode-forwards">
                                            <div class="bg-white/90 p-2 rounded-full shadow-lg backdrop-blur-sm">
                                                <img src="/logo/gcash-seeklogo-2.svg" class="h-6 w-auto" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="flex justify-center text-xs text-slate-500 font-medium uppercase tracking-widest">
                                    DADJ Auto Shop Official GCash
                                </div>
                            </DialogContent>
                        </Dialog>

                        <div class="space-y-2">
                            <label class="text-sm font-medium text-slate-700">Reference Number <span class="text-red-500">*</span></label>
                            <Input 
                                :value="referenceNumber"
                                @input="$emit('update:referenceNumber', $event.target.value)"
                                placeholder="Last 4 digits or Ref No." 
                                class="font-mono uppercase h-12 text-lg" 
                                maxlength="20" 
                            />
                            <p class="text-xs text-slate-500">Required: Enter the reference number from your receipt.</p>
                        </div>
                    </div>

                    </div>

            </div>

            <div class="mt-8">
                <Button 
                    size="lg" 
                    class="w-full h-14 text-base font-bold shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all" 
                    :disabled="!canProcess"
                    @click="$emit('process-payment')"
                >
                    <Loader2 v-if="isSubmitting" class="w-5 h-5 mr-2 animate-spin" />
                    <span v-else>Process Payment</span>
                </Button>
            </div>

        </div>
    </div>
</template>
