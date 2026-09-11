<template>
  <div class="min-h-screen bg-surface">
    <!-- Header -->
    <header class="bg-deep-blue text-white shadow-lg sticky top-0 z-50">
      <div class="container mx-auto px-4 py-4 flex justify-between items-center">
        <h1 class="text-2xl font-bold">
          <span class="text-gold">High-Tech Seaweed</span> B2B
        </h1>
        <nav class="hidden md:flex space-x-6">
          <a href="#solutions" class="hover:text-gold transition-colors">解決方案</a>
          <a href="#technology" class="hover:text-gold transition-colors">技術</a>
          <a href="#evidence" class="hover:text-gold transition-colors">證據</a>
          <a href="#contact" class="hover:text-gold transition-colors">聯絡</a>
        </nav>
        <button class="md:hidden" @click="mobileMenuOpen = !mobileMenuOpen">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path v-if="!mobileMenuOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
            <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    </header>

    <!-- Hero Section -->
    <section class="hero-gradient relative overflow-hidden">
      <div class="container mx-auto px-4 py-20 text-center">
        <div class="max-w-3xl mx-auto">
          <h2 class="text-4xl md:text-5xl font-bold mb-6 text-primary">
            甲烷減排 × 氣候價值鏈解決方案
          </h2>
          <p class="text-lg mb-8 text-secondary">
            海門冬四分孢子體技術，降低畜牧業甲烷排放，創造可永續的海洋資源價值
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#solutions" class="btn btn-primary">
              探索解決方案
            </a>
            <a href="#evidence" class="btn btn-outline">
              瀏覽證據
            </a>
          </div>
        </div>
      </div>
      <div class="absolute bottom-0 left-0 w-full h-32 bg-gradients-merge"></div>
    </section>

    <!-- Solutions Preview -->
    <section id="solutions" class="py-20 bg-surface">
      <div class="container mx-auto px-4">
        <h3 class="text-3xl font-bold text-center mb-12 text-primary">
          四類受眾解決方案
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <SolutionCard 
            title="牧場與酪農"
            icon="🏭"
            description="減排服務與五步流程"
          />
          <SolutionCard 
            title="乳肉與食品品牌"
            icon="🥛"
            description="低碳主張與供應鏈證據"
          />
          <SolutionCard 
            title="企業Scope 3"
            icon="📊"
            description="MRV平台與自燃減量"
          />
          <SolutionCard 
            title="政府與研究"
            icon="🏛️"
            description="政策可複製性與示範場域"
          />
        </div>
      </div>
    </section>

    <!-- Technology Overview -->
    <section id="technology" class="py-20 bg-surface-light">
      <div class="container mx-auto px-4">
        <h3 class="text-3xl font-bold text-center mb-12 text-primary">
          核心技術與科學
        </h3>
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <TechCard 
            title="海門冬科學"
            description="物種機制與安全條件"
          />
          <TechCard 
            title="種源養殖"
            description="純化與環境控制"
          />
          <TechCard 
            title="保存與飼料化"
            description="活性保持與品質批次"
          />
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="bg-ink-gray text-white py-12">
      <div class="container mx-auto px-4">
        <div class="grid md:grid-cols-3 gap-8">
          <div>
            <h4 class="font-bold mb-4">High-Tech Seaweed</h4>
            <p class="text-sm text-gray-300">
              © 2026 高科生技股份有限公司<br>
              資訊安全與隱私政策 | 條款使用
            </p>
          </div>
          <div>
            <h4 class="font-bold mb-4">快速連結</h4>
            <ul class="space-y-2 text-sm">
              <li><a href="#about" class="hover:text-gold transition-colors">關於我們</a></li>
              <li><a href="#contact" class="hover:text-gold transition-colors">聯絡方式</a></li>
            </ul>
          </div>
          <div>
            <h4 class="font-bold mb-4">聯絡資訊</h4>
            <p class="text-sm text-gray-300">
              info@hsu-kc.com<br>
              +886 2 1234 5678
            </p>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const mobileMenuOpen = ref(false)
</script>

<style scoped>
.bg-deep-blue { background-color: var(--htb-deep-sea); }
.bg-surface { background-color: var(--htb-sand-white); }
.bg-surface-light { background-color: var(--htb-sand-white); }
.bg-ink-gray { background-color: var(--htb-ink-gray); }
.text-primary { color: var(--htb-ink-gray); }
.text-secondary { color: var(--htb-pasture-green); }
.text-gold { color: var(--htb-evidence-gold); }
.hero-gradient {
  background: linear-gradient(135deg, var(--htb-tech-blue) 0%, var(--htb-deep-sea) 100%);
}
</style>