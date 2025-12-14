<script setup>
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { FileText } from 'lucide-vue-next'

const props = defineProps({
  laborTotal: {
    type: Number,
    required: true
  },
  partsTotal: {
    type: Number,
    required: true
  },
  grandTotal: {
    type: Number,
    required: true
  },
  expiryDate: {
    type: String,
    default: ''
  },
  itemsCount: {
    type: Number,
    default: 0
  },
  showExpiry: {
    type: Boolean,
    default: true
  },
  title: {
    type: String,
    default: 'Estimate Summary'
  }
})

const emit = defineEmits(['update:expiryDate'])

const handleDateChange = (e) => {
    emit('update:expiryDate', e.target.value)
}
</script>

<template>
    <Card class="bg-gradient-to-br from-white to-slate-50 border-slate-200 shadow-md">
        <CardHeader class="pb-4 border-b">
            <CardTitle class="text-base flex items-center gap-2">
                <FileText class="w-4 h-4 text-primary"/> {{ title }}
            </CardTitle>
        </CardHeader>
        <CardContent class="pt-6 space-y-5">
            
            <div class="space-y-3">
                <div class="flex justify-between text-sm">
                    <span class="text-muted-foreground">Labor Subtotal</span>
                    <span class="font-medium">₱{{ laborTotal.toLocaleString(undefined, { minimumFractionDigits: 2 }) }}</span>
                </div>
                <div class="flex justify-between text-sm">
                    <span class="text-muted-foreground">Parts Subtotal</span>
                    <span class="font-medium">₱{{ partsTotal.toLocaleString(undefined, { minimumFractionDigits: 2 }) }}</span>
                </div>
            </div>
            
            <Separator />
            
            <div class="flex justify-between items-end">
                <span class="text-sm font-semibold text-muted-foreground uppercase tracking-wider pb-1">Grand Total</span>
                <span class="text-2xl font-bold text-primary tracking-tight">₱{{ grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 }) }}</span>
            </div>

            <div v-if="showExpiry" class="pt-4 space-y-3">
                    <div class="grid gap-1.5">
                    <Label class="text-xs font-medium text-muted-foreground">Estimate Expiry</Label>
                    <Input type="date" :value="expiryDate" @input="handleDateChange" class="bg-background" />
                    </div>
            </div>

        </CardContent>
        <CardFooter class="bg-muted/10 p-4 border-t flex justify-between items-center text-xs text-muted-foreground">
            <div class="flex items-center gap-1.5">
                <div class="w-2 h-2 rounded-full bg-green-500"></div> Draft mode
            </div>
            <span>{{ itemsCount }} items</span>
        </CardFooter>
    </Card>
</template>
