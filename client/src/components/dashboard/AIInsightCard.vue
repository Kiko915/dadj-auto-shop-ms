<script setup>
import { ref, onMounted, watch, computed } from 'vue'
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

const CACHE_KEY = 'ai_insight_cache'
const CLIENT_TTL_MS = 30 * 60 * 1000  // 30 minutes
const REFRESH_COOLDOWN_MS = 30 * 1000 // 30 seconds between manual refreshes

const isAnalyzing = ref(false)
const insight = ref('')
const generatedAt = ref(null) // timestamp of when insight was produced
const lastRefreshAttempt = ref(0)

// --- Cache helpers ---
const readCache = () => {
    try {
        const raw = localStorage.getItem(CACHE_KEY)
        if (!raw) return null
        const data = JSON.parse(raw)
        if (Date.now() - data.generatedAt < CLIENT_TTL_MS) return data
    } catch {}
    return null
}

const writeCache = (insightText, ts) => {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ insight: insightText, generatedAt: ts }))
    } catch {}
}

// --- Human-readable age ---
const insightAge = computed(() => {
    if (!generatedAt.value) return null
    const mins = Math.floor((Date.now() - generatedAt.value) / 60000)
    if (mins < 1) return 'just now'
    if (mins === 1) return '1 min ago'
    return `${mins} min ago`
})

const canRefresh = computed(() => Date.now() - lastRefreshAttempt.value > REFRESH_COOLDOWN_MS)

// --- Main fetch ---
const generateInsight = async (force = false) => {
    if (!props.stats) return

    // Client cache — skip API call entirely if fresh and not forced
    if (!force) {
        const cached = readCache()
        if (cached) {
            insight.value = cached.insight
            generatedAt.value = cached.generatedAt
            return
        }
    }

    isAnalyzing.value = true
    lastRefreshAttempt.value = Date.now()

    try {
        const payload = {
            stats: {
                revenueToday: props.stats.todaysSales || 0,
                activeJobs: props.stats.activeJobs || 0,
                pendingEstimates: props.stats.pendingApprovals || 0,
                lowStockCount: props.stats.lowInventory || 0,
                lowStockItems: props.stats.lowInventoryItems || []
            },
            urgentJobs: props.urgentJobs,
            force // tell server to bypass its own cache too
        }

        const res = await api.post('/ai/insight', payload)
        insight.value = res.data.insight

        // Server may return its cached generatedAt; fall back to now
        const ts = res.data.generatedAt || Date.now()
        generatedAt.value = ts
        writeCache(res.data.insight, ts)

    } catch (e) {
        console.error('Insight generation failed', e)
        if (!insight.value) {
            insight.value = "We couldn't generate your daily briefing right now. Please try again later."
        }
    } finally {
        isAnalyzing.value = false
    }
}

const handleRefresh = () => {
    if (!canRefresh.value || isAnalyzing.value) return
    generateInsight(true)
}

// Only generate once when stats first become available
onMounted(() => {
    if (props.stats) generateInsight()
})

watch(() => props.stats, (newStats, oldStats) => {
    // Trigger only on first load (null → data), not on every poll update
    if (newStats && !oldStats && !insight.value) {
        generateInsight()
    }
})
</script>

<template>
  <div class="w-full bg-white border border-gray-100 border-l-4 border-l-primary rounded-r-lg shadow-sm p-3 sm:p-5 mb-6 transition-all animate-in fade-in slide-in-from-top-2 duration-700">

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
          <p v-if="insightAge" class="text-[11px] text-muted-foreground/60">Generated {{ insightAge }}</p>
        </div>
      </div>

      <div class="flex items-center self-end md:self-center flex-shrink-0">
        <button
          @click="handleRefresh"
          :disabled="!canRefresh || isAnalyzing"
          class="text-xs font-medium transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-md"
          :class="canRefresh && !isAnalyzing
            ? 'text-slate-400 hover:text-primary hover:bg-slate-50'
            : 'text-slate-300 cursor-not-allowed'"
          :title="canRefresh ? 'Refresh analysis' : 'Please wait before refreshing again'"
        >
          <RefreshCw class="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>
    </div>

  </div>
</template>
