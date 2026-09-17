<template>
  <section class="hero-gradient relative text-center py-20 text-white">
    <div class="container mx-auto px-4">
      <h2 class="text-4xl md:text-5xl font-bold mb-6">
        甲烷減排 × 氣候價值鏈解決方案
      </h2>
      <p class="text-lg mb-8 max-w-3xl mx-auto">
        海門冬四分孢子體技術，降低畜牧業甲烷排放，創造可永續的海洋資源價值
      </p>
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <a href="/solutions" class="btn btn-primary">探索解決方案</a>
        <a href="/evidence" class="btn btn-outline">瀏覽證據</a>
      </div>
    </div>
    <div class="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white to-transparent"></div>
  </section>
</template>

<script setup>
</script>

<style scoped>
.hero-gradient {
  background: linear-gradient(135deg, #2878B5 0%, #073B4C 100%);
}
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  font-size: 1rem;
}
.btn-primary {
  background-color: #C64B3C;
  color: white;
}
.btn-primary:hover {
  background-color: #a33b30;
}
.btn-outline {
  background-color: transparent;
  border: 2px solid white;
  color: white;
}
.btn-outline:hover {
  background-color: white;
  color: #073B4C;
}
</style>