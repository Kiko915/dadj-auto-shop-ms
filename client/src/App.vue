<script setup>
import { useSEO } from '@/composables/useSEO'
import GlobalLoader from '@/components/common/GlobalLoader.vue'
import { Toaster } from '@/components/ui/sonner'
import 'vue-sonner/style.css'

// Default SEO configuration for the entire app
useSEO({
  // This will be the fallback when no specific page SEO is set
  title: '',  // Will use default from composable
  description: '', // Will use default from composable
  type: 'website'
})
</script>

<template>
  <div id="app">
    <router-view></router-view>
    <GlobalLoader />
    <Toaster rich-colors />
  </div>
</template>
