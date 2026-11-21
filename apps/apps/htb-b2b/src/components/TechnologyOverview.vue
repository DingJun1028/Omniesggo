<template>
  <section class="py-20 bg-sand-white">
    <div class="container mx-auto px-4">
      <h2 class="text-3xl font-bold text-center mb-12 text-ink-gray">
        核心技術與科學
      </h2>
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        <TechCard title="海門冬科學" description="物種機制與安全條件" />
        <TechCard title="種源養殖" description="純化與環境控制" />
        <TechCard title="保存與飼料化" description="活性保持與品質批次" />
      </div>
    </div>
  </section>
</template>

<script setup>
import TechCard from './TechCard.vue'
</script>

<style scoped>
.bg-sand-white { background-color: #F4F1E8; }
.text-ink-gray { color: #172A32; }
</style>