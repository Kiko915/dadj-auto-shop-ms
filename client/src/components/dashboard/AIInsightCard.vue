<template>
  <div class="w-full bg-white border border-gray-100 border-l-4 border-l-primary rounded-r-lg shadow-sm p-5 mb-6 transition-all animate-in fade-in slide-in-from-top-2 duration-700">
    
    <!-- Loading State -->
    <div v-if="isAnalyzing" class="flex items-center gap-4 py-2">
      <div class="relative">
         <div class="absolute inset-0 bg-primary/20 rounded-full animate-ping opacity-75"></div>
         <div class="relative bg-white p-2 rounded-full border border-primary/20 shadow-sm">
             <RefreshCw class="w-5 h-5 text-primary animate-spin" />
         </div>
      </div>
      <div class="space-y-1">
          <p class="text-sm font-medium text-primary">AI is analyzing shop performance...</p>
          <p class="text-xs text-primary/80 animate-pulse">Generating insights from live data</p>
      </div>
    </div>

    <!-- Content State -->
    <div v-else class="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div class="flex gap-4">
            <div class="mt-1 bg-primary/10 p-2 rounded-lg border border-primary/20 flex-shrink-0 self-start">
               <Sparkles class="w-5 h-5 text-primary" />
            </div>
            <div class="space-y-2">
                <h3 class="text-sm font-semibold text-primary uppercase tracking-wide flex items-center gap-2">
                    Daily Intelligent Briefing
                    <span class="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold">BETA</span>
                </h3>
                <div class="prose prose-sm text-slate-600 max-w-none leading-relaxed">
                   <p v-if="insight">{{ insight }}</p>
                   <p v-else class="text-muted-foreground italic">Unable to generate insight at this time.</p>
                </div>
            </div>
        </div>
        
        <div class="flex items-center self-end md:self-center flex-shrink-0">
             <button 
                @click="generateInsight" 
                class="text-xs font-medium text-slate-400 hover:text-primary transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-slate-50"
             >
                <RefreshCw class="w-3.5 h-3.5" />
                Refresh Analysis
             </button>
        </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, defineProps, watch } from 'vue'
import { Sparkles, RefreshCw } from 'lucide-vue-next'
import api from '@/api'

const props = defineProps({
    stats: {
        type: Object,
        required: true
    },
    urgentJobs: {
        type: Array,
        default: () => []
    }
})

const isAnalyzing = ref(true)
const insight = ref('')

const generateInsight = async () => {
    // Prevent spam if stats aren't ready
    if (!props.stats || !props.stats.activeJobs) {
        console.log('Waiting for stats to load...')
        return
    }

    isAnalyzing.value = true
    try {
        const payload = {
            stats: {
                revenueToday: props.stats.todaysSales || 0,
                activeJobs: props.stats.activeJobs || 0,
                pendingEstimates: props.stats.pendingApprovals || 0,
                lowStockCount: props.stats.lowInventory || 0,
                lowStockItems: props.stats.lowInventoryItems || []
            },
            urgentJobs: props.urgentJobs
        }

        const res = await api.post('/ai/insight', payload)
        insight.value = res.data.insight
    } catch (e) {
        console.error('Insight generation failed', e)
        insight.value = "We couldn't generate your daily briefing right now. Please check your connection or API key."
    } finally {
        isAnalyzing.value = false
    }
}

// Watch for stats to become available then trigger
watch(() => props.stats, (newStats) => {
    if (newStats) {
        generateInsight()
    }
}, { immediate: true })

</script>
