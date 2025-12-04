<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { Signal, SignalHigh, SignalMedium, SignalLow } from 'lucide-vue-next'

const latency = ref(null)
const intervalId = ref(null)
const currentController = ref(null)
const isMounted = ref(true)

const checkConnectivity = async () => {
  // Cancel any in-flight request
  if (currentController.value) {
    currentController.value.abort()
  }

  const controller = new AbortController()
  currentController.value = controller
  const start = Date.now()
  const timeoutId = setTimeout(() => controller.abort(), 5000)

  try {
    // Ping the server root
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'
    await fetch(baseUrl, { 
      method: 'HEAD', 
      cache: 'no-store',
      signal: controller.signal
    })
    
    if (isMounted.value) {
      const end = Date.now()
      latency.value = end - start
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      // Ignore abort errors caused by us cancelling previous requests
      return
    }
    console.error('Ping failed', error)
    if (isMounted.value) {
      latency.value = 999 // High latency on error
    }
  } finally {
    clearTimeout(timeoutId)
    if (currentController.value === controller) {
      currentController.value = null
    }
  }
}

const status = computed(() => {
  if (latency.value === null) return { color: 'text-muted-foreground', icon: Signal, label: 'Checking...' }
  if (latency.value < 100) return { color: 'text-green-500', icon: SignalHigh, label: 'Excellent' }
  if (latency.value < 300) return { color: 'text-yellow-500', icon: SignalMedium, label: 'Good' }
  return { color: 'text-red-500', icon: SignalLow, label: 'Poor' }
})

onMounted(() => {
  isMounted.value = true
  checkConnectivity()
  intervalId.value = setInterval(checkConnectivity, 5000)
})

onUnmounted(() => {
  isMounted.value = false
  if (intervalId.value) clearInterval(intervalId.value)
  if (currentController.value) {
    currentController.value.abort()
  }
})
</script>

<template>
  <div class="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/50" :title="`Network Status: ${status.label}`">
    <component :is="status.icon" class="h-4 w-4" :class="status.color" />
    <span class="text-xs font-medium tabular-nums" :class="status.color">
      {{ latency !== null ? latency + 'ms' : '...' }}
    </span>
  </div>
</template>
