import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useServerStatusStore = defineStore('serverStatus', () => {
    const isChecking = ref(false)
    const isWakingUp = ref(false)

    function setChecking(status) {
        isChecking.value = status
    }

    function setWakingUp(status) {
        isWakingUp.value = status
    }

    return {
        isChecking,
        isWakingUp,
        setChecking,
        setWakingUp
    }
})
