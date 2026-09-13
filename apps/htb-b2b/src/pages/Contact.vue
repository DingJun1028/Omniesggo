<template>
  <div class="min-h-screen bg-slate-50 flex flex-col justify-between">
    <Header />

    <main class="py-16">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#F0F8E9] text-[#84C341] border border-[#84C341]/30 mb-4">
            商務與科研合作
          </div>
          <h1 class="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            與高科生技取得聯繫
          </h1>
          <p class="text-slate-600 text-sm sm:text-base">
            告訴我們您的組織類型與具體需求，專業團隊將於 24 小時內與您聯繫對接。
          </p>
        </div>

        <div class="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-sm mb-12">
          <ContactSection />
        </div>

        <!-- 官方聯絡資訊卡片 -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div class="bg-white p-6 rounded-2xl border border-slate-200/80">
            <div class="text-xs font-bold text-slate-400 uppercase mb-2">官方聯絡信箱</div>
            <div class="text-sm font-bold text-slate-900">info@hsu-kc.com</div>
          </div>
          <div class="bg-white p-6 rounded-2xl border border-slate-200/80">
            <div class="text-xs font-bold text-slate-400 uppercase mb-2">商業合作諮詢</div>
            <div class="text-sm font-bold text-[#4280BD]">牧場試點 / 品牌授權</div>
          </div>
          <div class="bg-white p-6 rounded-2xl border border-slate-200/80">
            <div class="text-xs font-bold text-slate-400 uppercase mb-2">技術與科學交流</div>
            <div class="text-sm font-bold text-[#84C341]">產學合作 / 方法學研擬</div>
          </div>
        </div>
      </div>
    </main>

    <Footer />
  </div>
</template>

<script setup>
import Header from '../components/Header.vue'
import Footer from '../components/Footer.vue'
import ContactSection from '../components/ContactSection.vue'
</script>