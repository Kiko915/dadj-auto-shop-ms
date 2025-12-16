<template>
  <div class="min-h-screen bg-slate-50 relative overflow-hidden flex flex-col items-center justify-center p-4">
    
    <!-- Decorative Background -->
    <div class="absolute inset-0 z-0 opacity-40">
        <div class="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-[100px]"></div>
        <div class="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-50/50 rounded-full blur-[100px]"></div>
    </div>

    <!-- State A: Search Form -->
    <div v-if="!trackingResult" class="w-full max-w-md relative z-10 transition-all duration-500 ease-out">
      
      <!-- Logo Header -->
      <div class="text-center mb-8">
        <div class="flex justify-center mb-6">
            <!-- Glow effect behind logo -->
            <div class="relative">
                <div class="absolute -inset-4 bg-blue-500/20 blur-xl rounded-full opacity-50"></div>
                <img src="/logo/symbol_w_wordmark_primary.png" alt="Auto Shop" class="relative h-14 w-auto drop-shadow-sm" />
            </div>
        </div>
        <h1 class="text-3xl font-bold text-slate-900 tracking-tight">Track Your Repair</h1>
        <p class="text-slate-500 mt-2 text-base">Check the real-time status of your vehicle.</p>
      </div>

      <!-- Search Card -->
      <div class="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-200/50 p-8 border border-white/50">
        <form @submit.prevent="handleSearch" class="space-y-6">
          
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Order Reference</label>
            <div class="relative">
                <input 
                v-model="searchForm.orderId"
                type="text" 
                placeholder="e.g. clq3..."
                class="w-full pl-4 pr-4 py-3.5 bg-slate-50 rounded-xl border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400 text-slate-800 font-medium"
                required
                />
            </div>
          </div>

          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Plate Number</label>
            <input 
              v-model="searchForm.plateNumber"
              type="text" 
              placeholder="e.g. ABC 1234"
              class="w-full pl-4 pr-4 py-3.5 bg-slate-50 rounded-xl border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400 text-slate-800 font-medium uppercase tracking-widest"
              required
            />
          </div>

          <!-- Error Alert -->
          <div v-if="error" class="bg-red-50 text-red-600 text-sm p-4 rounded-xl flex items-center gap-3 animate-shake">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            <span class="font-medium">{{ error }}</span>
          </div>

          <button 
            type="submit" 
            :disabled="isLoading"
            class="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg shadow-slate-900/10 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 overflow-hidden relative group"
          >
            <!-- Shinny gradient overlap -->
            <div class="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
            
            <span v-if="isLoading" class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            <span v-else class="flex items-center gap-2">
                Track Vehicle
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
            </span>
          </button>

          <p class="text-xs text-center text-slate-400 font-medium">
            Check your receipt or Email for the Reference ID.
          </p>
        </form>
      </div>
    </div>

    <!-- State B: Tracking Result -->
    <div v-else class="w-full max-w-lg relative z-10 animate-fade-in-up">
      
      <!-- Back Button -->
      <button @click="resetSearch" class="group flex items-center text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors mb-6 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-lg self-start">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Search
      </button>

      <!-- Main Result Card -->
      <div class="bg-white rounded-3xl shadow-2xl shadow-slate-200/50 overflow-hidden border border-slate-100">
        
        <!-- Header Section -->
        <div class="bg-slate-900 p-8 text-white relative overflow-hidden">
            <!-- Background Pattern -->
            <div class="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            
            <div class="relative z-10 flex justify-between items-start">
                <div>
                     <p class="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Vehicle</p>
                    <h2 class="text-3xl font-bold tracking-tight">{{ trackingResult.vehicle.make }} <span class="text-blue-400">{{ trackingResult.vehicle.model }}</span></h2>
                    <div class="flex items-center gap-2 mt-2 bg-white/10 w-fit px-3 py-1 rounded-full border border-white/5">
                        <span class="text-sm font-mono tracking-widest text-slate-200">{{ trackingResult.vehicle.maskedPlate }}</span>
                    </div>
                </div>
                <!-- Status Badge -->
                 <div :class="statusBadgeClass" class="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide shadow-lg border-2 border-transparent">
                    {{ trackingResult.status.replace('_', ' ') }}
                </div>
            </div>

             <!-- Info Grid -->
            <div class="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                 <!-- Estimated Completion -->
                 <div class="flex items-center gap-4 text-sm bg-slate-800/50 p-4 rounded-xl border border-white/5 backdrop-blur-md">
                    <div class="p-2.5 bg-blue-500/20 text-blue-400 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <p class="text-slate-400 text-xs uppercase font-bold tracking-wider">Estimated Completion</p>
                        <p class="font-bold text-white text-lg">
                            {{ formatDateTime(trackingResult.estimatedCompletion) || 'To Be Determined' }}
                        </p>
                    </div>
                 </div>

                 <!-- Payment Status -->
                 <div class="flex items-center gap-4 text-sm bg-slate-800/50 p-4 rounded-xl border border-white/5 backdrop-blur-md">
                    <div class="p-2.5 rounded-lg" :class="trackingResult.paymentStatus === 'PAID' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'">
                        <svg v-if="trackingResult.paymentStatus === 'PAID'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                         <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <p class="text-slate-400 text-xs uppercase font-bold tracking-wider">Payment Status</p>
                        <p class="font-bold text-lg" :class="trackingResult.paymentStatus === 'PAID' ? 'text-emerald-400' : 'text-rose-400'">
                            {{ trackingResult.paymentStatus }}
                        </p>
                    </div>
                 </div>
            </div>
        </div>

        <!-- Banner Messages -->
        <div v-if="trackingResult.status === 'COMPLETED'" class="bg-emerald-50 border-b border-emerald-100 p-5 flex items-center gap-4">
            <div class="bg-emerald-100 rounded-full p-2 text-emerald-600">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                 </svg>
            </div>
            <div>
                <p class="text-emerald-900 font-bold">Ready for pickup!</p>
                <p class="text-emerald-700 text-sm">
                    {{ trackingResult.paymentStatus === 'PAID' ? 'Total Paid:' : 'Total Due:' }} 
                    <span class="font-bold font-mono text-lg">{{ formatCurrency(trackingResult.totalAmount) }}</span>
                </p>
            </div>
        </div>
        <div v-else-if="trackingResult.status === 'IN_PROGRESS'" class="bg-blue-50 border-b border-blue-100 p-5 flex items-center gap-4">
             <div class="bg-blue-100 rounded-full p-2 text-blue-600 animate-pulse">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
            </div>
            <p class="text-blue-900 font-medium">Technicians are currently working on your vehicle.</p>
        </div>

        <!-- Timeline Steps -->
        <div class="p-8 bg-white">
             <div class="relative pl-4 space-y-8 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                <div v-for="(step, index) in steps" :key="index" class="relative pl-8">
                     <!-- Dot -->
                     <div 
                        class="absolute left-0 top-1 w-7 h-7 rounded-full border-4 transition-all duration-500 z-10"
                        :class="getStepDotClass(index)"
                    >
                         <div v-if="currentStepIndex === index" class="absolute inset-0 rounded-full animate-ping bg-blue-500 opacity-20 transform scale-150"></div>
                     </div>

                     <!-- Content -->
                     <div :class="currentStepIndex >= index ? 'opacity-100' : 'opacity-40 grayscale'">
                        <h4 class="text-sm font-bold text-slate-900 uppercase tracking-wide">{{ step.title }}</h4>
                        <p class="text-sm text-slate-500 mt-1 leading-relaxed">{{ step.description }}</p>
                    </div>
                </div>
             </div>
        </div>

        <!-- Support Actions -->
        <div class="bg-slate-50 p-6 border-t border-slate-100">
             <button class="w-full bg-white border border-slate-200 text-slate-700 font-bold py-3.5 rounded-xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Call Support
             </button>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import api from '@/api'

const searchForm = ref({
    orderId: '',
    plateNumber: ''
})

const trackingResult = ref(null)
const error = ref('')
const isLoading = ref(false)

const steps = [
    { title: 'Order Received', description: 'We have received your vehicle and details.' },
    { title: 'Work in Progress', description: 'Technicians are actively performing the repairs.' },
    { title: 'Ready for Pickup', description: 'Final quality check complete. Come get your car!' }
]

const currentStepIndex = computed(() => {
    if (!trackingResult.value) return 0
    const s = trackingResult.value.status
    if (s === 'COMPLETED') return 2
    if (s === 'IN_PROGRESS') return 1 
    if (s === 'PENDING') return 0
    if (s === 'CANCELLED') return -1
    return 0
})

const getSafeErrorMessage = (error) => {
    if (!error.response) return 'Unable to connect to server. Please try again.';
    
    // Whitelist status codes to safe messages
    switch (error.response.status) {
        case 404:
            return 'Service Order not found. Please check your Reference ID and Plate Number.';
        case 429:
            return 'Too many attempts. Please wait a minute before trying again.';
        case 400:
            return 'Please provide both Order Reference and Plate Number.';
        case 500:
            return 'System error. Please try again later.';
        default:
            return 'An unexpected error occurred. Please contact support.';
    }
}

const handleSearch = async () => {
    error.value = ''
    isLoading.value = true
    try {
        const { data } = await api.get('/public/track-order', {
            params: {
                orderId: searchForm.value.orderId,
                plateNumber: searchForm.value.plateNumber
            }
        })
        trackingResult.value = data
    } catch (e) {
        // Safe error handling with no direct rendering of API text
        error.value = getSafeErrorMessage(e)
    } finally {
        isLoading.value = false
    }
}

const resetSearch = () => {
    trackingResult.value = null
    searchForm.value = { orderId: '', plateNumber: '' }
}

// Visual Helpers
const statusBadgeClass = computed(() => {
    if (!trackingResult.value) return ''
    const s = trackingResult.value.status
    switch(s) {
        case 'COMPLETED': return 'bg-emerald-500 text-white shadow-emerald-200'
        case 'IN_PROGRESS': return 'bg-blue-500 text-white shadow-blue-200'
        case 'PENDING': return 'bg-amber-400 text-white shadow-amber-200'
        default: return 'bg-slate-200 text-slate-600'
    }
})

const getStepDotClass = (index) => {
    if (currentStepIndex.value > index) {
        return 'bg-emerald-500 border-white shadow-sm ring-1 ring-emerald-100' // Completed
    } else if (currentStepIndex.value === index) {
        return 'bg-blue-600 border-white shadow-lg ring-2 ring-blue-100' // Current
    } else {
        return 'bg-slate-100 border-white ring-1 ring-slate-100' // Future
    }
}

const formatDateTime = (dateStr) => {
    if (!dateStr) return null
    return new Date(dateStr).toLocaleString('en-US', {
        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
    })
}

const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val)
}
</script>

<style scoped>
@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}
.animate-shimmer {
  animation: shimmer 1.5s infinite;
}

.animate-fade-in-up {
  animation: fadeInUp 0.5s ease-out;
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.animate-shake {
    animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
}

@keyframes shake {
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  20%, 80% { transform: translate3d(2px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
  40%, 60% { transform: translate3d(4px, 0, 0); }
}
</style>
