<template>
  <div id="app">
    <h1>Project Initial Checkup</h1>
    
    <FSSmokeTest />

    <router-view></router-view>
  </div>
</template>

<script setup>
// Assuming you have this component in the correct path
import FSSmokeTest from './components/FSSmokeTest.vue';
</script>