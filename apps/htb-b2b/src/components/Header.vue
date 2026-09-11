<template>
  <header class="bg-deep-blue text-white sticky top-0 z-50 shadow-lg">
    <div class="container mx-auto px-4 py-4 flex justify-between items-center">
      <h1 class="text-2xl font-bold">
        <span class="text-gold">High-Tech Seaweed</span>
      </h1>
      <nav class="hidden md:flex space-x-6">
        <a href="/solutions" class="hover:text-gold transition-colors">解決方案</a>
        <a href="/technology" class="hover:text-gold transition-colors">技術</a>
        <a href="/evidence" class="hover:text-gold transition-colors">證據</a>
        <a href="/contact" class="hover:text-gold transition-colors">聯絡</a>
      </nav>
    </div>
  </header>
</template>

<script setup>
import { ref } from 'vue'
</script>

<style scoped>
.bg-deep-blue { background-color: #073B4C; }
.text-gold { color: #AE7B24; }
</style>