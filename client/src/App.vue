<template>
  <div id="app" class="min-h-screen bg-background text-foreground p-6">
    <div class="container mx-auto">
      <h1 class="text-3xl font-bold text-center mb-8 text-primary">
        Dad-J Auto Shop Management System
      </h1>
      
      <FSSmokeTest />

      <router-view></router-view>
    </div>
  </div>
</template>

<script setup>
// Assuming you have this component in the correct path
import FSSmokeTest from './components/FSSmokeTest.vue';
</script>