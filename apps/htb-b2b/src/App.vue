<template>
  <div id="app" class="min-h-screen bg-sand-white">
    <Header v-if="!$route.path.startsWith('/404')" />
    <router-view />
    <Footer v-if="!$route.path.startsWith('/404')" />
  </div>
</template>

<script setup>
import Header from './components/Header.vue'
import Footer from './components/Footer.vue'
</script>

<style>
.bg-sand-white { background-color: #F4F1E8; }
</style>