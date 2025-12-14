<script setup>
import { AlertTriangle } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

defineProps({
    errorMessage: String
})

defineEmits(['retry', 'cancel'])
</script>

<template>
    <div class="w-1/2 bg-white flex flex-col items-center justify-center h-full p-8 space-y-8 animate-in slide-in-from-right duration-500">
            <div class="h-24 w-24 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle class="h-12 w-12 text-red-600 animate-in zoom-in duration-500" />
        </div>
        
        <div class="text-center space-y-2">
            <h2 class="text-3xl font-black text-slate-900 tracking-tight">Payment Failed</h2>
            <p class="text-slate-500 text-lg">Something went wrong processed the transaction.</p>
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
