<template>
  <div class="min-h-screen bg-white">
    <!-- H01: 首頁 Hero 橫幅 -->
    <HeroHome />

    <!-- H03: 端到端五步閉環 -->
    <SolutionFlow />

    <!-- H06: 四大受眾分流 -->
    <AudienceCards />
  </div>
</template>

<script setup>
import HeroHome from '../components/HeroHome.vue'
import SolutionFlow from '../components/SolutionFlow.vue'
import AudienceCards from '../components/AudienceCards.vue'
</script>