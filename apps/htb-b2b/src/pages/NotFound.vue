<template>
  <div class="min-h-screen bg-slate-50 flex flex-col">
    <Header />
    <main class="flex-1 flex items-center justify-center py-24">
      <div class="text-center max-w-md mx-auto px-4">
        <h1 class="text-9xl font-extrabold text-slate-200 mb-4">404</h1>
        <h2 class="text-2xl font-bold text-slate-900 mb-4">頁面未找到</h2>
        <p class="text-slate-600 text-sm mb-8">
          您存取的頁面不存在或已被移除。請檢查 URL 或返回首頁。
        </p>
        <router-link to="/" class="btn-brand-primary text-sm">返回首頁</router-link>
      </div>
    </main>
    <Footer />
  </div>
</template>

<script setup>
import Header from '../components/Header.vue'
import Footer from '../components/Footer.vue'
</script>
