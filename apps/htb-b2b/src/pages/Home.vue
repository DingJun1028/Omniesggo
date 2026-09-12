<template>
  <div class="min-h-screen bg-white flex flex-col justify-between">
    <Header />
    <main>
      <!-- H01: 首頁 Hero 橫幅 -->
      <HeroHome />

      <!-- H03: 端到端五步閉環 -->
      <SolutionFlow />

      <!-- H04: 四大核心能力 -->
      <CoreCapabilities />

      <!-- H05: 5T 證據快照中心 -->
      <EvidenceSnapshot />

      <!-- H06: 四大受眾分流 -->
      <AudienceCards />
    </main>
    <Footer />
  </div>
</template>

<script setup>
import Header from '../components/Header.vue'
import Footer from '../components/Footer.vue'
import HeroHome from '../components/HeroHome.vue'
import SolutionFlow from '../components/SolutionFlow.vue'
import CoreCapabilities from '../components/CoreCapabilities.vue'
import EvidenceSnapshot from '../components/EvidenceSnapshot.vue'
import AudienceCards from '../components/AudienceCards.vue'
</script>