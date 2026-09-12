<template>
  <div class="min-h-screen bg-white flex flex-col justify-between">
    <Header />

    <main class="py-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- 關於高科 Hero -->
        <div class="max-w-3xl mb-16">
          <span class="text-xs font-bold tracking-widest text-[#4280BD] uppercase px-3 py-1 bg-[#EBF3FA] rounded-full">
            關於高科生技
          </span>
          <h1 class="text-4xl sm:text-5xl font-extrabold text-slate-900 mt-4 mb-6 tracking-tight">
            以海洋生物科技，賦能農業氣候行動
          </h1>
          <p class="text-slate-600 text-lg leading-relaxed">
            高科生技（Hi-Tek Biotech Inc.）成立於 2022 年，專注於海門冬陸基高密度養殖、保存飼料化製程與畜牧甲烷減排數據平台開發。我們致力於讓反芻動物減排成為可精確量測、可驗證、且能為畜牧農民創造真實價值的綠色工程。
          </p>
        </div>

        <!-- 願景、使命與 5T 治理 -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          <div class="p-8 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div class="w-10 h-10 rounded-xl bg-[#84C341]/20 text-[#84C341] font-black flex items-center justify-center mb-4">V</div>
            <h3 class="text-xl font-bold text-slate-900 mb-2">企業願景</h3>
            <p class="text-xs text-slate-600 leading-relaxed">成為亞洲領先的海藻氣候科技先驅，使永續低碳乳肉成為全球糧食供應鏈的主流標準。</p>
          </div>
          <div class="p-8 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div class="w-10 h-10 rounded-xl bg-[#4280BD]/20 text-[#4280BD] font-black flex items-center justify-center mb-4">M</div>
            <h3 class="text-xl font-bold text-slate-900 mb-2">核心使命</h3>
            <p class="text-xs text-slate-600 leading-relaxed">將分散的科研技術轉化為牧場可負擔、易操作的標準化產品，連結可查驗的碳資產平台。</p>
          </div>
          <div class="p-8 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div class="w-10 h-10 rounded-xl bg-[#C9A24B]/20 text-[#C9A24B] font-black flex items-center justify-center mb-4">5T</div>
            <h3 class="text-xl font-bold text-slate-900 mb-2">5T 治理原則</h3>
            <p class="text-xs text-slate-600 leading-relaxed">可溯源 (Traceable)、可追蹤 (Trackable)、可感知 (Tangible)、可透明 (Transparent)、不可篡改 (Trustworthy)。</p>
          </div>
        </div>

        <!-- 核心團隊與專家 (補齊少 2) -->
        <TeamSection />

        <!-- 官方聯絡資訊 -->
        <div class="mt-20 p-10 rounded-3xl bg-[#0E1B2E] text-white flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h3 class="text-2xl font-bold mb-2">準備好與我們共同探索示範合作？</h3>
            <p class="text-slate-400 text-sm">歡迎產業界夥伴、農民團體與研究機構隨時與我們取得聯繫。</p>
          </div>
          <a href="/contact" class="btn-brand-primary whitespace-nowrap !py-3.5 !px-8 text-base">
            立即洽詢合作
          </a>
        </div>
      </div>
    </main>

    <Footer />
  </div>
</template>

<script setup>
import Header from '../components/Header.vue'
import Footer from '../components/Footer.vue'
import TeamSection from '../components/TeamSection.vue'
</script>