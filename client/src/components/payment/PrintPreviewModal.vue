<script setup>
import { ref, watch, nextTick } from 'vue'
import { 
    X, 
    Download, 
    Printer, 
    Image as ImageIcon,
    Loader2 
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogClose, DialogTitle } from '@/components/ui/dialog'
import jsPDF from 'jspdf'
import * as htmlToImage from 'html-to-image'
import { toast } from 'vue-sonner'

const props = defineProps({
    isOpen: Boolean,
    title: String,
    mode: {
        type: String,
        default: 'RECEIPT' // RECEIPT | GATE_PASS
    },
    // ID of the DOM element to capture
    targetId: String,
    fileName: String
})

const emit = defineEmits(['update:isOpen', 'close'])

const isProcessing = ref(false)
const previewImage = ref(null)

// Watch for opening to generate preview
watch(() => props.isOpen, async (newVal) => {
    if (newVal && props.targetId) {
        // Wait for parent generic print view to be visible/rendered if needed, 
        // or we clone the node. 
        // Strategy: The parent should have the element rendered but hidden (or visible).
        // We will clone it for the preview.
        
        await nextTick()
        generatePreview()
    } else {
        previewImage.value = null
    }
})

const generatePreview = async () => {
    try {
        const element = document.getElementById(props.targetId)
        if (!element) {
             console.error(`Target element not found: ${props.targetId}`)
             return
        }

        // Get actual dimensions
        const width = element.scrollWidth
        const height = element.scrollHeight

        // Capture at higher resolution for better zoom/preview quality
        const dataUrl = await htmlToImage.toPng(element, { 
            quality: 1.0, 
            backgroundColor: '#ffffff',
            pixelRatio: 3, 
            width: width,
            height: height,
            style: {
                display: 'block',
                overflow: 'visible',
                height: `${height}px`,
                maxHeight: 'none'
            }
        })
        previewImage.value = dataUrl
    } catch (error) {
        console.error('Preview generation failed:', error)
        toast.error('Failed to generate preview')
    }
}
// Restored export functions
const handleDownloadPDF = async () => {
    isProcessing.value = true
    try {
        const element = document.getElementById(props.targetId)
        if (!element) throw new Error('Element not found')

        const width = element.scrollWidth
        const height = element.scrollHeight

        // Capture using html-to-image
        const imgData = await htmlToImage.toPng(element, { 
            quality: 1.0, 
            backgroundColor: '#ffffff',
            pixelRatio: 3,
            width: width,
            height: height,
            style: { 
                display: 'block',
                overflow: 'visible',
                height: `${height}px`,
                maxHeight: 'none'
             }
        })
        
        // Use A4 as base width, but allow dynamic height
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        })

        const imgProps = pdf.getImageProperties(imgData)
        const pdfWidth = pdf.internal.pageSize.getWidth() // A4 Width
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width
        
        // If content is taller than A4, resize page
        if (pdfHeight > pdf.internal.pageSize.getHeight()) {
            pdf.deletePage(1)
            pdf.addPage([pdfWidth, pdfHeight])
        }

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
        pdf.save(`${props.fileName || 'document'}.pdf`)
        toast.success('PDF downloaded successfully')
    } catch (error) {
        console.error('PDF export failed:', error)
        toast.error('Failed to export PDF')
    } finally {
        isProcessing.value = false
    }
}

const handleDownloadImage = async () => {
    isProcessing.value = true
    try {
        const element = document.getElementById(props.targetId)
        if (!element) throw new Error('Element not found')

        const width = element.scrollWidth
        const height = element.scrollHeight

        const dataUrl = await htmlToImage.toPng(element, { 
            quality: 1.0, 
            backgroundColor: '#ffffff',
            pixelRatio: 3,
            width: width,
            height: height,
            style: { 
                display: 'block',
                overflow: 'visible',
                height: `${height}px`,
                maxHeight: 'none'
            }
        })
        
        const link = document.createElement('a')
        link.download = `${props.fileName || 'image'}.png`
        link.href = dataUrl
        link.click()
        toast.success('Image saved successfully')
    } catch (error) {
        console.error('Image export failed:', error)
        toast.error('Failed to export image')
    } finally {
        isProcessing.value = false
    }
}

const handlePrint = () => {
    window.print()
}
</script>

<template>
    <Dialog :open="isOpen" @update:open="$emit('update:isOpen', $event)">
        <DialogContent class="max-w-7xl h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-slate-50 print:hidden">
            
            <!-- Header -->
            <div class="flex items-center justify-between p-4 border-b bg-white">
                <DialogTitle class="text-lg font-bold flex items-center gap-2">
                    <Printer class="w-5 h-5 text-primary" />
                    {{ title }} Preview
                </DialogTitle>
                <!-- Default DialogClose is sufficient -->
            </div>

            <!-- Main Content: Split View -->
            <div class="flex-1 flex overflow-hidden">
                
                <!-- Preview Area -->
                <div class="flex-1 overflow-y-auto overflow-x-hidden p-8 flex items-start justify-center bg-slate-100/50">
                    <div v-if="previewImage" class="shadow-2xl ring-1 ring-slate-900/5 bg-white w-full max-w-4xl animate-in zoom-in-95 duration-300">
                        <img :src="previewImage" alt="Preview" class="w-full h-auto object-contain" />
                    </div>
                    <div v-else class="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
                        <Loader2 class="w-8 h-8 animate-spin text-primary" />
                        <span class="text-sm font-medium">Generating preview...</span>
                    </div>
                </div>

                <!-- Sidebar Actions -->
                <div class="w-80 bg-white border-l p-6 flex flex-col gap-6 z-10 shadow-lg">
                    
                    <div>
                        <h3 class="font-bold text-slate-900 mb-1">Actions</h3>
                        <p class="text-sm text-slate-500 mb-4">Choose a format to save or print.</p>
                        
                        <div class="space-y-3">
                            <Button class="w-full h-12 justify-start" @click="handlePrint">
                                <Printer class="w-4 h-4 mr-3" />
                                Print System Dialog
                            </Button>
                            
                            <div class="h-px bg-slate-100 my-2"></div>

                            <Button variant="outline" class="w-full h-12 justify-start" @click="handleDownloadPDF" :disabled="isProcessing">
                                <Download class="w-4 h-4 mr-3" />
                                {{ isProcessing ? 'Processing...' : 'Save as PDF' }}
                            </Button>

                            <Button variant="outline" class="w-full h-12 justify-start" @click="handleDownloadImage" :disabled="isProcessing">
                                <ImageIcon class="w-4 h-4 mr-3" />
                                {{ isProcessing ? 'Processing...' : 'Save as Image' }}
                            </Button>
                        </div>
                    </div>

                    <div class="mt-auto bg-slate-50 p-4 rounded-lg border border-slate-100 text-xs text-slate-500">
                        <p class="font-medium text-slate-700 mb-1">Tip:</p>
                        Use 'Save as PDF' for official records. Use 'Save as Image' for quick sharing via chat apps.
                    </div>
                </div>

            </div>

        </DialogContent>
    </Dialog>
</template>
