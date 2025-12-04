<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { Signal, SignalHigh, SignalMedium, SignalLow } from 'lucide-vue-next'

const latency = ref(0)
const intervalId = ref(null)

const checkConnectivity = async () => {
  const start = Date.now()
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 5000)

  try {
    // Ping the server root
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'
    await fetch(baseUrl, { 
      method: 'HEAD', 
      cache: 'no-store',
      signal: controller.signal
    })
    const end = Date.now()
    latency.value = end - start
  } catch (error) {
    console.error('Ping failed', error)
    latency.value = 999 // High latency on error
  } finally {
    clearTimeout(timeoutId)
  }
}

const status = computed(() => {
  if (latency.value < 100) return { color: 'text-green-500', icon: SignalHigh, label: 'Excellent' }
  if (latency.value < 300) return { color: 'text-yellow-500', icon: SignalMedium, label: 'Good' }
  return { color: 'text-red-500', icon: SignalLow, label: 'Poor' }
})

onMounted(() => {
  checkConnectivity()
  intervalId.value = setInterval(checkConnectivity, 5000)
})

onUnmounted(() => {
  if (intervalId.value) clearInterval(intervalId.value)
})
</script>

<template>
  <div class="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/50" :title="`Network Status: ${status.label}`">
    <component :is="status.icon" class="h-4 w-4" :class="status.color" />
    <span class="text-xs font-medium tabular-nums" :class="status.color">
      {{ latency }}ms
    </span>
  </div>
</template>
