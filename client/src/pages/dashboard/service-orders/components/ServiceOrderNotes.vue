<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { Plus, Pencil, Trash2, StickyNote, X, Check, Loader2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getServiceOrderNotes, addServiceOrderNote, updateServiceOrderNote, deleteServiceOrderNote } from '@/api/serviceOrders'
import { toast } from 'vue-sonner'

const props = defineProps<{
    orderId: string
}>()

const notes = ref<any[]>([])
const loading = ref(false)
const isAdding = ref<boolean | 'loading'>(false)
const newNoteContent = ref('')

const isEditing = ref<string | null>(null)
const editContent = ref('')
const isSaving = ref(false)

const deleteId = ref<string | null>(null)
const isDeleting = ref(false)

const fetchNotes = async () => {
    if (!props.orderId) return
    loading.value = true
    try {
        notes.value = await getServiceOrderNotes(props.orderId)
    } catch (error) {
        console.error('Failed to fetch notes', error)
    } finally {
        loading.value = false
    }
}

watch(() => props.orderId, fetchNotes, { immediate: true })

const handleAddNote = async () => {
    if (!newNoteContent.value.trim()) return
    if (isAdding.value === 'loading') return

    isAdding.value = 'loading'
    try {
        await addServiceOrderNote(props.orderId, newNoteContent.value)
        newNoteContent.value = ''
        isAdding.value = false
        toast.success('Note added')
        fetchNotes()
    } catch (error) {
        console.error('Failed to add note', error)
        toast.error('Failed to add note')
        isAdding.value = true // Revert to adding state on error
    }
}

const startEdit = (note: any) => {
    isEditing.value = note.id
    editContent.value = note.content
}
const cancelEdit = () => {
    isEditing.value = null
    editContent.value = ''
}

const saveEdit = async (noteId: string) => {
    if (!editContent.value.trim()) return
    if (isSaving.value) return

    isSaving.value = true
    try {
        await updateServiceOrderNote(props.orderId, noteId, editContent.value)
        isEditing.value = null
        toast.success('Note updated')
        fetchNotes()
    } catch (error) {
        console.error('Failed to update note', error)
        toast.error('Failed to update note')
    } finally {
        isSaving.value = false
    }
}

const confirmDelete = (noteId: string) => {
    deleteId.value = noteId
}

const handleDelete = async () => {
    if (!deleteId.value) return
    isDeleting.value = true
    try {
        await deleteServiceOrderNote(props.orderId, deleteId.value)
        deleteId.value = null
        toast.success('Note deleted')
        fetchNotes()
    } catch (error) {
        console.error('Failed to delete note', error)
        toast.error('Failed to delete note')
    } finally {
        isDeleting.value = false
    }
}
</script>
<template>
    <div class="space-y-3">
        <div class="flex items-center justify-between">
            <label class="text-[10px] font-bold uppercase tracking-wider text-slate-400 pl-1 flex items-center gap-1">
                <StickyNote class="h-3 w-3" />
                Notes
            </label>
            <Button 
                v-if="!isAdding" 
                variant="ghost" 
                size="sm" 
                class="h-6 w-6 p-0 hover:bg-slate-100 rounded-full" 
                @click="isAdding = true"
            >
                <Plus class="h-3.5 w-3.5 text-slate-500" />
            </Button>
        </div>

        <!-- Add Form -->
        <div v-if="isAdding" class="bg-white rounded-lg border border-slate-200 p-2 shadow-sm animate-in fade-in slide-in-from-top-1">
            <Textarea 
                v-model="newNoteContent" 
                placeholder="Type note..." 
                class="min-h-[60px] text-xs resize-none mb-2 focus-visible:ring-1"
                autofocus
                :disabled="isAdding === 'loading'"
            />
            <div class="flex justify-end gap-1">
                <Button variant="ghost" class="h-6 px-2 text-xs" @click="isAdding = false" :disabled="isAdding === 'loading'">Cancel</Button>
                <Button class="h-6 px-2 text-xs" @click="handleAddNote" :disabled="!newNoteContent.trim() || isAdding === 'loading'">
                    <Loader2 v-if="isAdding === 'loading'" class="h-3 w-3 animate-spin mr-1" />
                    {{ isAdding === 'loading' ? 'Saving...' : 'Save' }}
                </Button>
            </div>
        </div>

        <!-- Notes List -->
        <div class="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
            <div v-if="loading && notes.length === 0" class="py-4 flex justify-center">
                <Loader2 class="h-4 w-4 animate-spin text-slate-400" />
            </div>
            
            <div v-else-if="notes.length === 0 && !isAdding" class="text-center py-6 border-2 border-dashed rounded-lg border-slate-100">
                <p class="text-[10px] text-slate-400">No notes added</p>
                <Button variant="link" size="sm" class="h-auto p-0 text-[10px]" @click="isAdding = true" type="button">Add a note</Button>
            </div>

            <div v-for="note in notes" :key="note.id" class="group bg-amber-50/40 hover:bg-amber-50/70 border border-amber-100/60 rounded-lg p-3 text-xs transition-colors relative">
                
                <!-- Edit Mode -->
                <template v-if="isEditing === note.id">
                    <Textarea 
                        v-model="editContent" 
                        class="min-h-[60px] text-xs resize-none mb-2 bg-white"
                    />
                    <div class="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" class="h-5 w-5" @click="cancelEdit" type="button" :disabled="isSaving"><X class="h-3 w-3" /></Button>
                        <Button size="icon" variant="ghost" class="h-5 w-5 text-green-600" @click="saveEdit(note.id)" type="button" :disabled="isSaving">
                            <Loader2 v-if="isSaving" class="h-3 w-3 animate-spin" />
                            <Check v-else class="h-3 w-3" />
                        </Button>
                    </div>
                </template>

                <!-- View Mode -->
                <template v-else>
                    <div class="flex justify-between items-start gap-2 mb-1">
                        <span class="text-[10px] font-medium text-amber-800/60">
                            {{ new Date(note.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }}
                        </span>
                        <div class="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <button class="p-1 hover:text-blue-600 transition-colors" @click="startEdit(note)" type="button">
                                <Pencil class="h-2.5 w-2.5" />
                            </button>
                            <button class="p-1 hover:text-red-600 transition-colors" @click="confirmDelete(note.id)" type="button">
                                <Trash2 class="h-2.5 w-2.5" />
                            </button>
                        </div>
                    </div>
                    <p class="text-slate-700 whitespace-pre-wrap leading-relaxed">{{ note.content }}</p>
                </template>
            </div>
        </div>

        <Dialog :open="!!deleteId" @update:open="(val) => !val && (deleteId = null)">
            <DialogContent class="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Delete Note</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete this note? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" @click="deleteId = null">Cancel</Button>
                    <Button variant="destructive" @click="handleDelete" :disabled="isDeleting">
                        {{ isDeleting ? 'Deleting...' : 'Delete' }}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
    width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background: #e2e8f0;
    border-radius: 2px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #cbd5e1;
}
</style>
