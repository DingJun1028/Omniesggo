<template>
  <section class="hero-gradient relative overflow-hidden py-20 text-white text-center">
    <div class="container mx-auto px-4 relative z-10">
      <div class="max-w-4xl mx-auto">
        <span class="inline-block px-4 py-2 bg-tech-blue/30 rounded-full text-sm mb-4 border border-white/20">
          海洋永續 × 甲烷減排
        </span>
        <h1 class="text-4xl md:text-6xl font-bold mb-6 leading-tight">
          從海洋到牧場<br />
          打造低碳畜牧價值鏈
        </h1>
        <p class="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
          高科生技運用海門冬四分孢子體技術，協助畜牧業降低甲烷排放，
          創造可衡量的氣候價值與永續經濟
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="/solutions" class="btn-primary px-8 py-4 text-lg">
            探索解決方案
          </a>
          <a href="/evidence" class="btn-outline border-white text-white hover:bg-white hover:text-ink-gray px-8 py-4 text-lg">
            瀏覽證據
          </a>
        </div>
      </div>
    </div>
    <!-- 裝飾性背景元素 -->
    <div class="absolute inset-0 opacity-10">
      <div class="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
      <div class="absolute bottom-10 right-10 w-48 h-48 bg-ocean-cyan rounded-full blur-3xl"></div>
    </div>
  </section>
</template>

<script setup>
</script>

<style scoped>
.hero-gradient {
  background: linear-gradient(135deg, #073B4C 0%, #2878B5 50%, #159A9C 100%);
}

.btn-primary {
  background-color: #C64B3C;
  color: white;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  background-color: #a33b30;
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.2);
}

.btn-outline {
  background-color: transparent;
  border: 2px solid;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.bg-tech-blue\/30 {
  background-color: rgba(40, 120, 181, 0.3);
}
</style>