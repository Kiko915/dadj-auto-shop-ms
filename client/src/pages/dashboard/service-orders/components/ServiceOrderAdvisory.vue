<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { Trash2, Plus, Pencil, Image as ImageIcon, AlertTriangle, AlertCircle, Info, Lock } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { addServiceOrderAdvisory, updateServiceOrderAdvisory, deleteServiceOrderAdvisory } from '@/api/serviceOrders'
import { toast } from 'vue-sonner'

const props = defineProps<{
    orderId: string
    advisories: any[]
    loading?: boolean
}>()

const emit = defineEmits(['order-updated'])

const isDialogOpen = ref(false)
const isSubmitting = ref(false)
const editingId = ref<string | null>(null)
const selectedImage = ref<File | null>(null)
const previewUrl = ref<string | null>(null)

const showConfirmDelete = ref(false)
const selectedAdvisoryId = ref<string | null>(null)
const isDeleting = ref(false)

const formData = ref({
    content: '',
    severity: 'LOW'
})

const severityOptions = [
    { value: 'LOW', label: 'Low', color: 'bg-slate-100 text-slate-600', icon: Info },
    { value: 'MEDIUM', label: 'Medium', color: 'bg-amber-100 text-amber-700', icon: AlertTriangle },
    { value: 'HIGH', label: 'High', color: 'bg-orange-100 text-orange-700', icon: AlertCircle },
    { value: 'CRITICAL', label: 'Critical', color: 'bg-red-100 text-red-700', icon: Lock }
]

const getSeverityConfig = (severity: string) => {
    return severityOptions.find(o => o.value === severity) || severityOptions[0]
}

const handleImageSelect = (event: Event) => {
    const input = event.target as HTMLInputElement
    if (input.files && input.files[0]) {
        // Revoke existing URL to prevent memory leak
        if (previewUrl.value && !previewUrl.value.startsWith('http')) {
             URL.revokeObjectURL(previewUrl.value)
        }
        
        const file = input.files[0]
        selectedImage.value = file
        previewUrl.value = URL.createObjectURL(file)
    }
}

const clearImage = () => {
    // Revoke URL if it's a blob
    if (previewUrl.value && !previewUrl.value.startsWith('http')) {
        URL.revokeObjectURL(previewUrl.value)
    }
    selectedImage.value = null
    previewUrl.value = null
}

onUnmounted(() => {
    if (previewUrl.value && !previewUrl.value.startsWith('http')) {
        URL.revokeObjectURL(previewUrl.value)
    }
})

const resetForm = () => {
    formData.value = { content: '', severity: 'LOW' }
    clearImage()
    editingId.value = null
}

watch(isDialogOpen, (val) => {
    if (!val) {
        setTimeout(() => resetForm(), 300)
    }
})

const handleEdit = (advisory: any) => {
    editingId.value = advisory.id
    formData.value = {
        content: advisory.content,
        severity: advisory.severity
    }
    previewUrl.value = advisory.imageUrl
    isDialogOpen.value = true
}

const handleSubmit = async () => {
    if (!formData.value.content) return

    isSubmitting.value = true
    try {
        const data = new FormData()
        data.append('content', formData.value.content)
        data.append('severity', formData.value.severity)
        if (selectedImage.value) {
            data.append('image', selectedImage.value)
        }

        if (editingId.value) {
            await updateServiceOrderAdvisory(props.orderId, editingId.value, data)
            toast.success('Advisory Updated', {
                description: 'The advisory has been successfully updated.',
            })
        } else {
            await addServiceOrderAdvisory(props.orderId, data)
            toast.success('Advisory Added', {
                description: 'The advisory has been successfully added to the service order.',
            })
        }

        emit('order-updated')
        isDialogOpen.value = false
        // Form reset handled by watch

    } catch (error) {
        console.error('Failed to save advisory', error)
        toast.error('Error', {
            description: 'Failed to save advisory. Please try again.',
        })
    } finally {
        isSubmitting.value = false
    }
}

const handleDelete = (advisoryId: string) => {
    selectedAdvisoryId.value = advisoryId
    showConfirmDelete.value = true
}

const confirmDelete = async () => {
    if (!selectedAdvisoryId.value) return

    isDeleting.value = true
    try {
        await deleteServiceOrderAdvisory(props.orderId, selectedAdvisoryId.value)
        toast.success('Advisory Deleted', {
            description: 'The advisory has been removed.',
        })
        emit('order-updated')
        showConfirmDelete.value = false
        selectedAdvisoryId.value = null
    } catch (error) {
        console.error('Failed to delete advisory', error)
        toast.error('Error', {
            description: 'Failed to delete advisory.',
        })
    } finally {
        isDeleting.value = false
    }
}
</script>

<template>
    <div class="h-full flex flex-col">
        <!-- Header / Actions -->
        <div class="mb-4 flex justify-between items-center">
            <div>
                <h3 class="font-medium text-slate-900">Service Advisories</h3>
                <p class="text-sm text-slate-500">Recommendations and observations for the customer.</p>
            </div>
            
            <Dialog v-model:open="isDialogOpen">
                <DialogTrigger as-child>
                    <Button class="gap-2">
                        <Plus class="h-4 w-4" />
                        Add Advisory
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{{ editingId ? 'Edit Advisory' : 'Add New Advisory' }}</DialogTitle>
                        <DialogDescription>
                             {{ editingId ? 'Update the details of this advisory.' : 'Create a new advisory note for this vehicle service.' }}
                        </DialogDescription>
                    </DialogHeader>

                    <div class="space-y-4 py-4">
                        <div class="space-y-3">
                            <label class="text-sm font-medium">Severity Level</label>
                            <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                <div 
                                    v-for="option in severityOptions" 
                                    :key="option.value"
                                    @click="formData.severity = option.value"
                                    :class="[
                                        'cursor-pointer rounded-xl border p-3 flex flex-col items-center justify-center gap-2 transition-all duration-200',
                                        formData.severity === option.value 
                                            ? option.color + ' border-transparent ring-2 ring-offset-1 ring-offset-white ring-current shadow-sm scale-[1.02]' 
                                            : 'hover:bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700'
                                    ]"
                                >
                                    <component :is="option.icon" class="h-5 w-5" :class="formData.severity === option.value ? '' : 'opacity-70'" />
                                    <span class="text-xs font-semibold">{{ option.label }}</span>
                                </div>
                            </div>
                        </div>

                        <div class="space-y-2">
                            <div class="flex justify-between items-center">
                                <label class="text-sm font-medium">Observation / Recommendation</label>
                                <span class="text-[10px] text-muted-foreground bg-slate-100 px-2 py-0.5 rounded-full font-medium">
                                    {{ formData.content.length }} / 500
                                </span>
                            </div>
                            <Textarea 
                                v-model="formData.content" 
                                placeholder="Describe the observation or recommendation in detail..." 
                                class="h-32 resize-none"
                                maxlength="500"
                            />
                        </div>

                        <div class="space-y-2">
                            <label class="text-sm font-medium">Evidence Photo (Optional)</label>
                            <div v-if="!previewUrl" class="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 transition-colors cursor-pointer relative">
                                <ImageIcon class="h-8 w-8 mb-2" />
                                <span class="text-xs">Click to upload image</span>
                                <input type="file" accept="image/*" class="absolute inset-0 opacity-0 cursor-pointer" @change="handleImageSelect" />
                            </div>
                            <div v-else class="relative rounded-lg overflow-hidden border group">
                                <img :src="previewUrl" class="w-full h-48 object-cover" />
                                <button @click="clearImage" class="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full transition-colors">
                                    <Trash2 class="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" @click="isDialogOpen = false">Cancel</Button>
                        <Button @click="handleSubmit" :disabled="isSubmitting || !formData.content">
                            {{ isSubmitting ? 'Saving...' : (editingId ? 'Update Advisory' : 'Add Advisory') }}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>

        <!-- List -->
        <div class="flex-1 overflow-y-auto pr-2 space-y-3">
            <div v-if="loading" class="space-y-3">
                <div v-for="i in 3" :key="i" class="h-24 bg-slate-100 animate-pulse rounded-lg"></div>
            </div>

            <div v-else-if="!advisories || advisories.length === 0" class="h-64 flex flex-col items-center justify-center text-center border-2 border-dashed rounded-lg bg-slate-50/50">
                <div class="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
                    <Info class="h-6 w-6" />
                </div>
                <h3 class="font-medium text-slate-900">No advisories yet</h3>
                <p class="text-sm text-slate-500 mt-1 max-w-sm">
                    Add advisories to document issues found during inspection.
                </p>
            </div>

            <div v-for="advisory in advisories" :key="advisory.id" class="group relative bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                <!-- Severity Strip -->
                <div :class="`absolute left-0 top-0 bottom-0 w-1.5 ${getSeverityConfig(advisory.severity).color.split(' ')[0]}`"></div>
                
                <div class="p-4 pl-5 flex gap-4">
                    <!-- Image -->
                    <div v-if="advisory.imageUrl" class="shrink-0">
                         <div class="h-24 w-24 rounded-lg overflow-hidden border bg-slate-100 ring-1 ring-slate-100">
                            <img :src="advisory.imageUrl" class="h-full w-full object-cover hover:scale-105 transition-transform duration-500" alt="Evidence" />
                         </div>
                    </div>
                    
                    <!-- Content -->
                    <div class="flex-1 min-w-0 flex flex-col">
                        <div class="flex justify-between items-start">
                            <div class="flex items-center gap-2 mb-2">
                                <Badge 
                                    variant="outline"
                                    :class="`px-2 py-0.5 border-0 font-semibold ${getSeverityConfig(advisory.severity).color}`"
                                >
                                    <component :is="getSeverityConfig(advisory.severity).icon" class="h-3.5 w-3.5 mr-1" />
                                    {{ getSeverityConfig(advisory.severity).label }}
                                </Badge>
                                <span class="text-xs text-slate-400 font-medium">
                                    {{ new Date(advisory.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) }}
                                </span>
                            </div>

                            <div class="flex items-center opacity-0 group-hover:opacity-100 transition-opacity -mr-2">
                                <Button variant="ghost" size="icon" class="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50" @click="handleEdit(advisory)">
                                    <Pencil class="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" class="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50" @click="handleDelete(advisory.id)">
                                    <Trash2 class="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        
                        <p class="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                            {{ advisory.content }}
                        </p>
                    </div>
                </div>
            </div>
        </div>


        <Dialog :open="showConfirmDelete" @update:open="(val) => { if(!val) { showConfirmDelete = false; selectedAdvisoryId = null } }">
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete Advisory</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete this advisory? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" @click="showConfirmDelete = false">Cancel</Button>
                    <Button variant="destructive" @click="confirmDelete" :disabled="isDeleting">
                        {{ isDeleting ? 'Deleting...' : 'Delete Advisory' }}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
</template>
