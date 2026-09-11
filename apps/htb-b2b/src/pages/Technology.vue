<template>
  <div class="min-h-screen bg-sand-white py-20">
    <div class="container mx-auto px-4">
      <h1 class="text-4xl font-bold text-ink-gray mb-8">核心技術</h1>
      <p class="text-lg text-secondary mb-12">
        海門冬四分孢子體技術的科學基礎與應用
      </p>
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        <TechCard title="海門冬科學" description="物種鑑定、培養條件、活性機制" />
        <TechCard title="種源養殖" description="純化保存、環境控制、配方優化" />
        <TechCard title="保存與飼料化" description="活性保持、乾燥技術、品質管控" />
        <TechCard title="MRV" description="監測、報告、查證系統" />
        <TechCard title="Nuber" description="雲端平台、資料治理、即時監測" />
        <TechCard title="法規合規" description="台灣、國際市場准入" />
      </div>
    </div>
  </div>
</template>

<script setup>
import TechCard from '../components/TechCard.vue'
</script>