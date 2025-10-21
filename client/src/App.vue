<script setup>
import { useSEO } from '@/composables/useSEO'

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
  </div>
</template>
