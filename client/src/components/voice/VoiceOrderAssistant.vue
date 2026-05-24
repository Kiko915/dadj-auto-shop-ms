<script setup>
import { ref } from 'vue'
import { SpeechRecognition } from '@capacitor-community/speech-recognition'
import { Mic, MicOff, Loader2, CheckCircle, RotateCcw, X, Sparkles } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { toast } from 'vue-sonner'
import api from '@/api'

const emit = defineEmits(['apply'])

const isOpen = ref(false)
const isListening = ref(false)
const isProcessing = ref(false)
const transcript = ref('')
const parsed = ref(null)
const error = ref('')
let stoppingInProgress = false

const open = () => {
  isOpen.value = true
  error.value = ''
  transcript.value = ''
  parsed.value = null
}

const close = () => {
  if (isListening.value) stopListening()
  isOpen.value = false
}

const withTimeout = (promise, ms) =>
  Promise.race([promise, new Promise(resolve => setTimeout(resolve, ms))])

const startListening = async () => {
  error.value = ''
  transcript.value = ''
  parsed.value = null
  stoppingInProgress = false

  try {
    const { speechRecognition } = await SpeechRecognition.checkPermissions()
    if (speechRecognition !== 'granted') {
      await SpeechRecognition.requestPermissions()
    }

    await SpeechRecognition.removeAllListeners()

    SpeechRecognition.addListener('partialResults', (data) => {
      if (data.matches?.length > 0) {
        transcript.value = data.matches[0]
      }
    })

    // Auto-stop when Android finishes recognition (fires after final partialResults)
    SpeechRecognition.addListener('listeningState', (data) => {
      if (data.status === 'stopped') stopListening()
    })

    await SpeechRecognition.start({
      language: 'en-US',
      maxResults: 1,
      popup: false,
      partialResults: true,
    })

    isListening.value = true
  } catch (e) {
    error.value = 'Microphone permission denied or unavailable.'
    isListening.value = false
  }
}

const stopListening = async () => {
  if (stoppingInProgress) return
  stoppingInProgress = true
  isListening.value = false
  try { await withTimeout(SpeechRecognition.removeAllListeners(), 500) } catch (_) {}
  try { await withTimeout(SpeechRecognition.stop(), 1000) } catch (_) {}
  if (transcript.value.trim()) {
    parseTranscript()
  } else {
    error.value = 'No speech detected. Please try again.'
    toast.warning('No speech detected. Please try again.')
  }
}

const parseTranscript = async () => {
  if (!transcript.value.trim()) return
  isProcessing.value = true
  error.value = ''
  toast.info('Analyzing transcript with AI...')
  try {
    const res = await api.post(`/ai/parse-order?t=${Date.now()}`, { transcript: transcript.value })
    parsed.value = res.data.parsed
    toast.success('Order extracted! Review and tap Apply to Form.')
  } catch (e) {
    const msg = e.response?.data?.error || e.message || 'Failed to process. Please try again.'
    error.value = msg
    toast.error(`ERR ${e.response?.status}: ${msg}`)
  } finally {
    isProcessing.value = false
  }
}

const applyToForm = () => {
  if (!parsed.value) return
  emit('apply', parsed.value)
  close()
}

const reset = () => {
  transcript.value = ''
  parsed.value = null
  error.value = ''
}
</script>

<template>
  <!-- Trigger Button -->
  <Button
    type="button"
    variant="outline"
    class="gap-2 border-primary/40 text-primary hover:bg-primary/5"
    @click="open"
  >
    <Mic class="h-4 w-4" />
    <span class="hidden sm:inline">Voice Input</span>
  </Button>

  <!-- Bottom Sheet Overlay -->
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="isOpen" class="fixed inset-0 z-50 flex flex-col justify-end">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/50" @click="close" />

        <!-- Sheet -->
        <div class="relative bg-background rounded-t-2xl shadow-xl p-6 space-y-5 max-h-[85vh] overflow-y-auto">
          <!-- Handle bar -->
          <div class="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-muted-foreground/30" />

          <!-- Header -->
          <div class="flex items-center justify-between pt-2">
            <div class="flex items-center gap-2">
              <Sparkles class="h-5 w-5 text-primary" />
              <h2 class="text-base font-semibold">Voice Order Assistant</h2>
            </div>
            <button @click="close" class="text-muted-foreground hover:text-foreground">
              <X class="h-5 w-5" />
            </button>
          </div>

          <!-- Instructions -->
          <p v-if="!transcript && !isListening" class="text-sm text-muted-foreground">
            Tap the mic and describe the service order. For example:<br />
            <span class="italic text-foreground/70">"New job for Juan dela Cruz's Honda Civic. Replace brake pads, 4 sets at 500 pesos each. Two hours labor."</span>
          </p>

          <!-- Mic Button -->
          <div class="flex justify-center">
            <button
              v-if="!isListening"
              @click="startListening"
              :disabled="isProcessing"
              class="w-20 h-20 rounded-full bg-primary text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform disabled:opacity-50"
            >
              <Mic class="h-8 w-8" />
            </button>
            <button
              v-else
              @click="stopListening"
              class="w-20 h-20 rounded-full bg-destructive text-white flex items-center justify-center shadow-lg animate-pulse active:scale-95 transition-transform"
            >
              <MicOff class="h-8 w-8" />
            </button>
          </div>

          <p class="text-center text-xs text-muted-foreground">
            {{ isListening ? 'Listening... tap to stop' : isProcessing ? 'Analyzing...' : 'Tap mic to start' }}
          </p>

          <!-- Live Transcript -->
          <div v-if="transcript" class="bg-muted/50 rounded-lg p-4 text-sm text-foreground border">
            <p class="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">Transcript</p>
            <p>{{ transcript }}</p>
          </div>

          <!-- Processing -->
          <div v-if="isProcessing" class="flex items-center justify-center gap-2 text-sm text-primary py-2">
            <Loader2 class="h-4 w-4 animate-spin" />
            Processing with AI...
          </div>

          <!-- Parsed Result Preview -->
          <div v-if="parsed && !isProcessing" class="space-y-3">
            <div class="flex items-center gap-2 text-sm font-medium text-green-600">
              <CheckCircle class="h-4 w-4" />
              Order extracted successfully
            </div>

            <div class="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2 text-sm">
              <div v-if="parsed.customerName" class="flex justify-between">
                <span class="text-muted-foreground">Customer</span>
                <span class="font-medium">{{ parsed.customerName }}</span>
              </div>
              <div v-if="parsed.vehicleDescription" class="flex justify-between">
                <span class="text-muted-foreground">Vehicle</span>
                <span class="font-medium">{{ parsed.vehicleDescription }}</span>
              </div>
              <div v-if="parsed.items?.length" class="pt-1 border-t border-green-200">
                <p class="text-muted-foreground mb-1">Items ({{ parsed.items.length }})</p>
                <div v-for="(item, i) in parsed.items" :key="i" class="flex justify-between text-xs py-0.5">
                  <span>{{ item.name }} × {{ item.quantity }}</span>
                  <span class="text-muted-foreground">
                    {{ item.type }} · ₱{{ item.price }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex gap-3 pt-1">
              <Button variant="outline" class="flex-1 gap-2" @click="reset">
                <RotateCcw class="h-4 w-4" />
                Try Again
              </Button>
              <Button class="flex-1 gap-2" @click="applyToForm">
                <CheckCircle class="h-4 w-4" />
                Apply to Form
              </Button>
            </div>
          </div>

          <!-- Error -->
          <div v-if="error" class="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-sm text-destructive">
            {{ error }}
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.sheet-enter-active,
.sheet-leave-active {
  transition: opacity 0.2s ease;
}
.sheet-enter-active .relative,
.sheet-leave-active .relative {
  transition: transform 0.3s ease;
}
.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}
</style>
