<template>
  <div class="min-h-screen bg-white flex flex-col justify-between">
    <Header />
    <main>
      <!-- H01: 主視覺 Hero 橫幅 -->
      <HeroHome />

      <!-- H03: 端到端五步閉環 -->
      <SolutionFlow />

      <!-- H04: 四大核心能力 -->
      <CoreCapabilities />

      <!-- H05: 5T 證據中心快照 -->
      <EvidenceSnapshot />

      <!-- H06: 四大受眾分流 -->
      <AudienceCards />

      <!-- H07: Nuber 數據協同平台 -->
      <NuberPlatformSection />

      <!-- H08: 示範合作夥伴網絡 -->
      <PartnersSection />

      <!-- H09: 洞察專欄 (補齊少 3) -->
      <InsightsSection />

      <!-- C13: FAQ 常見問答摺疊面板 (補齊少 1) -->
      <FaqSection />

      <!-- H10: 商務合作洽詢 -->
      <ContactSection />
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
import NuberPlatformSection from '../components/NuberPlatformSection.vue'
import PartnersSection from '../components/PartnersSection.vue'
import InsightsSection from '../components/InsightsSection.vue'
import FaqSection from '../components/FaqSection.vue'
import ContactSection from '../components/ContactSection.vue'
</script>