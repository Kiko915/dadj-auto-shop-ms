<template>
  <Transition name="slide-up">
    <div v-if="serverStatusStore.isWakingUp" class="server-awake-toast">
      <div class="toast-content">
        <div class="spinner"></div>
        <div class="text-content">
          <p class="title">Waking up server...</p>
          <p class="description">This may take up to a minute for the first request.</p>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { useServerStatusStore } from '@/stores/serverStatus'

const serverStatusStore = useServerStatusStore()
</script>

<style scoped>
.server-awake-toast {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 10000;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  border-left: 4px solid #000080;
  padding: 1rem;
  max-width: 24rem;
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.spinner {
  width: 1.5rem;
  height: 1.5rem;
  border: 2px solid #e5e7eb;
  border-top-color: #000080;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.text-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.title {
  font-weight: 600;
  color: #111827;
  margin: 0;
  font-size: 0.875rem;
}

.description {
  color: #6b7280;
  margin: 0;
  font-size: 0.75rem;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease-out;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Dark mode support if applicable */
@media (prefers-color-scheme: dark) {
  /* Add dark mode styles if the app supports it, currently using light mode defaults as per existing style */
}
</style>
