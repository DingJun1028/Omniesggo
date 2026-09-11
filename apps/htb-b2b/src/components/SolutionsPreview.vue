<template>
  <section id="solutions" class="py-20 bg-sand-white">
    <div class="container mx-auto px-4">
      <h3 class="text-3xl font-bold text-center mb-12 text-ink-gray">
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
</template>

<script setup>
import SolutionCard from './SolutionCard.vue'
</script>

<style scoped>
.bg-sand-white { background-color: #F4F1E8; }
.text-ink-gray { color: #172A32; }
</style>