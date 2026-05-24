<script setup>
import { AlertTriangle } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

defineProps({
    errorMessage: String
})

defineEmits(['retry', 'cancel'])
</script>

<template>
    <div class="w-full sm:w-1/2 bg-white flex flex-col items-center justify-center h-full p-6 sm:p-8 space-y-6 sm:space-y-8 animate-in slide-in-from-right duration-500">
        <div class="h-20 w-20 sm:h-24 sm:w-24 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle class="h-10 w-10 sm:h-12 sm:w-12 text-red-600 animate-in zoom-in duration-500" />
        </div>

        <div class="text-center space-y-2">
            <h2 class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Payment Failed</h2>
            <p class="text-slate-500 text-base sm:text-lg">Something went wrong processing the transaction.</p>
            <p class="text-xs text-red-500 bg-red-50 px-3 py-1 rounded border border-red-100 font-mono">{{ errorMessage }}</p>
        </div>

        <div class="flex gap-4 w-full max-w-xs">
            <Button variant="outline" class="flex-1 h-12" @click="$emit('retry')">
                Try Again
            </Button>
                <Button variant="ghost" class="flex-1 h-12 text-slate-500" @click="$emit('cancel')">
                Cancel
            </Button>
        </div>
    </div>
</template>
