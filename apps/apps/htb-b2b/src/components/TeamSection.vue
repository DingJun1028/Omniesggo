<template>
  <section id="team" class="py-24 bg-slate-50 border-t border-slate-100">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center max-w-3xl mx-auto mb-16">
        <span class="text-xs font-bold tracking-widest text-[#84C341] uppercase px-3 py-1 bg-[#F0F8E9] rounded-full">專業領航</span>
        <h2 class="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-4 mb-3">跨域科研與產業顧問核心團隊</h2>
        <p class="text-slate-600 text-sm sm:text-base">結合海洋藻類生物學、反芻動物精準營養與氣候數據法規專家。</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div v-for="(m, idx) in members" :key="idx" class="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-sm hover:border-[#4280BD] transition duration-300 flex flex-col justify-between">
          <div>
            <!-- 頭像與標籤 -->
            <div class="flex items-center gap-4 mb-6">
              <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#4280BD] to-[#84C341] flex items-center justify-center text-white text-2xl font-black shadow-md">
                {{ m.avatarText }}
              </div>
              <div>
                <h3 class="font-bold text-slate-900 text-lg">{{ m.name }}</h3>
                <div class="text-xs font-semibold text-[#4280BD]">{{ m.role }}</div>
              </div>
            </div>

            <div class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">專業領域</div>
            <p class="text-sm text-slate-700 font-medium mb-4">{{ m.expertise }}</p>

            <div class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">主要背景</div>
            <p class="text-xs text-slate-500 leading-relaxed">{{ m.bio }}</p>
          </div>

          <div class="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>官方顧問成員</span>
            <span class="text-[#84C341] font-semibold">5T 專業審定</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
const members = [
  {
    name: '海洋藻類生物學研發組',
    role: '種源繁育與陸基養殖主持人',
    avatarText: '海',
    expertise: '海門冬生活史調控、四分孢子體誘導與高密度循環水純化培養',
    bio: '專注於亞熱帶藻種選育與環境控制，主導技術移轉落實與全天候陸基養殖基地建置。'
  },
  {
    name: '反芻動物營養與試驗組',
    role: '畜牧餵飼與臨床試驗主持人',
    avatarText: '畜',
    expertise: '瘤胃微生物發酵生理、TMR 日糧精準配比、乳牛採食適口性監測',
    bio: '具多年現場畜牧試飼規劃經驗，負責設計體內試飼方案與牛隻生長性能及乳肉品質追蹤。'
  },
  {
    name: '氣候數據與 MRV 治理組',
    role: '碳資產與 Nuber 平台架構師',
    avatarText: '數',
    expertise: 'Verra VM0041 方法學研析、ISO 14064 溫室氣體盤查、物聯網感測演算法',
    bio: '負責 Nuber 平台核心數據邏輯開發，確保所有減碳量測具備第三方獨立查核與可溯源性。'
  }
]
</script>