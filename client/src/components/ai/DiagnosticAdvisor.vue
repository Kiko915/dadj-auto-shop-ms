<script setup>
import { ref } from 'vue'
import { Stethoscope, Loader2, CheckCircle, RotateCcw, ChevronDown, ChevronUp, Sparkles } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'vue-sonner'
import api from '@/api'

const emit = defineEmits(['apply'])

const isOpen = ref(false)
const complaint = ref('')
const vehicleInfo = ref('')
const isLoading = ref(false)
const result = ref(null)
const error = ref('')
const expandedDiagnosis = ref(null)

const confidenceVariant = (c) => ({ high: 'default', medium: 'secondary', low: 'outline' }[c] ?? 'outline')
const confidenceLabel  = (c) => ({ high: 'High', medium: 'Medium', low: 'Low' }[c] ?? c)

const open = () => {
  isOpen.value = true
  error.value = ''
}

const close = () => {
  isOpen.value = false
}

const reset = () => {
  result.value = null
  error.value = ''
  complaint.value = ''
  vehicleInfo.value = ''
  expandedDiagnosis.value = null
}

const analyze = async () => {
  if (!complaint.value.trim()) {
    toast.warning('Please describe the customer complaint first.')
    return
  }
  isLoading.value = true
  error.value = ''
  result.value = null
  expandedDiagnosis.value = null
  toast.info('Analyzing complaint with AI...')
  try {
    const res = await api.post(`/ai/diagnose?t=${Date.now()}`, {
      complaint: complaint.value,
      vehicleInfo: vehicleInfo.value,
    })
    result.value = res.data.result
    toast.success('Diagnosis ready! Review and apply to order.')
  } catch (e) {
    const msg = e.response?.data?.error || e.message || 'Failed to analyze. Please try again.'
    error.value = msg
    toast.error(msg)
  } finally {
    isLoading.value = false
  }
}

const applyToOrder = () => {
  if (!result.value?.items?.length) return
  emit('apply', { items: result.value.items })
  toast.success(`Applied ${result.value.items.length} suggested item(s) to order.`)
  close()
}
</script>

<template>
  <!-- Trigger Button -->
  <Button
    type="button"
    variant="outline"
    class="gap-2 border-amber-400/50 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
    @click="open"
  >
    <Stethoscope class="h-4 w-4" />
    <span class="hidden sm:inline">Diagnose</span>
  </Button>

  <!-- Bottom Sheet Overlay -->
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="isOpen" class="fixed inset-0 z-50 flex flex-col justify-end">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/50" @click="close" />

        <!-- Sheet -->
        <div class="relative bg-background rounded-t-2xl shadow-xl max-h-[90vh] overflow-y-auto">
          <!-- Handle bar -->
          <div class="sticky top-0 bg-background pt-3 pb-2 px-6 z-10 border-b">
            <div class="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto mb-3" />
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
                  <Stethoscope class="h-4 w-4" />
                </div>
                <div>
                  <h2 class="text-base font-semibold leading-none">AI Diagnostic Advisor</h2>
                  <p class="text-xs text-muted-foreground mt-0.5">Describe the problem, get suggested services</p>
                </div>
              </div>
              <button @click="close" class="text-muted-foreground hover:text-foreground p-1">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div class="p-6 space-y-5">
            <!-- Input form -->
            <div v-if="!result" class="space-y-4">
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Vehicle (optional)</label>
                <Input
                  v-model="vehicleInfo"
                  placeholder="e.g. 2019 Toyota Vios, Honda Civic 2020"
                  :disabled="isLoading"
                />
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Customer Complaint <span class="text-destructive">*</span></label>
                <Textarea
                  v-model="complaint"
                  placeholder="e.g. Car vibrates at high speed and pulls to the left when braking. Also hear a grinding noise from the front wheels."
                  class="min-h-[100px] resize-none"
                  :disabled="isLoading"
                />
              </div>

              <Button class="w-full gap-2 bg-amber-600 hover:bg-amber-700 text-white" @click="analyze" :disabled="isLoading || !complaint.trim()">
                <Loader2 v-if="isLoading" class="h-4 w-4 animate-spin" />
                <Sparkles v-else class="h-4 w-4" />
                {{ isLoading ? 'Analyzing...' : 'Analyze Complaint' }}
              </Button>

              <!-- Example prompts -->
              <div v-if="!isLoading" class="space-y-1.5">
                <p class="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Try an example</p>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="ex in [
                      'Engine makes knocking noise on startup',
                      'AC blows warm air only',
                      'Car won\'t start, battery is fine',
                      'Shakes when accelerating above 60 kph',
                    ]"
                    :key="ex"
                    class="text-xs px-2.5 py-1 rounded-full border border-dashed border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors"
                    @click="complaint = ex"
                  >
                    {{ ex }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Results -->
            <div v-if="result" class="space-y-5">
              <!-- Diagnoses -->
              <div class="space-y-2">
                <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Likely Diagnoses</p>
                <div class="space-y-2">
                  <div
                    v-for="(d, i) in result.diagnoses"
                    :key="i"
                    class="border rounded-xl overflow-hidden bg-white shadow-sm"
                  >
                    <button
                      class="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 transition-colors"
                      @click="expandedDiagnosis = expandedDiagnosis === i ? null : i"
                    >
                      <div class="flex items-center gap-3 min-w-0">
                        <div class="h-6 w-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold shrink-0">
                          {{ i + 1 }}
                        </div>
                        <span class="font-semibold text-sm truncate">{{ d.issue }}</span>
                      </div>
                      <div class="flex items-center gap-2 shrink-0 ml-2">
                        <Badge :variant="confidenceVariant(d.confidence)" class="text-[10px] px-1.5 capitalize">
                          {{ confidenceLabel(d.confidence) }}
                        </Badge>
                        <ChevronDown v-if="expandedDiagnosis !== i" class="h-4 w-4 text-muted-foreground" />
                        <ChevronUp v-else class="h-4 w-4 text-muted-foreground" />
                      </div>
                    </button>
                    <div v-if="expandedDiagnosis === i" class="px-4 pb-3 text-sm text-muted-foreground border-t bg-slate-50/50">
                      <p class="pt-2">{{ d.explanation }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Suggested Items -->
              <div class="space-y-2">
                <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Suggested Service Items ({{ result.items?.length || 0 }})</p>
                <div class="border rounded-xl overflow-hidden bg-white shadow-sm divide-y">
                  <div
                    v-for="(item, i) in result.items"
                    :key="i"
                    class="flex items-center gap-3 px-4 py-3"
                  >
                    <Badge
                      variant="outline"
                      :class="item.type === 'PART' ? 'border-blue-200 text-blue-700 bg-blue-50' : 'border-amber-200 text-amber-700 bg-amber-50'"
                      class="text-[10px] shrink-0"
                    >
                      {{ item.type }}
                    </Badge>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium truncate">{{ item.name }}</p>
                      <p v-if="item.description" class="text-xs text-muted-foreground truncate">{{ item.description }}</p>
                    </div>
                    <div class="text-right shrink-0">
                      <p class="text-sm font-semibold">₱{{ Number(item.price).toLocaleString() }}</p>
                      <p class="text-[10px] text-muted-foreground">× {{ item.quantity }}</p>
                    </div>
                  </div>
                </div>
                <p class="text-[10px] text-muted-foreground px-1">Prices are AI estimates. Adjust as needed after applying.</p>
              </div>

              <!-- Actions -->
              <div class="flex gap-3 pt-1 pb-2">
                <Button variant="outline" class="flex-1 gap-2" @click="reset">
                  <RotateCcw class="h-4 w-4" />
                  Try Again
                </Button>
                <Button class="flex-1 gap-2 bg-amber-600 hover:bg-amber-700 text-white" @click="applyToOrder" :disabled="!result.items?.length">
                  <CheckCircle class="h-4 w-4" />
                  Apply to Order
                </Button>
              </div>
            </div>

            <!-- Error -->
            <div v-if="error" class="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-sm text-destructive">
              {{ error }}
            </div>
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
