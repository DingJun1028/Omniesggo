<template>
  <section class="relative overflow-hidden bg-slate-900 text-white py-24 lg:py-36">
    <!-- 真實海門冬背景照片 + 科技暗色漸層遮罩 -->
    <div class="absolute inset-0 z-0">
      <img src="/images/hero-seaweed-macro.jpg" alt="海門冬天然活性生長" class="w-full h-full object-cover object-center opacity-25 filter scale-105 transform transition duration-1000" />
      <div class="absolute inset-0 bg-gradient-to-b from-[#0E1B2E]/90 via-[#0E1B2E]/75 to-[#0E1B2E]"></div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
      <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-[#F0F8E9]/10 text-[#84C341] border border-[#84C341]/40 mb-8 backdrop-blur-md">
        <span class="w-2 h-2 rounded-full bg-[#84C341] animate-pulse"></span>
        海門冬生物科技 × 畜牧甲烷減排 × 可驗證數據
      </div>

      <h1 class="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-tight mb-8">
        讓畜牧減碳，<br />
        <span class="text-transparent bg-clip-text bg-gradient-to-r from-[#5BA4D9] via-[#84C341] to-[#84C341]">
          可發生、可驗證、可創價
        </span>
      </h1>

      <p class="max-w-3xl mx-auto text-lg sm:text-xl text-slate-300 leading-relaxed mb-12 font-medium">
        高科生技以海門冬陸基養殖與 MRV 數據技術為核心，協助牧場、乳肉品牌與食品供應鏈有效降低反芻動物甲烷排放，共同打造可信賴的低碳乳肉產品與氣候資產。
      </p>

      <div class="flex flex-col sm:flex-row items-center justify-center gap-5">
        <a href="#solutions" class="btn-brand-primary text-base !py-3.5 !px-8">探索甲烷減排方案</a>
        <a href="/evidence" class="btn-brand-secondary text-base text-white border-white/40 hover:bg-white/10 !py-3.5 !px-8">查看科學證據庫</a>
      </div>
    </div>
  </section>
</template>

<script setup>
</script>