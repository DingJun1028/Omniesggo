<template>
  <header class="navbar" role="navigation" aria-label="主導覽">
    <div class="container navbar-inner">
      <a href="/" class="navbar-brand">
        <span class="text-primary">High-Tech</span> Seaweed
      </a>

      <button 
        class="navbar-toggle" 
        @click="$emit('toggle-menu')"
        aria-label="切換選單"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <ul class="navbar-nav">
        <li><a href="/">首頁</a></li>
        <li><a href="/solutions">解決方案</a></li>
        <li><a href="/technology">技術</a></li>
        <li><a href="/evidence">證據</a></li>
        <li><a href="/about">關於</a></li>
        <li><a href="/contact">聯絡</a></li>
      </ul>
    </div>
  </header>
</template>

<script setup>
defineEmits(['toggle-menu'])
</script>